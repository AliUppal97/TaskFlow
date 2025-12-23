import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, user, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = user?.id || 'anonymous';

    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - User: ${userId} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // Type-safe access to response statusCode
        const statusCode = 
          response && 
          typeof response === 'object' && 
          'statusCode' in response && 
          typeof (response as { statusCode?: unknown }).statusCode === 'number'
            ? (response as { statusCode: number }).statusCode
            : 200;

        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId}`,
        );

        // Add request metadata to event logging - type-safe access
        if (
          request &&
          typeof request === 'object' &&
          'eventMetadata' in request &&
          request.eventMetadata &&
          typeof request.eventMetadata === 'object'
        ) {
          const metadata = request.eventMetadata as { userAgent?: string; ipAddress?: string; timestamp?: Date };
          metadata.userAgent = userAgent;
          metadata.ipAddress = ip;
        } else if (request && typeof request === 'object') {
          (request as { eventMetadata?: { userAgent: string; ipAddress: string; timestamp: Date } }).eventMetadata = {
            userAgent,
            ipAddress: ip,
            timestamp: new Date(),
          };
        }
      }),
    );
  }
}








