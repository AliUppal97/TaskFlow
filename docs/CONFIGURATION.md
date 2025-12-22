# Configuration Guide

This guide covers all aspects of configuring TaskFlow for different environments and deployment scenarios.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Database Configuration](#database-configuration)
- [Authentication Configuration](#authentication-configuration)
- [WebSocket Configuration](#websocket-configuration)
- [Caching Configuration](#caching-configuration)
- [Logging Configuration](#logging-configuration)
- [Monitoring Configuration](#monitoring-configuration)
- [Security Configuration](#security-configuration)
- [Performance Configuration](#performance-configuration)
- [Environment-Specific Configuration](#environment-specific-configuration)

## Environment Variables

TaskFlow uses environment variables for configuration management. All variables have sensible defaults for development but must be properly configured for production.

### Application Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `NODE_ENV` | `development` | Application environment | Yes |
| `PORT` | `3001` | Backend server port | No |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origins | Yes |

### Database Configuration

#### PostgreSQL Settings

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `DATABASE_HOST` | `localhost` | PostgreSQL host | Yes |
| `DATABASE_PORT` | `5432` | PostgreSQL port | No |
| `DATABASE_USERNAME` | `postgres` | Database username | Yes |
| `DATABASE_PASSWORD` | `password` | Database password | Yes |
| `DATABASE_NAME` | `taskflow` | Database name | Yes |
| `DATABASE_SSL` | `false` | Enable SSL connection | No |
| `DATABASE_MAX_CONNECTIONS` | `20` | Maximum connections | No |
| `DATABASE_IDLE_TIMEOUT` | `30000` | Connection idle timeout (ms) | No |

#### MongoDB Settings

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `MONGODB_URI` | `mongodb://localhost:27017/taskflow` | MongoDB connection URI | Yes |
| `MONGODB_SSL` | `false` | Enable SSL for MongoDB | No |
| `MONGODB_REPLICA_SET` | - | Replica set name | No |

### Authentication & Security

#### JWT Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `JWT_ACCESS_SECRET` | `your-access-secret-key` | JWT access token secret | Yes |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiration | No |
| `JWT_REFRESH_SECRET` | `your-refresh-secret-key` | JWT refresh token secret | Yes |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration | No |
| `JWT_ISSUER` | `taskflow` | JWT token issuer | No |
| `JWT_AUDIENCE` | `taskflow-api` | JWT token audience | No |

#### Security Settings

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds | No |
| `RATE_LIMIT_TTL` | `60000` | Rate limit window (ms) | No |
| `RATE_LIMIT_MAX` | `100` | Max requests per window | No |
| `SESSION_TIMEOUT` | `3600000` | Session timeout (ms) | No |

### Caching & Performance

#### Redis Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `REDIS_HOST` | `localhost` | Redis host | Yes |
| `REDIS_PORT` | `6379` | Redis port | No |
| `REDIS_PASSWORD` | - | Redis password | No |
| `REDIS_DB` | `0` | Redis database number | No |
| `REDIS_TLS` | `false` | Enable TLS for Redis | No |
| `REDIS_CLUSTER` | `false` | Use Redis cluster | No |

#### Cache Settings

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `CACHE_TTL` | `300` | Default cache TTL (seconds) | No |
| `CACHE_MAX_ITEMS` | `1000` | Maximum cached items | No |
| `CACHE_STRATEGY` | `lru` | Cache eviction strategy | No |

### WebSocket Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `WS_CORS_ORIGIN` | `http://localhost:3000` | WebSocket CORS origin | Yes |
| `WS_PATH` | `/socket.io` | WebSocket path | No |
| `WS_PING_TIMEOUT` | `5000` | Ping timeout (ms) | No |
| `WS_PING_INTERVAL` | `25000` | Ping interval (ms) | No |
| `WS_MAX_CONNECTIONS` | `1000` | Maximum connections | No |

### External Services

#### Email Configuration (Future)

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `SMTP_HOST` | - | SMTP server host | No |
| `SMTP_PORT` | `587` | SMTP server port | No |
| `SMTP_USER` | - | SMTP username | No |
| `SMTP_PASS` | - | SMTP password | No |
| `EMAIL_FROM` | `noreply@taskflow.com` | Default from address | No |

#### File Storage (Future)

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `STORAGE_TYPE` | `local` | Storage type (local/s3) | No |
| `AWS_S3_BUCKET` | - | S3 bucket name | No |
| `AWS_REGION` | `us-east-1` | AWS region | No |
| `AWS_ACCESS_KEY` | - | AWS access key | No |
| `AWS_SECRET_KEY` | - | AWS secret key | No |

### Monitoring & Observability

#### Logging Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `LOG_LEVEL` | `info` | Logging level | No |
| `LOG_FORMAT` | `json` | Log format (json/text) | No |
| `LOG_FILE` | `logs/app.log` | Log file path | No |
| `LOG_MAX_SIZE` | `10m` | Maximum log file size | No |
| `LOG_MAX_FILES` | `5` | Maximum log files | No |

#### Metrics & Monitoring

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `METRICS_ENABLED` | `true` | Enable metrics collection | No |
| `METRICS_PORT` | `9090` | Metrics server port | No |
| `SENTRY_DSN` | - | Sentry DSN for error tracking | No |
| `APM_ENABLED` | `false` | Enable APM monitoring | No |

## Configuration Files

### Environment File Structure

Create a `.env` file in the backend directory:

```bash
# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-db-user
DATABASE_PASSWORD=your-secure-db-password
DATABASE_NAME=taskflow_prod

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/taskflow_prod

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password

# JWT (Use strong, unique secrets)
JWT_ACCESS_SECRET=your-super-secure-access-secret-here-32-chars-min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here-32-chars-min
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
PROMETHEUS_METRICS=true
```

### Configuration Validation

TaskFlow validates configuration on startup. Invalid or missing required variables will cause the application to fail fast with clear error messages.

```typescript
// Configuration validation example
export const validateConfig = (config: Record<string, any>) => {
  const required = ['DATABASE_HOST', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
  }

  // Validate JWT secret lengths
  if (config.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
  }

  // Validate database URL format
  if (config.MONGODB_URI && !config.MONGODB_URI.startsWith('mongodb')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }
};
```

## Database Configuration

### PostgreSQL Configuration

#### Connection Pool Settings

```typescript
// backend/src/config/database.config.ts
export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),

  // Connection pool configuration
  extra: {
    max: configService.get('DATABASE_MAX_CONNECTIONS', 20),
    min: configService.get('DATABASE_MIN_CONNECTIONS', 5),
    idleTimeoutMillis: configService.get('DATABASE_IDLE_TIMEOUT', 30000),
    connectionTimeoutMillis: configService.get('DATABASE_CONNECTION_TIMEOUT', 2000),
    acquireTimeoutMillis: configService.get('DATABASE_ACQUIRE_TIMEOUT', 60000),
  },

  // SSL configuration
  ssl: configService.get('DATABASE_SSL', false) ? {
    rejectUnauthorized: false,
    ca: configService.get('DATABASE_SSL_CA'),
    cert: configService.get('DATABASE_SSL_CERT'),
    key: configService.get('DATABASE_SSL_KEY'),
  } : false,

  // Entity and migration configuration
  entities: [User, Task],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('NODE_ENV') === 'development',
});
```

#### PostgreSQL Server Configuration

For production deployments, optimize PostgreSQL server settings:

```postgresql
-- postgresql.conf optimizations
shared_buffers = 256MB                    # 25% of RAM
effective_cache_size = 1GB               # 75% of RAM
work_mem = 4MB                           # Per-connection working memory
maintenance_work_mem = 64MB              # Maintenance operations memory
checkpoint_completion_target = 0.9       # Spread checkpoint I/O
wal_buffers = 16MB                       # WAL buffer size
default_statistics_target = 100          # Statistics target
random_page_cost = 1.1                   # SSD optimization
effective_io_concurrency = 200           # SSD optimization
```

### MongoDB Configuration

#### Connection Configuration

```typescript
// backend/src/config/mongodb.config.ts
export const getMongoConfig = (configService: ConfigService) => ({
  uri: configService.get('MONGODB_URI'),

  // Connection options
  maxPoolSize: configService.get('MONGODB_MAX_POOL_SIZE', 10),
  minPoolSize: configService.get('MONGODB_MIN_POOL_SIZE', 5),
  maxIdleTimeMS: configService.get('MONGODB_MAX_IDLE_TIME', 30000),
  serverSelectionTimeoutMS: configService.get('MONGODB_SERVER_SELECTION_TIMEOUT', 5000),

  // SSL configuration
  ssl: configService.get('MONGODB_SSL', false),
  sslValidate: configService.get('MONGODB_SSL_VALIDATE', true),
  sslCA: configService.get('MONGODB_SSL_CA'),
  sslCert: configService.get('MONGODB_SSL_CERT'),
  sslKey: configService.get('MONGODB_SSL_KEY'),

  // Replica set configuration
  replicaSet: configService.get('MONGODB_REPLICA_SET'),

  // Authentication
  authSource: configService.get('MONGODB_AUTH_SOURCE', 'admin'),
});
```

#### MongoDB Indexes

Critical indexes for performance:

```javascript
// Create indexes on application startup
await db.collection('event_logs').createIndexes([
  { key: { type: 1, createdAt: -1 } },
  { key: { actorId: 1, createdAt: -1 } },
  { key: { entityId: 1, entityType: 1, createdAt: -1 } },
  { key: { correlationId: 1 } },
  { key: { createdAt: -1 } },
  { key: { 'metadata.timestamp': -1 } },
]);
```

## Authentication Configuration

### JWT Token Configuration

#### Token Generation

```typescript
// backend/src/config/jwt.config.ts
export const getJwtConfig = (configService: ConfigService) => ({
  secret: configService.get('JWT_ACCESS_SECRET'),
  signOptions: {
    expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    issuer: configService.get('JWT_ISSUER', 'taskflow'),
    audience: configService.get('JWT_AUDIENCE', 'taskflow-api'),
    algorithm: 'HS256',
  },
  refreshSecret: configService.get('JWT_REFRESH_SECRET'),
  refreshSignOptions: {
    expiresIn: configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: configService.get('JWT_ISSUER', 'taskflow'),
    audience: configService.get('JWT_AUDIENCE', 'taskflow-api'),
  },
});
```

#### Password Security

```typescript
// backend/src/config/security.config.ts
export const getSecurityConfig = (configService: ConfigService) => ({
  bcryptRounds: configService.get('BCRYPT_ROUNDS', 12),

  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Session configuration
  session: {
    timeout: configService.get('SESSION_TIMEOUT', 3600000), // 1 hour
    refreshThreshold: configService.get('SESSION_REFRESH_THRESHOLD', 300000), // 5 minutes
  },

  // Rate limiting
  rateLimit: {
    ttl: configService.get('RATE_LIMIT_TTL', 60000), // 1 minute
    limit: configService.get('RATE_LIMIT_MAX', 100), // requests per ttl
  },
});
```

## WebSocket Configuration

### Socket.IO Configuration

```typescript
// backend/src/config/websocket.config.ts
export const getWebSocketConfig = (configService: ConfigService) => ({
  cors: {
    origin: configService.get('WS_CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },

  // Connection settings
  path: configService.get('WS_PATH', '/socket.io'),
  serveClient: false,
  pingTimeout: configService.get('WS_PING_TIMEOUT', 5000),
  pingInterval: configService.get('WS_PING_INTERVAL', 25000),

  // Security
  allowEIO3: false,
  cookie: false,

  // Performance
  maxHttpBufferSize: configService.get('WS_MAX_BUFFER_SIZE', 1e6), // 1MB
  transports: ['websocket', 'polling'],

  // Connection limits
  maxConnections: configService.get('WS_MAX_CONNECTIONS', 1000),
  connectTimeout: configService.get('WS_CONNECT_TIMEOUT', 10000),
});
```

### Room Management

```typescript
// WebSocket room configuration
export const WS_ROOMS = {
  USER_PERSONAL: (userId: string) => `user:${userId}`,
  TASK_SPECIFIC: (taskId: string) => `task:${taskId}`,
  ADMIN_GLOBAL: 'admin',
  SYSTEM_NOTIFICATIONS: 'system',
} as const;
```

## Caching Configuration

### Redis Cache Configuration

#### Single Instance

```typescript
// backend/src/config/redis.config.ts
export const getRedisConfig = (configService: ConfigService) => ({
  host: configService.get('REDIS_HOST', 'localhost'),
  port: configService.get('REDIS_PORT', 6379),
  password: configService.get('REDIS_PASSWORD'),
  db: configService.get('REDIS_DB', 0),

  // Connection settings
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,

  // TLS configuration
  tls: configService.get('REDIS_TLS') ? {
    rejectUnauthorized: false,
    ca: configService.get('REDIS_TLS_CA'),
    cert: configService.get('REDIS_TLS_CERT'),
    key: configService.get('REDIS_TLS_KEY'),
  } : undefined,
});
```

#### Cluster Configuration

```typescript
// Redis cluster configuration
export const getRedisClusterConfig = (configService: ConfigService) => ({
  cluster: {
    enableReadyCheck: false,
    redisOptions: {
      password: configService.get('REDIS_PASSWORD'),
      tls: configService.get('REDIS_TLS') ? {} : undefined,
    },
  },
  nodes: [
    { host: configService.get('REDIS_HOST_1'), port: 6379 },
    { host: configService.get('REDIS_HOST_2'), port: 6379 },
    { host: configService.get('REDIS_HOST_3'), port: 6379 },
  ],
});
```

### Cache Strategy Configuration

```typescript
// backend/src/config/cache.config.ts
export const getCacheConfig = (configService: ConfigService) => ({
  // Default TTL settings
  ttl: configService.get('CACHE_TTL', 300), // 5 minutes

  // Cache-specific TTLs
  ttls: {
    user: configService.get('CACHE_USER_TTL', 600),     // 10 minutes
    task: configService.get('CACHE_TASK_TTL', 180),      // 3 minutes
    stats: configService.get('CACHE_STATS_TTL', 300),    // 5 minutes
    session: configService.get('CACHE_SESSION_TTL', 3600), // 1 hour
  },

  // Cache limits
  maxItems: configService.get('CACHE_MAX_ITEMS', 1000),

  // Eviction strategy
  strategy: configService.get('CACHE_STRATEGY', 'lru'),

  // Cache warming
  warming: {
    enabled: configService.get('CACHE_WARMING_ENABLED', true),
    interval: configService.get('CACHE_WARMING_INTERVAL', 300000), // 5 minutes
  },
});
```

## Logging Configuration

### Winston Logger Configuration

```typescript
// backend/src/config/logging.config.ts
export const getLoggingConfig = (configService: ConfigService) => {
  const level = configService.get('LOG_LEVEL', 'info');
  const format = configService.get('LOG_FORMAT', 'json');
  const maxSize = configService.get('LOG_MAX_SIZE', '10m');
  const maxFiles = configService.get('LOG_MAX_FILES', 5);

  const transports = [];

  // Console transport
  transports.push(new winston.transports.Console({
    level,
    format: format === 'json'
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        )
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.simple(),
        ),
  }));

  // File transport (production)
  if (configService.get('NODE_ENV') === 'production') {
    transports.push(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      maxsize: bytes(maxSize),
      maxFiles,
    }));

    transports.push(new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      maxsize: bytes(maxSize),
      maxFiles,
    }));
  }

  return {
    level,
    transports,
    exitOnError: false,
  };
};
```

## Monitoring Configuration

### Prometheus Metrics

```typescript
// backend/src/config/metrics.config.ts
export const getMetricsConfig = (configService: ConfigService) => ({
  enabled: configService.get('METRICS_ENABLED', true),
  port: configService.get('METRICS_PORT', 9090),

  // Custom metrics
  metrics: {
    httpRequestsTotal: new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),

    activeConnections: new Gauge({
      name: 'active_connections_total',
      help: 'Number of active connections',
    }),

    responseTime: new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
  },

  // Default metrics
  collectDefaultMetrics: {
    timeout: 5000,
  },
});
```

### Health Checks

```typescript
// backend/src/config/health.config.ts
export const getHealthConfig = (configService: ConfigService) => ({
  // Health check endpoints
  endpoints: {
    readiness: '/health/ready',
    liveness: '/health/live',
    metrics: '/metrics',
  },

  // Component health checks
  checks: {
    database: {
      enabled: true,
      timeout: 5000,
      interval: 30000,
    },

    redis: {
      enabled: true,
      timeout: 5000,
      interval: 30000,
    },

    mongodb: {
      enabled: true,
      timeout: 5000,
      interval: 30000,
    },
  },

  // Health check thresholds
  thresholds: {
    responseTime: configService.get('HEALTH_RESPONSE_TIME_THRESHOLD', 5000),
    errorRate: configService.get('HEALTH_ERROR_RATE_THRESHOLD', 0.05),
    memoryUsage: configService.get('HEALTH_MEMORY_THRESHOLD', 0.9),
  },
});
```

## Security Configuration

### CORS Configuration

```typescript
// backend/src/config/cors.config.ts
export const getCorsConfig = (configService: ConfigService) => ({
  origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
});
```

### Rate Limiting Configuration

```typescript
// backend/src/config/rate-limit.config.ts
export const getRateLimitConfig = (configService: ConfigService) => ({
  // Global rate limiting
  global: {
    ttl: configService.get('RATE_LIMIT_TTL', 60000), // 1 minute
    limit: configService.get('RATE_LIMIT_MAX', 100),  // requests per ttl
  },

  // Endpoint-specific limits
  endpoints: {
    '/auth/login': {
      ttl: 60000,  // 1 minute
      limit: 5,     // 5 login attempts per minute
    },

    '/auth/refresh': {
      ttl: 60000,  // 1 minute
      limit: 10,    // 10 refresh attempts per minute
    },

    '/api/v1/tasks': {
      ttl: 60000,  // 1 minute
      limit: 50,    // 50 task operations per minute
    },
  },

  // IP-based rate limiting
  ipBased: {
    enabled: configService.get('RATE_LIMIT_IP_ENABLED', true),
    ttl: configService.get('RATE_LIMIT_IP_TTL', 900000), // 15 minutes
    limit: configService.get('RATE_LIMIT_IP_MAX', 1000),  // requests per ttl
  },

  // User-based rate limiting
  userBased: {
    enabled: configService.get('RATE_LIMIT_USER_ENABLED', true),
    ttl: configService.get('RATE_LIMIT_USER_TTL', 60000), // 1 minute
    limit: configService.get('RATE_LIMIT_USER_MAX', 200),  // requests per ttl
  },
});
```

## Performance Configuration

### Application Performance

```typescript
// backend/src/config/performance.config.ts
export const getPerformanceConfig = (configService: ConfigService) => ({
  // Request timeout
  requestTimeout: configService.get('REQUEST_TIMEOUT', 30000),

  // Connection pooling
  connectionPool: {
    max: configService.get('CONNECTION_POOL_MAX', 20),
    min: configService.get('CONNECTION_POOL_MIN', 5),
    idleTimeout: configService.get('CONNECTION_POOL_IDLE_TIMEOUT', 30000),
    acquireTimeout: configService.get('CONNECTION_POOL_ACQUIRE_TIMEOUT', 60000),
  },

  // Compression
  compression: {
    enabled: configService.get('COMPRESSION_ENABLED', true),
    level: configService.get('COMPRESSION_LEVEL', 6),
    threshold: configService.get('COMPRESSION_THRESHOLD', 1024),
  },

  // Clustering
  clustering: {
    enabled: configService.get('CLUSTERING_ENABLED', false),
    workers: configService.get('CLUSTERING_WORKERS', 'auto'),
  },

  // Graceful shutdown
  gracefulShutdown: {
    enabled: configService.get('GRACEFUL_SHUTDOWN_ENABLED', true),
    timeout: configService.get('GRACEFUL_SHUTDOWN_TIMEOUT', 30000),
  },
});
```

## Environment-Specific Configuration

### Development Configuration

```bash
# .env.development
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Enable development features
LOG_LEVEL=debug
LOG_FORMAT=text

# Database (local)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=taskflow_dev

# MongoDB (local)
MONGODB_URI=mongodb://localhost:27017/taskflow_dev

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (development secrets - not for production)
JWT_ACCESS_SECRET=dev-access-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=dev-refresh-secret-key-at-least-32-characters-long
JWT_REFRESH_EXPIRES_IN=24h
```

### Staging Configuration

```bash
# .env.staging
NODE_ENV=staging
PORT=3001
CORS_ORIGIN=https://staging.taskflow.com

# Enhanced logging
LOG_LEVEL=info
LOG_FORMAT=json

# Database (managed)
DATABASE_HOST=staging-db.taskflow.com
DATABASE_PORT=5432
DATABASE_USERNAME=taskflow_staging
DATABASE_PASSWORD=secure_staging_password
DATABASE_NAME=taskflow_staging
DATABASE_SSL=true

# MongoDB (Atlas staging)
MONGODB_URI=mongodb+srv://staging-user:password@staging-cluster.mongodb.net/taskflow_staging

# Redis (managed)
REDIS_HOST=staging-redis.taskflow.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# JWT (staging secrets)
JWT_ACCESS_SECRET=staging-access-secret-key-32-chars-minimum-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=staging-refresh-secret-key-32-chars-minimum-here
JWT_REFRESH_EXPIRES_IN=7d

# Monitoring
SENTRY_DSN=https://staging-sentry-dsn@sentry.io/project-id
METRICS_ENABLED=true
```

### Production Configuration

```bash
# .env.production
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app.taskflow.com

# Production logging
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_FILE=/var/log/taskflow/app.log
LOG_MAX_SIZE=100m
LOG_MAX_FILES=10

# Database (production)
DATABASE_HOST=prod-db.taskflow.com
DATABASE_PORT=5432
DATABASE_USERNAME=taskflow_prod
DATABASE_PASSWORD=highly_secure_production_password
DATABASE_NAME=taskflow_prod
DATABASE_SSL=true
DATABASE_MAX_CONNECTIONS=50

# MongoDB (Atlas production)
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/taskflow_prod

# Redis (production cluster)
REDIS_HOST=prod-redis.taskflow.com
REDIS_PORT=6379
REDIS_PASSWORD=highly_secure_redis_password
REDIS_TLS=true

# JWT (production secrets - store in secrets manager)
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Security
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000
BCRYPT_ROUNDS=14

# Monitoring
SENTRY_DSN=https://prod-sentry-dsn@sentry.io/project-id
METRICS_ENABLED=true
APM_ENABLED=true

# Performance
CLUSTERING_ENABLED=true
COMPRESSION_ENABLED=true
CACHE_WARMING_ENABLED=true
```

### Configuration Management Scripts

#### Environment Validation Script

```bash
#!/bin/bash
# validate-config.sh

# Required environment variables
required_vars=(
  "DATABASE_HOST"
  "DATABASE_USERNAME"
  "DATABASE_PASSWORD"
  "DATABASE_NAME"
  "MONGODB_URI"
  "REDIS_HOST"
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
)

# Check required variables
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable $var is not set"
    exit 1
  fi
done

# Validate JWT secret lengths
if [ ${#JWT_ACCESS_SECRET} -lt 32 ]; then
  echo "ERROR: JWT_ACCESS_SECRET must be at least 32 characters long"
  exit 1
fi

if [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
  echo "ERROR: JWT_REFRESH_SECRET must be at least 32 characters long"
  exit 1
fi

# Validate database URL
if [[ ! $MONGODB_URI =~ ^mongodb ]]; then
  echo "ERROR: MONGODB_URI must be a valid MongoDB connection string"
  exit 1
fi

echo "Configuration validation passed"
```

#### Configuration Migration Script

```bash
#!/bin/bash
# migrate-config.sh

# Backup current configuration
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update configuration for new version
# Add new required variables with defaults
if ! grep -q "NEW_CONFIG_VAR" .env; then
  echo "NEW_CONFIG_VAR=default_value" >> .env
fi

# Remove deprecated variables
sed -i '/DEPRECATED_VAR/d' .env

# Validate new configuration
./validate-config.sh

echo "Configuration migration completed"
```

This comprehensive configuration guide provides all the necessary information to properly configure TaskFlow for any environment, ensuring security, performance, and maintainability.







