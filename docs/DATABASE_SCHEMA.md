# TaskFlow Database Schema

## Overview

TaskFlow uses a polyglot persistence architecture with multiple databases optimized for different use cases:

- **PostgreSQL**: Primary transactional database for core business data
- **MongoDB**: Document database for event logging and audit trails
- **Redis**: In-memory cache for performance optimization

## Database Architecture

### Technology Choices

#### PostgreSQL (Primary Database)
- **Version**: 13+
- **Purpose**: ACID-compliant transactional data
- **Features**: JSONB support, advanced indexing, constraints
- **Use Cases**: Users, Tasks, Relationships

#### MongoDB (Event Store)
- **Version**: 6+
- **Purpose**: High-throughput event logging
- **Features**: Flexible schema, time-series optimization
- **Use Cases**: Audit trails, analytics, event sourcing

#### Redis (Cache Layer)
- **Version**: 6+
- **Purpose**: High-performance caching and sessions
- **Features**: Multiple data structures, TTL, pub/sub
- **Use Cases**: Session storage, API caching, real-time data

---

## PostgreSQL Schema

### Core Entities

#### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    profile JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Field Descriptions:**
- `id`: UUID primary key for global uniqueness
- `email`: Unique email address (login identifier)
- `password_hash`: bcrypt-hashed password
- `role`: User role (user/admin) with enum constraint
- `profile`: JSONB field for extensible user profile data
- `created_at`/`updated_at`: Audit timestamps

**Constraints:**
- Email must be valid format and unique
- Password hash cannot be null
- Role must be valid enum value

#### Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo' NOT NULL,
    priority task_priority DEFAULT 'medium' NOT NULL,
    assignee_id UUID REFERENCES users(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Indexes
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;
```

**Field Descriptions:**
- `id`: UUID primary key
- `title`: Task title (required, 1-255 characters)
- `description`: Detailed task description (optional)
- `status`: Current task status enum
- `priority`: Task priority level enum
- `assignee_id`: Foreign key to assigned user (nullable)
- `creator_id`: Foreign key to task creator (required)
- `completed_at`: Timestamp when task was completed
- `due_date`: Optional deadline for task completion
- `deleted_at`: Soft delete timestamp (nullable)
- `version`: Optimistic locking version number

### Enums

#### User Roles
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

#### Task Status
```sql
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
```

#### Task Priority
```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

### Entity Relationships

```
┌─────────────┐       ┌─────────────┐
│    Users    │       │    Tasks    │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ assignee_id │
│ email       │       │ (FK)        │
│ role        │       │ creator_id  │
│ profile     │       │ (FK)        │
│ ...         │       │ title       │
└─────────────┘       │ status      │
        ▲             │ priority    │
        │             │ ...         │
        └─────────────┤             │
                      └─────────────┘
```

**Relationship Details:**
- **One-to-Many**: User → Tasks (as creator)
- **One-to-Many**: User → Tasks (as assignee)
- **Foreign Key Constraints**: Maintain referential integrity
- **Cascade Actions**: Configured appropriately for data consistency

### Database Constraints

#### Check Constraints
```sql
-- Task completion validation
ALTER TABLE tasks ADD CONSTRAINT chk_task_completion
CHECK (
    (status = 'done' AND completed_at IS NOT NULL) OR
    (status != 'done' AND completed_at IS NULL)
);

-- Due date validation
ALTER TABLE tasks ADD CONSTRAINT chk_due_date_future
CHECK (due_date IS NULL OR due_date > created_at);

-- Version validation
ALTER TABLE tasks ADD CONSTRAINT chk_version_positive
CHECK (version > 0);
```

#### Unique Constraints
```sql
-- Email uniqueness (already covered by unique index)
-- UUID primary keys provide natural uniqueness
```

### Indexes Strategy

#### Performance Indexes
```sql
-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_tasks_status_created ON tasks(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX CONCURRENTLY idx_tasks_creator_priority ON tasks(creator_id, priority);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_tasks_active ON tasks(id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_tasks_overdue ON tasks(id)
WHERE due_date IS NOT NULL AND due_date < CURRENT_TIMESTAMP AND status != 'done';

-- JSONB indexes for profile searches
CREATE INDEX CONCURRENTLY idx_users_profile_first_name ON users USING GIN ((profile->'firstName'));
CREATE INDEX CONCURRENTLY idx_users_profile_last_name ON users USING GIN ((profile->'lastName'));
```

#### Index Maintenance
```sql
-- Index usage monitoring
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Unused index identification
SELECT
    indexrelname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY indexrelname;
```

---

## MongoDB Schema

### Event Logs Collection

```javascript
// Collection: event_logs
{
  _id: ObjectId,           // MongoDB ObjectId
  type: String,            // Event type enum
  actorId: String,         // User who performed action
  entityId: String,        // Entity being acted upon
  entityType: String,      // Entity type (task, user)
  payload: Object,         // Event-specific data
  metadata: {
    userAgent: String?,    // Client user agent
    ipAddress: String?,    // Client IP address
    sessionId: String?,    // Session identifier
    timestamp: Date        // Event timestamp
  },
  correlationId: String?,  // Request correlation ID
  createdAt: Date,         // Document creation timestamp
  updatedAt: Date          // Document update timestamp
}
```

### Event Types

```javascript
enum EventType {
  // Task Events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',

  // User Events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile_updated',

  // System Events
  SYSTEM_BACKUP_STARTED = 'system.backup.started',
  SYSTEM_BACKUP_COMPLETED = 'system.backup.completed',
  SYSTEM_MAINTENANCE_STARTED = 'system.maintenance.started',
}
```

### Indexes

```javascript
// Performance indexes
db.event_logs.createIndex({ type: 1, createdAt: -1 });
db.event_logs.createIndex({ actorId: 1, createdAt: -1 });
db.event_logs.createIndex({ entityId: 1, entityType: 1, createdAt: -1 });
db.event_logs.createIndex({ correlationId: 1 });
db.event_logs.createIndex({ createdAt: -1 });
db.event_logs.createIndex({ "metadata.timestamp": -1 });

// Compound indexes for common queries
db.event_logs.createIndex({
  entityType: 1,
  type: 1,
  createdAt: -1
});

// TTL index for automatic cleanup (optional)
db.event_logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000 } // 1 year retention
);
```

### Data Retention Strategy

```javascript
// Automated cleanup policies
const retentionPolicies = {
  user_activity: 365 * 24 * 60 * 60,     // 1 year
  task_events: 180 * 24 * 60 * 60,       // 6 months
  system_events: 90 * 24 * 60 * 60,      // 3 months
  audit_logs: 2555 * 24 * 60 * 60,       // 7 years (legal requirement)
};

// Implement retention based on event type
db.event_logs.createIndex(
  { type: 1, createdAt: 1 },
  {
    partialFilterExpression: { type: { $in: ['user.login', 'user.logout'] } },
    expireAfterSeconds: retentionPolicies.user_activity
  }
);
```

---

## Redis Schema

### Key Naming Convention

```
Pattern: {namespace}:{type}:{identifier}:{field}
Examples:
- user:profile:123e4567-e89b-12d3-a456-426614174000
- task:list:user:123e4567-e89b-12d3-a456-426614174000:page:1
- session:123e4567-e89b-12d3-a456-426614174000
- rate-limit:ip:192.168.1.1
```

### Cache Keys Structure

#### User Data
```redis
# User profile cache
SET user:profile:{userId} {"id":"...", "email":"...", "profile":{...}} EX 300

# User permissions cache
SET user:permissions:{userId} ["task:create", "task:read", ...] EX 600

# User session data
SET session:{sessionId} {"userId":"...", "createdAt":"...", "expiresAt":"..."} EX 3600
```

#### Task Data
```redis
# Individual task cache
SET task:{taskId} {"id":"...", "title":"...", "status":"..."} EX 180

# Task lists (paginated)
SET task:list:user:{userId}:status:{status}:page:{page} [...] EX 60

# Task statistics
SET task:stats:{userId} {"total":25, "byStatus":{...}, "overdue":2} EX 300

# Task search results
SET task:search:{queryHash}:page:{page} [...] EX 120
```

#### Application Data
```redis
# Rate limiting counters
SET rate-limit:user:{userId}:minute {count} EX 60
SET rate-limit:ip:{ipAddress}:hour {count} EX 3600

# API response cache
SET api:response:{endpointHash}:{paramsHash} {responseJson} EX 300

# WebSocket connection tracking
SET ws:connection:{socketId} {userId} EX 3600
SADD ws:user:{userId}:connections {socketId}
```

### Data Structures Usage

#### Strings (SET/GET)
```redis
# Simple key-value storage
SET user:profile:123 {"name":"John","email":"john@example.com"}
GET user:profile:123
```

#### Hashes (HSET/HGET)
```redis
# Structured data with multiple fields
HSET task:123 title "Implement auth" status "in_progress" priority "high"
HGET task:123 title
HGETALL task:123
```

#### Sets (SADD/SMEMBERS)
```redis
# Unique collections
SADD task:assignees:456 123 789 101
SMEMBERS task:assignees:456
SISMEMBER task:assignees:456 123
```

#### Sorted Sets (ZADD/ZRANGE)
```redis
# Ordered collections with scores
ZADD task:priority 1 "task:123" 2 "task:456" 3 "task:789"
ZRANGE task:priority 0 -1 WITHSCORES
```

#### Lists (LPUSH/LRANGE)
```redis
# Ordered sequences
LPUSH task:recent:123 "update:status" "update:assignee" "created"
LRANGE task:recent:123 0 10
```

### Cache Invalidation Strategy

#### Write-Through Pattern
```typescript
async updateTask(taskId: string, updates: any) {
  // Update database first
  await this.taskRepository.save(updates);

  // Invalidate related cache keys
  const keysToDelete = [
    `task:${taskId}`,
    `task:list:user:*`,        // Invalidate all user task lists
    `task:stats:*`,            // Invalidate all statistics
    `task:search:*`,           // Invalidate search results
  ];

  for (const pattern of keysToDelete) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### Cache Warming
```typescript
async warmCache(userId: string) {
  // Pre-populate frequently accessed data
  const [profile, tasks, stats] = await Promise.all([
    this.getUserProfile(userId),
    this.getUserTasks(userId),
    this.getUserStats(userId)
  ]);

  await Promise.all([
    this.cache.set(`user:profile:${userId}`, profile, 300),
    this.cache.set(`task:list:user:${userId}:page:1`, tasks, 60),
    this.cache.set(`task:stats:${userId}`, stats, 300),
  ]);
}
```

---

## Data Migration Strategy

### Schema Evolution

#### PostgreSQL Migrations
```typescript
// TypeORM migration example
export class AddTaskDueDate1640995200000 implements MigrationInterface {
  name = 'AddTaskDueDate1640995200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD COLUMN "due_date" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_tasks_due_date" ON "tasks" ("due_date")
      WHERE "due_date" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_tasks_due_date"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "due_date"`);
  }
}
```

#### MongoDB Schema Updates
```javascript
// Schema migration script
const migration = {
  version: 2,
  description: "Add correlationId to event logs",
  up: async (db) => {
    await db.collection('event_logs').updateMany(
      { correlationId: { $exists: false } },
      [
        {
          $set: {
            correlationId: { $function: { body: 'generateUUID()', args: [], lang: 'js' } }
          }
        }
      ]
    );
  },
  down: async (db) => {
    await db.collection('event_logs').updateMany(
      {},
      { $unset: { correlationId: "" } }
    );
  }
};
```

### Data Seeding

#### Development Data
```typescript
export const seedUsers = [
  {
    email: 'admin@taskflow.com',
    passwordHash: await bcrypt.hash('admin123', 12),
    role: UserRole.ADMIN,
    profile: { firstName: 'Admin', lastName: 'User' }
  },
  {
    email: 'user@taskflow.com',
    passwordHash: await bcrypt.hash('user123', 12),
    role: UserRole.USER,
    profile: { firstName: 'John', lastName: 'Doe' }
  }
];

