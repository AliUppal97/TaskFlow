# TaskFlow Backend Architecture & Flow Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Structure & Reasoning](#database-structure--reasoning)
4. [Complete Request Flow](#complete-request-flow)
5. [Module Breakdown](#module-breakdown)
6. [Security Architecture](#security-architecture)
7. [Performance Optimizations](#performance-optimizations)
8. [Real-time Communication](#real-time-communication)

---

## Architecture Overview

TaskFlow backend follows a **modular, layered architecture** built on NestJS framework, implementing clean architecture principles with clear separation of concerns.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Controllers, WebSocket Gateway, DTOs, Swagger Docs         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  Services, Guards, Interceptors, Policies                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                              │
│  Entities, Enums, Business Logic                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  Database (PostgreSQL/MongoDB), Cache (Redis), Config      │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**: Each module handles a specific domain (Auth, Tasks, Events)
2. **Dependency Injection**: All dependencies injected through NestJS DI container
3. **Decorator Pattern**: Used extensively for caching, validation, permissions
4. **Repository Pattern**: TypeORM repositories abstract database access
5. **Event-Driven**: Real-time updates via WebSockets, audit logging via events

---

## Technology Stack

### Core Framework
- **NestJS**: Progressive Node.js framework with TypeScript
- **TypeScript**: Type-safe development
- **Express**: HTTP server (underlying NestJS)

### Databases (Polyglot Persistence)
- **PostgreSQL**: Primary transactional database
- **MongoDB**: Event logging and audit trails
- **Redis**: Caching and session management

### Authentication & Security
- **JWT**: Token-based authentication (access + refresh tokens)
- **Passport.js**: Authentication strategies
- **bcryptjs**: Password hashing (12 salt rounds)
- **class-validator**: Input validation

### Real-time Communication
- **Socket.IO**: WebSocket implementation
- **@nestjs/websockets**: NestJS WebSocket integration

### Additional Libraries
- **TypeORM**: PostgreSQL ORM
- **Mongoose**: MongoDB ODM
- **Swagger/OpenAPI**: API documentation
- **Throttler**: Rate limiting

---

## Database Structure & Reasoning

### Polyglot Persistence Strategy

TaskFlow uses **three different databases**, each optimized for specific use cases:

#### 1. PostgreSQL (Primary Database)

**Purpose**: ACID-compliant transactional data storage

**Why PostgreSQL?**
- **ACID Compliance**: Ensures data integrity for critical operations
- **Relational Data**: Perfect for structured data with relationships (Users ↔ Tasks)
- **Advanced Features**: JSONB support, enums, constraints, transactions
- **Performance**: Excellent for complex queries with joins
- **Maturity**: Battle-tested for production applications

**Tables:**

##### Users Table
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
```

**Reasoning:**
- **UUID Primary Key**: Global uniqueness, better for distributed systems, no sequential ID exposure
- **Email Unique Constraint**: Prevents duplicate accounts, indexed for fast lookups
- **Password Hash**: Never store plaintext passwords (bcrypt with 12 rounds)
- **Role Enum**: Type-safe role management (user/admin)
- **JSONB Profile**: Flexible schema for user profile data (firstName, lastName, avatar)
- **Timestamps**: Audit trail for creation and updates

##### Tasks Table
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
```

**Reasoning:**
- **Foreign Keys**: `assignee_id` and `creator_id` maintain referential integrity
- **Status/Priority Enums**: Type-safe state management, prevents invalid values
- **Soft Delete**: `deleted_at` allows data recovery and audit trails
- **Optimistic Locking**: `version` column prevents concurrent modification conflicts
- **Completed At**: Tracks when task was finished (for analytics)
- **Due Date**: Optional deadline tracking

**Indexes:**
```sql
-- Composite index for common query pattern
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);

-- Foreign key indexes for join performance
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);

-- Partial index for active tasks only
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;
```

**Index Strategy Reasoning:**
- **Composite Indexes**: Optimize queries filtering by status AND priority
- **Foreign Key Indexes**: Speed up joins with users table
- **Partial Indexes**: Smaller index size, faster queries (only non-deleted tasks)

#### 2. MongoDB (Event Store)

**Purpose**: High-throughput event logging and audit trails

**Why MongoDB?**
- **Flexible Schema**: Event payloads can vary by event type
- **High Write Throughput**: Optimized for append-heavy workloads
- **Time-Series Optimization**: Excellent for chronological event queries
- **Horizontal Scaling**: Can scale out for high-volume logging
- **Document Model**: Natural fit for event data (type, payload, metadata)

**Collection: event_logs**
```javascript
{
  _id: ObjectId,
  type: EventType,              // Enum: task.created, user.login, etc.
  actorId: String,               // User who performed action
  entityId: String,              // Entity being acted upon
  entityType: String,            // 'task', 'user', etc.
  payload: Object,              // Event-specific data
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    timestamp: Date
  },
  correlationId: String,        // For tracking related events
  createdAt: Date,
  updatedAt: Date
}
```

**Reasoning:**
- **Type Field**: Categorizes events for filtering and analytics
- **Actor/Entity Pattern**: Tracks who did what to which resource
- **Payload Flexibility**: Different event types have different data structures
- **Metadata**: Captures request context (IP, user agent) for security auditing
- **Correlation ID**: Links related events in a single request/transaction
- **TTL Index**: Automatic cleanup of old events (configurable retention)

**Indexes:**
```javascript
// Time-based queries (most common)
db.event_logs.createIndex({ createdAt: -1 });

// Actor-based queries (user activity)
db.event_logs.createIndex({ actorId: 1, createdAt: -1 });

// Entity-based queries (task history)
db.event_logs.createIndex({ entityId: 1, entityType: 1, createdAt: -1 });

// Event type filtering
db.event_logs.createIndex({ type: 1, createdAt: -1 });
```

**Why Separate from PostgreSQL?**
- **Performance**: Event logging shouldn't slow down transactional operations
- **Scalability**: Can scale MongoDB independently for high-volume logging
- **Schema Flexibility**: Event structures evolve without affecting main schema
- **Analytics**: Easier to query and analyze event data in document store

#### 3. Redis (Cache Layer)

**Purpose**: High-performance caching and session management

**Why Redis?**
- **In-Memory Speed**: Sub-millisecond response times
- **Data Structures**: Strings, hashes, sets, sorted sets for different use cases
- **TTL Support**: Automatic expiration of cached data
- **Pub/Sub**: Can be used for real-time notifications (future enhancement)
- **Session Storage**: Fast session and token management

**Cache Key Patterns:**
```
user:profile:{userId}              # User profile cache (1 hour TTL)
task:{taskId}                      # Individual task cache (10 min TTL)
tasks:list:user:{userId}:page:{n}  # Paginated task lists (5 min TTL)
task:stats:{userId}                # Task statistics (5 min TTL)
refresh_token:{userId}             # Refresh token storage (7 days TTL)
blacklist:{token}                  # Blacklisted JWT tokens (15 min TTL)
```

**Reasoning:**
- **Namespace Pattern**: Clear key organization prevents collisions
- **TTL Strategy**: Different TTLs based on data volatility
  - User profiles: 1 hour (rarely change)
  - Task lists: 5 minutes (frequently updated)
  - Individual tasks: 10 minutes (moderate update frequency)
- **Cache Invalidation**: Pattern-based invalidation on updates

---

## Complete Request Flow

### 1. Application Bootstrap (`main.ts`)

**Flow:**
```
1. NestFactory.create(AppModule)
   ↓
2. Global Middleware Setup:
   - ValidationPipe (whitelist, transform, validation)
   - AllExceptionsFilter (error handling)
   - RequestLoggingInterceptor (audit logging)
   - TimeoutInterceptor (prevent hanging requests)
   ↓
3. CORS Configuration (allow specific origins)
   ↓
4. Cookie Parser Middleware
   ↓
5. Global API Prefix: 'api/v1'
   ↓
6. Swagger Documentation Setup
   ↓
7. Start HTTP Server (port 3000)
```

**Key Features:**
- **Global Validation**: All incoming data validated automatically
- **Error Handling**: Centralized exception filter formats errors consistently
- **Logging**: All requests logged for audit and debugging
- **Documentation**: Auto-generated Swagger docs at `/api/docs`

### 2. Authentication Flow

#### Registration Flow
```
Client → POST /api/v1/auth/register
  ↓
AuthController.register()
  ↓
AuthService.register()
  ↓
UserService.create()
  ├─ Check email uniqueness
  ├─ Hash password (bcrypt, 12 rounds)
  ├─ Create user entity
  ├─ Save to PostgreSQL
  └─ Cache user data (Redis, 1 hour TTL)
  ↓
EventsService.logEvent()
  └─ Log USER_REGISTERED event to MongoDB
  ↓
Return UserProfileDto (password excluded)
```

#### Login Flow
```
Client → POST /api/v1/auth/login
  ↓
AuthController.login()
  ↓
AuthService.login()
  ├─ UserService.validatePassword()
  │   ├─ Find user by email (check cache first)
  │   └─ Compare password hash (bcrypt.compare)
  ├─ GenerateTokens()
  │   ├─ Create JWT access token (15 min expiry)
  │   ├─ Create JWT refresh token (7 days expiry)
  │   └─ Store refresh token ID in Redis
  ├─ EventsService.logEvent() → MongoDB
  └─ Set refresh token as HttpOnly cookie
  ↓
Return AuthResponseDto (access token only)
```

**Security Features:**
- **HttpOnly Cookies**: Refresh token not accessible via JavaScript (XSS protection)
- **Short-Lived Access Tokens**: 15 minutes reduces exposure window
- **Token Rotation**: New refresh token on each refresh
- **Password Hashing**: bcrypt with 12 rounds (industry standard)

#### Token Refresh Flow
```
Client → POST /api/v1/auth/refresh
  ↓
JwtRefreshGuard (validates refresh token from cookie)
  ↓
AuthController.refresh()
  ↓
AuthService.refreshToken()
  ├─ Generate new access token
  ├─ Generate new refresh token (rotation)
  ├─ Update refresh token ID in Redis
  └─ Set new refresh token cookie
  ↓
Return new access token
```

#### Protected Route Flow
```
Client → GET /api/v1/tasks (with Authorization: Bearer {token})
  ↓
JwtAuthGuard.canActivate()
  ├─ Extract token from Authorization header
  ├─ Verify token signature and expiry
  ├─ Check token blacklist (Redis)
  └─ Attach user payload to request
  ↓
JwtPermissionsGuard.canActivate()
  ├─ Check user has required permissions
  └─ Verify role-based access
  ↓
TaskController.findAll()
  ↓
TaskService.findAll()
  ├─ Check cache (Redis) for query result
  ├─ If cache miss:
  │   ├─ Build query with filters
  │   ├─ Apply user-specific filters (non-admin)
  │   ├─ Execute query (PostgreSQL)
  │   └─ Cache result (5 min TTL)
  └─ Return paginated results
  ↓
Transform to TaskResponseDto
  ↓
Return JSON response
```

### 3. Task Management Flow

#### Create Task Flow
```
Client → POST /api/v1/tasks
  ↓
JwtAuthGuard → Verify authentication
  ↓
JwtPermissionsGuard → Check TASK_CREATE permission
  ↓
TaskController.create()
  ↓
TaskService.create()
  ├─ Validate assignee exists (if provided)
  ├─ Create task entity
  ├─ Save to PostgreSQL
  ├─ InvalidateCache('task:*') → Clear related caches
  ├─ EventsService.logEvent() → MongoDB (TASK_CREATED)
  └─ TaskGateway.emitTaskEvent() → WebSocket broadcast
  ↓
Return TaskResponseDto
```

**Real-time Update:**
- WebSocket gateway emits `task-event` to:
  - Task-specific room (`task:{taskId}`)
  - All connected clients (for list updates)
- Clients subscribed to task receive instant update

#### Update Task Flow
```
Client → PATCH /api/v1/tasks/:id
  ↓
PolicyGuard → Check user can update this task
  ├─ TaskPolicy.canUpdate()
  │   ├─ Admin: always allowed
  │   ├─ Creator: allowed
  │   └─ Assignee: allowed (if assigned)
  ↓
TaskService.update()
  ├─ Optimistic Locking Check:
  │   └─ Compare version numbers (prevent conflicts)
  ├─ Validate assignee (if changed)
  ├─ Update task fields
  ├─ Set completedAt if status → DONE
  ├─ Save to PostgreSQL
  ├─ InvalidateCache('task:*')
  ├─ EventsService.logEvent() → MongoDB
  │   ├─ TASK_UPDATED (general update)
  │   └─ TASK_ASSIGNED (if assignee changed)
  └─ TaskGateway.emitTaskEvent() → WebSocket
  ↓
Return updated TaskResponseDto
```

**Optimistic Locking:**
- Client sends `version` field with update
- Server compares with database version
- If mismatch → ConflictException (409)
- Prevents lost updates in concurrent scenarios

#### Delete Task Flow (Soft Delete)
```
Client → DELETE /api/v1/tasks/:id
  ↓
PolicyGuard → Check delete permission
  ↓
TaskService.remove()
  ├─ Find task (exclude soft-deleted)
  ├─ Set deletedAt = current timestamp
  ├─ Save to PostgreSQL (soft delete)
  ├─ InvalidateCache('task:*')
  ├─ EventsService.logEvent() → MongoDB (TASK_DELETED)
  └─ TaskGateway.emitTaskEvent() → WebSocket
  ↓
Return 204 No Content
```

**Why Soft Delete?**
- **Data Recovery**: Can restore accidentally deleted tasks
- **Audit Trail**: Maintains history of deleted items
- **Referential Integrity**: Related data can still reference task
- **Analytics**: Can analyze deletion patterns

### 4. WebSocket Real-time Flow

#### Connection Flow
```
Client → WebSocket Connection to ws://localhost:3000/tasks
  ↓
TaskGateway.handleConnection()
  ├─ Extract JWT token from handshake
  ├─ Verify token (JwtService.verify)
  ├─ Load user from database
  ├─ Store connection in Map<socketId, socket>
  ├─ Join rooms:
  │   ├─ user:{userId} (personal notifications)
  │   └─ admin (if admin role)
  └─ Emit 'connected' event to client
```

#### Subscription Flow
```
Client → emit('subscribe-to-task', { taskId })
  ↓
TaskGateway.handleSubscribeToTask()
  ├─ Join room: task:{taskId}
  └─ Return confirmation
  ↓
Client receives updates for this task
```

#### Event Broadcasting Flow
```
TaskService.update() → TaskGateway.emitTaskEvent()
  ↓
TaskGateway.emitTaskEvent()
  ├─ Load actor information
  ├─ Build event payload
  ├─ Emit to task room: server.to('task:{taskId}').emit('task-event')
  ├─ Emit to all clients: server.emit('task-event')
  └─ EventsService.logEvent() → MongoDB (for audit)
  ↓
All subscribed clients receive real-time update
```

---

## Module Breakdown

### 1. Auth Module (`modules/auth/`)

**Responsibilities:**
- User registration and authentication
- JWT token generation and validation
- Password management
- User profile management

**Components:**
- `AuthController`: HTTP endpoints (register, login, logout, refresh, profile)
- `AuthService`: Business logic for authentication
- `UserService`: User CRUD operations
- `JwtStrategy`: Access token validation strategy
- `JwtRefreshStrategy`: Refresh token validation strategy

**Dependencies:**
- TypeORM (User entity)
- JWT Module
- Events Module (audit logging)
- Cache Service (token storage)

### 2. Tasks Module (`modules/tasks/`)

**Responsibilities:**
- Task CRUD operations
- Task assignment
- Task statistics
- Real-time task updates

**Components:**
- `TaskController`: HTTP endpoints (CRUD, assign, stats)
- `TaskService`: Business logic for tasks
- `TaskGateway`: WebSocket gateway for real-time updates
- `TaskPolicy`: Authorization policies (who can update/delete)

**Dependencies:**
- TypeORM (Task, User entities)
- Events Module (audit logging)
- Auth Module (user context)
- Cache Service (caching)

**Key Features:**
- **Pagination**: Efficient data loading
- **Filtering**: By status, priority, assignee, creator, search
- **Caching**: Redis caching with smart invalidation
- **Optimistic Locking**: Version-based conflict prevention
- **Soft Delete**: Recoverable deletions

### 3. Events Module (`modules/events/`)

**Responsibilities:**
- Event logging to MongoDB
- Event querying and retrieval
- Audit trail management

**Components:**
- `EventsService`: Event logging and querying
- `EventLog` Entity: MongoDB schema definition

**Event Types:**
- `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASK_ASSIGNED`
- `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT`

**Usage:**
- Called by AuthService and TaskService after operations
- Non-blocking (errors don't break main flow)
- Used for compliance, debugging, and analytics

---

## Security Architecture

### Authentication & Authorization Layers

```
Request
  ↓
1. CORS Check (origin validation)
  ↓
2. Rate Limiting (ThrottlerGuard - 100 req/min)
  ↓
3. JWT Authentication (JwtAuthGuard)
  ├─ Extract token from Authorization header
  ├─ Verify signature and expiry
  └─ Check token blacklist (Redis)
  ↓
4. Permission Check (JwtPermissionsGuard)
  ├─ Check user has required permission
  └─ Verify role matches requirement
  ↓
5. Policy Check (PolicyGuard) - Optional
  ├─ Resource-specific authorization
  └─ e.g., "Can user update THIS task?"
  ↓
6. Controller Method Execution
```

### Security Features

1. **Password Security**
   - bcrypt hashing with 12 salt rounds
   - Never stored in plaintext
   - Never returned in API responses

2. **Token Security**
   - Short-lived access tokens (15 min)
   - Refresh tokens in HttpOnly cookies (XSS protection)
   - Token rotation on refresh
   - Token blacklisting on logout

3. **Input Validation**
   - class-validator decorators on all DTOs
   - Whitelist mode (strip unknown properties)
   - Type transformation and coercion

4. **Rate Limiting**
   - 100 requests per minute per IP
   - Prevents brute force and DoS attacks

5. **CORS**
   - Configured for specific origins only
   - Credentials allowed for authenticated requests

6. **Audit Logging**
   - All actions logged with actor, entity, timestamp
   - IP address and user agent captured
   - Immutable event log in MongoDB

---

## Performance Optimizations

### 1. Caching Strategy

**Cache Levels:**
- **User Profiles**: 1 hour TTL (rarely change)
- **Task Lists**: 5 minutes TTL (moderate update frequency)
- **Individual Tasks**: 10 minutes TTL
- **Task Statistics**: 5 minutes TTL

**Cache Invalidation:**
- Pattern-based invalidation on updates
- `@InvalidateCache('task:*')` decorator clears all task-related caches
- Write-through pattern: update DB → invalidate cache

**Cache Decorators:**
```typescript
@CacheResult({ ttl: 300, keyPrefix: 'tasks:list' })
async findAll() { ... }

@InvalidateCache('task:*')
async update() { ... }
```

### 2. Database Optimizations

**Indexes:**
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., non-deleted tasks)
- Foreign key indexes for join performance

**Query Optimization:**
- TypeORM QueryBuilder for efficient queries
- Eager loading for related entities (creator, assignee)
- Pagination to limit result sets

**Connection Pooling:**
- PostgreSQL: 5-20 connections
- Redis: Connection reuse
- MongoDB: Connection pooling via Mongoose

### 3. Real-time Optimization

**WebSocket Rooms:**
- Task-specific rooms: Only relevant clients receive updates
- User-specific rooms: Personalized notifications
- Admin room: Broadcast admin-only events

**Event Batching:**
- Multiple events can be batched (future enhancement)
- Reduces network overhead

---

## Real-time Communication

### WebSocket Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Client    │◄───WebSocket──────►│   Gateway   │
│  (Browser)   │                    │  (Socket.IO)│
└─────────────┘                    └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │   Service   │
                                    │  (TaskService)│
                                    └─────────────┘
```

### Room Structure

- **`task:{taskId}`**: Clients subscribed to specific task
- **`user:{userId}`**: User-specific notifications
- **`admin`**: Admin-only broadcasts

### Event Types

**Client → Server:**
- `subscribe-to-task`: Subscribe to task updates
- `unsubscribe-from-task`: Unsubscribe from task
- `ping`: Connection health check

**Server → Client:**
- `connected`: Connection confirmation
- `task-event`: Task update event
- `notification`: User notification (assignments, etc.)
- `pong`: Ping response

### Authentication

- JWT token passed in WebSocket handshake
- Gateway validates token before accepting connection
- Unauthenticated connections are rejected

---

## Error Handling

### Exception Filter (`AllExceptionsFilter`)

**Handles:**
- Validation errors (400 Bad Request)
- Authentication errors (401 Unauthorized)
- Authorization errors (403 Forbidden)
- Not found errors (404 Not Found)
- Conflict errors (409 Conflict)
- Server errors (500 Internal Server Error)

**Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/tasks"
}
```

### Logging

- All requests logged via `RequestLoggingInterceptor`
- Errors logged with stack traces
- Event logging for audit trail

---

## Summary

The TaskFlow backend is designed with:

1. **Scalability**: Polyglot persistence, caching, connection pooling
2. **Security**: Multi-layer authentication, input validation, audit logging
3. **Performance**: Redis caching, database indexes, optimized queries
4. **Real-time**: WebSocket support for instant updates
5. **Maintainability**: Modular architecture, clear separation of concerns
6. **Reliability**: Soft deletes, optimistic locking, error handling

This architecture supports a production-ready, enterprise-grade task management system capable of handling high loads while maintaining data integrity and security.

