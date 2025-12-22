import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
}

@Injectable()
export class LoggerService extends Logger {
  constructor(private configService: ConfigService) {
    super('AppLogger');
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  error(message: string | Error, trace?: string, context?: string): void {
    const formattedMessage = this.formatMessage(LogLevel.ERROR, String(message), undefined);
    super.error(formattedMessage, trace, context);
  }

  warn(message: string | Error, context?: string): void {
    const formattedMessage = this.formatMessage(LogLevel.WARN, String(message), undefined);
    super.warn(formattedMessage, context);
  }

  log(message: string, context?: string): void {
    const formattedMessage = this.formatMessage(LogLevel.INFO, String(message), undefined);
    super.log(formattedMessage, context);
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    super.log(formattedMessage);
  }

  debug(message: string, context?: string): void {
    if (this.configService.get('app.nodeEnv') === 'development') {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, String(message), undefined);
      super.debug(formattedMessage, context);
    }
  }

  verbose(message: string, context?: string): void {
    if (this.configService.get('app.nodeEnv') === 'development') {
      const formattedMessage = this.formatMessage(LogLevel.VERBOSE, String(message), undefined);
      super.verbose(formattedMessage, context);
    }
  }

  // Specialized logging methods
  logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const fullContext = { ...context, method, url, statusCode, duration };
    const message = `${method} ${url} - ${statusCode} - ${duration}ms`;
    const formattedMessage = this.formatMessage(level, message, fullContext);
    
    if (level === LogLevel.ERROR) {
      super.error(formattedMessage);
    } else if (level === LogLevel.WARN) {
      super.warn(formattedMessage);
    } else {
      super.log(formattedMessage);
    }
  }

  logAuthEvent(event: string, userId: string, success: boolean, context?: LogContext): void {
    const message = `Auth ${event} - User: ${userId} - Success: ${success}`;
    const fullContext = { ...context, userId, success };
    const formattedMessage = this.formatMessage(
      success ? LogLevel.INFO : LogLevel.WARN,
      message,
      fullContext
    );
    if (success) {
      super.log(formattedMessage);
    } else {
      super.warn(formattedMessage);
    }
  }

  logDatabaseOperation(operation: string, table: string, duration: number, context?: LogContext): void {
    const message = `DB ${operation} on ${table} - ${duration}ms`;
    const fullContext = { ...context, operation, table, duration };
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, fullContext);
    super.log(formattedMessage);
  }

  logCacheOperation(operation: string, key: string, hit: boolean, duration?: number, context?: LogContext): void {
    const message = `Cache ${operation} - Key: ${key} - Hit: ${hit}${duration ? ` - ${duration}ms` : ''}`;
    const fullContext = { ...context, operation, key, hit, duration };
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, fullContext);
    if (this.configService.get('app.nodeEnv') === 'development') {
      super.debug(formattedMessage);
    }
  }

  logWebSocketEvent(event: string, clientId: string, userId?: string, context?: LogContext): void {
    const message = `WS ${event} - Client: ${clientId}${userId ? ` - User: ${userId}` : ''}`;
    const fullContext = { ...context, event: event, clientId, userId };
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, fullContext);
    super.log(formattedMessage);
  }

  logBusinessEvent(event: string, entityType: string, entityId: string, userId: string, context?: LogContext): void {
    const message = `Business ${event} - ${entityType}:${entityId} - User: ${userId}`;
    const fullContext = { ...context, event: event, entityType, entityId, userId };
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, fullContext);
    super.log(formattedMessage);
  }
}