export const seedTasks = [
  {
    title: 'Setup development environment',
    description: 'Install and configure all necessary tools',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    creatorId: seedUsers[0].id
  }
];
```

---

## Backup and Recovery

### PostgreSQL Backup Strategy

#### Automated Backups
```bash
# Daily full backup
pg_dump -h localhost -U postgres -d taskflow --format=custom --compress=9 --file="/backups/taskflow_$(date +%Y%m%d).dump"

# Continuous archiving (WAL)
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

#### Point-in-Time Recovery
```sql
-- Create restore point
SELECT pg_create_restore_point('before_major_update');

-- Restore to specific point
pg_restore -h localhost -U postgres -d taskflow --create --clean "/backups/taskflow_20240101.dump"
```

### MongoDB Backup Strategy

#### Database Backup
```bash
# Create backup
mongodump --db taskflow --out /backups/mongo_$(date +%Y%m%d)

# Restore backup
mongorestore --db taskflow /backups/mongo_20240101/taskflow
```

#### Replica Set Backup
```javascript
// Enable journaling for crash recovery
db.adminCommand({ setParameter: 1, wiredTigerMaxCacheOverflowSizeGB: 0.1 });

// Backup with oplog for point-in-time recovery
mongodump --oplog --out /backups/mongo_oplog_$(date +%Y%m%d)
```

### Redis Backup Strategy

#### RDB Snapshots
```redis.conf
# Enable RDB snapshots
save 900 1      # Save after 900 seconds if at least 1 change
save 300 10     # Save after 300 seconds if at least 10 changes
save 60 10000   # Save after 60 seconds if at least 10000 changes

# Snapshot naming
dbfilename dump.rdb
dir /data/redis
```

