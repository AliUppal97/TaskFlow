import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
import { DataSource, EntityManager } from 'typeorm';

export interface TransactionContext {
  transactionalEntityManager: EntityManager;
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Add transaction manager to request context
    const request = context.switchToHttp().getRequest();
    request.transactionalEntityManager = queryRunner.manager;

    return next.handle().pipe(
      tap(async () => {
        // Commit transaction on success
        await queryRunner.commitTransaction();
        this.logger.debug('Transaction committed successfully');
      }),
      catchError(async (error: unknown) => {
        // Rollback transaction on error
        await queryRunner.rollbackTransaction();
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Transaction rolled back due to error: ${errorMessage}`);
        throw error;
      }),
      tap(async () => {
        // Always release the query runner
        await queryRunner.release();
      })
    );
  }
}




