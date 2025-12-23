import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    // Type-safe access to user property
    const userId = 
      request && 
      typeof request === 'object' && 
      'user' in request && 
      request.user && 
      typeof request.user === 'object' && 
      'id' in request.user && 
      typeof (request.user as { id?: unknown }).id === 'string'
        ? (request.user as { id: string }).id
        : 'anonymous';

    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${url} - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent.substring(0, 100)}`
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // Type-safe access to response statusCode
        const response = context.switchToHttp().getResponse();
        const statusCode = 
          response && 
          typeof response === 'object' && 
          'statusCode' in response && 
          typeof (response as { statusCode?: unknown }).statusCode === 'number'
            ? (response as { statusCode: number }).statusCode
            : 200;

        const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
        this.logger[logLevel](
          `← ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
        );
      })
    );
  }
}








