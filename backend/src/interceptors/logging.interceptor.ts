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
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId}`,
        );

        // Add request metadata to request object for event logging
        if (request.eventMetadata) {
          request.eventMetadata.userAgent = userAgent;
          request.eventMetadata.ipAddress = ip;
        } else {
          request.eventMetadata = {
            userAgent,
            ipAddress: ip,
            timestamp: new Date(),
          };
        }
      }),
    );
  }
}








