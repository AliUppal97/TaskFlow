import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
    method: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: Record<string, unknown> | undefined = undefined;

    // Handle known exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        code = responseObj.code || this.getHttpStatusCode(status);
        details = responseObj.details;
      }
    } else if (exception instanceof QueryFailedError) {
      // TypeORM query errors
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_QUERY_ERROR';

      if (exception.message.includes('duplicate key value')) {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this information already exists';
      } else if (exception.message.includes('violates foreign key constraint')) {
        status = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Invalid reference to another record';
      } else if (exception.message.includes('violates not-null constraint')) {
        status = HttpStatus.BAD_REQUEST;
        code = 'REQUIRED_FIELD_MISSING';
        message = 'A required field is missing';
      } else {
        message = 'Database query failed';
      }

      this.logger.error(`Database query error: ${exception.message}`, exception.stack);
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      code = 'ENTITY_NOT_FOUND';
      message = 'The requested resource was not found';
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'DATABASE_ERROR';
      message = 'Database operation failed';
      this.logger.error(`TypeORM error: ${exception.message}`, exception.stack);
    } else if (exception instanceof Error) {
      // Generic error handling
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        details = exception.message;
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'UNAUTHORIZED';
        message = 'Authentication required';
      } else if (exception.name === 'ForbiddenError') {
        status = HttpStatus.FORBIDDEN;
        code = 'FORBIDDEN';
        message = 'Access denied';
      } else {
        // Log unexpected errors
        this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
        message = 'An unexpected error occurred';
      }
    }

    // Log the error
    const logLevel = status >= 500 ? 'error' : 'warn';
    this.logger[logLevel](
      `${request.method} ${request.url} - ${status} ${code}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception)
    );

    // Send error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    response.status(status).json(errorResponse);
  }

  private getHttpStatusCode(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusMap[status] || 'UNKNOWN_ERROR';
  }
}