#### AOF Persistence
```redis.conf
# Enable Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec  # fsync every second
```

---

## Performance Optimization

### Query Optimization

#### PostgreSQL Query Analysis
```sql
-- Explain query execution plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT t.*, u.email as assignee_email
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.status = 'in_progress'
ORDER BY t.priority DESC, t.created_at DESC
LIMIT 20;

-- Query performance monitoring
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

#### Index Optimization
```sql
-- Identify slow queries
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Create targeted indexes
CREATE INDEX CONCURRENTLY idx_tasks_status_priority_created
ON tasks(status, priority, created_at DESC)
WHERE deleted_at IS NULL;
```

### Connection Pooling

#### PostgreSQL Connection Pool
```javascript
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  max: 20,              // Maximum connections
  min: 5,               // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: true
});
```

#### Redis Connection Pool
```javascript
const redis = new Redis.Cluster(nodes, {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
  clusterRetryDelay: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});
```

---

## Monitoring and Maintenance

### Database Health Checks

#### PostgreSQL Monitoring
```sql
-- Connection status
SELECT
    count(*) as total_connections,
    count(*) filter (where state = 'active') as active_connections,
    count(*) filter (where state = 'idle') as idle_connections
FROM pg_stat_activity;

-- Table size and growth
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### MongoDB Monitoring
```javascript
// Database statistics
db.stats()

// Collection statistics
db.event_logs.stats()

// Replication status
rs.status()
```

#### Redis Monitoring
```redis
INFO
INFO MEMORY
INFO STATS
INFO CPU
```

### Maintenance Tasks

#### PostgreSQL Maintenance
```sql
-- Analyze tables for query planner
ANALYZE;

-- Vacuum for space reclamation
VACUUM;

-- Reindex for performance
REINDEX TABLE CONCURRENTLY tasks;

-- Update table statistics
ANALYZE tasks;
```

#### MongoDB Maintenance
```javascript
// Compact collection
db.runCommand({ compact: 'event_logs' });

// Build indexes
db.event_logs.reIndex();

// Validate collection
db.event_logs.validate({ full: true });
```

#### Redis Maintenance
```redis
# Clear expired keys
FLUSHDB ASYNC

# Defragment memory
MEMORY PURGE

# Rewrite AOF file
BGREWRITEAOF
```

---

## Security Considerations

### Data Encryption

#### PostgreSQL Encryption
```sql
-- Enable encryption at rest
-- Configure SSL/TLS connections
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgresql.crt'
ssl_key_file = '/etc/ssl/private/postgresql.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
```

#### MongoDB Encryption
```javascript
// Enable encryption at rest
mongod --enableEncryption \
       --encryptionKeyFile /etc/ssl/mongodb.key \
       --encryptionCipherMode AES256-CBC
```

### Access Control

#### PostgreSQL Roles
```sql
-- Create application user with limited permissions
CREATE USER taskflow_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE taskflow TO taskflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO taskflow_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO taskflow_app;
```

#### MongoDB Users
```javascript
// Create application user
db.createUser({
  user: 'taskflow_app',
  pwd: 'secure_password',
  roles: [
    { role: 'readWrite', db: 'taskflow' }
  ]
});
```

### Audit Logging

#### PostgreSQL Audit
```sql
-- Enable audit logging
CREATE EXTENSION pgaudit;
ALTER SYSTEM SET pgaudit.log = 'read,write';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_parameter = on;
```

#### Comprehensive Event Logging
- All data modifications are logged
- User actions are tracked with context
- Sensitive operations trigger alerts
- Logs are immutable and tamper-proof

---

## Disaster Recovery

### Recovery Time Objectives (RTO)
- **Critical Data**: 1 hour RTO
- **Operational Data**: 4 hours RTO
- **Archive Data**: 24 hours RTO

### Recovery Point Objectives (RPO)
- **Transactional Data**: 5 minutes RPO
- **Event Logs**: 1 hour RPO
- **Cache Data**: Acceptable loss (reconstructible)

### Backup Frequency
- **Full Backups**: Daily
- **Incremental Backups**: Hourly
- **Transaction Logs**: Continuous
- **Cross-Region Replication**: Real-time

### Testing Procedures
- Monthly recovery testing
- Annual disaster simulation
- Automated failover testing
- Performance validation post-recovery

This comprehensive database schema provides a solid foundation for TaskFlow's data management needs, balancing performance, scalability, and data integrity requirements.



