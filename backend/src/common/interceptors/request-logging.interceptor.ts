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
    const userId = (request as any).user?.id || 'anonymous';

    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${url} - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent.substring(0, 100)}`
    );

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
        this.logger[logLevel](
          `← ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
        );
      })
    );
  }
}




