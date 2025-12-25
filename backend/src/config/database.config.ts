import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { Notification } from '../entities/notification.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // Support DATABASE_URL (Railway recommended) or individual variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Use DATABASE_URL if provided (Railway provides this)
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [User, Task, Notification],
      synchronize: configService.get('app.nodeEnv') !== 'production',
      logging: configService.get('app.nodeEnv') === 'development',
      ssl: configService.get('app.nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
      extra: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000, // 30 seconds for Railway
      },
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
    };
  }

  // Fallback to individual variables
  return {
    type: 'postgres',
    host: configService.get('database.host', 'localhost'),
    port: configService.get('database.port', 5432),
    username: configService.get('database.username', 'postgres'),
    password: configService.get('database.password', 'password'),
    database: configService.get('database.name', 'taskflow'),
    entities: [User, Task, Notification],
    synchronize: configService.get('app.nodeEnv') !== 'production',
    logging: configService.get('app.nodeEnv') === 'development',
    ssl: configService.get('app.nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
    extra: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // 30 seconds for Railway
    },
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
  };
};
