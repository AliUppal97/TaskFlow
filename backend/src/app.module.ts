import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import redisStore from 'cache-manager-ioredis';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config
import configuration from './config/configuration';
import { getDatabaseConfig } from './config/database.config';
import { getMongoConfig } from './config/mongodb.config';
import { getRedisConfig } from './config/redis.config';

// Entities - removed unused imports

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { EventsModule } from './modules/events/events.module';
import { CacheService } from './common/cache/cache.service';

/**
 * Root application module - orchestrates all feature modules and global configurations.
 * 
 * Architecture decisions:
 * - Multi-database setup: PostgreSQL for transactional data, MongoDB for event logs (audit trail)
 * - Redis for caching and session management (high-performance, distributed cache)
 * - Global JWT module for token generation/validation across all modules
 * - Rate limiting to prevent API abuse and DDoS attacks
 */
@Module({
  imports: [
    /**
     * Configuration module - loads environment variables from .env files
     * Priority: .env.local (local overrides) > .env (defaults)
     * isGlobal: true makes ConfigService available in all modules without explicit import
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    /**
     * Rate limiting - protects API from abuse
     * Limits: 100 requests per minute per IP address
     * Prevents brute force attacks and ensures fair resource usage
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100, // Maximum requests per window
      },
    ]),

    /**
     * PostgreSQL database (TypeORM) - primary database for transactional data
     * Stores: Users, Tasks, and all relational data
     * Used for: ACID transactions, complex queries, data integrity
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    /**
     * MongoDB - event log storage (audit trail)
     * Stores: Event logs, audit history, activity tracking
     * Used for: High-volume write operations, flexible schema for event payloads
     * Rationale: Separating audit logs from transactional DB improves performance and scalability
     */
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),

    /**
     * Redis cache - high-performance caching layer
     * Used for: Session storage, query result caching, token blacklisting
     * Benefits: Reduces database load, improves response times, enables distributed caching
     */
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisConfig = getRedisConfig(configService);
        return {
          store: redisStore as unknown,
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          ttl: redisConfig.ttl,
        };
      },
      inject: [ConfigService],
      isGlobal: true, // Available in all modules without explicit import
    }),

    /**
     * JWT module - token generation and validation
     * Global: true makes JwtService available across all modules
     * Used for: Access token signing (refresh tokens use separate secret)
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),

    // Feature Modules
    AuthModule,
    TasksModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
})
export class AppModule {}
