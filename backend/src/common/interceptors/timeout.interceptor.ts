import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Timeout Interceptor
 * 
 * Prevents requests from hanging indefinitely
 * 
 * Behavior:
 * - Sets 30 second timeout on all requests
 * - Throws RequestTimeoutException if timeout exceeded
 * - Prevents resource exhaustion from slow/long-running requests
 * 
 * Rationale:
 * - Protects server from hanging connections
 * - Provides clear error message to clients
 * - Allows server to free resources after timeout
 * 
 * Usage: Applied globally in main.ts
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(30000), // 30 seconds timeout (prevents hanging requests)
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timeout'));
        }
        return throwError(() => error);
      })
    );
  }
}



