import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('database.host', 'localhost'),
  port: configService.get('database.port', 5432),
  username: configService.get('database.username', 'postgres'),
  password: configService.get('database.password', 'password'),
  database: configService.get('database.name', 'taskflow'),
  entities: [User, Task],
  synchronize: configService.get('app.nodeEnv') !== 'production', // Disable in production
  logging: configService.get('app.nodeEnv') === 'development',
  ssl: configService.get('app.nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  extra: {
    max: 20, // Maximum number of connections
    min: 5,  // Minimum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  // Migrations (when we add them)
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
});



