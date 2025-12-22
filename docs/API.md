# TaskFlow API Documentation

## Overview

The TaskFlow API is a RESTful web service built with NestJS that provides comprehensive task management capabilities with real-time features. The API follows REST principles, uses JSON for data exchange, and includes comprehensive authentication and authorization.

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
TaskFlow uses JWT (JSON Web Token) based authentication. All protected endpoints require a valid JWT token in the Authorization header.

### API Versioning
The API uses URI versioning with the prefix `/api/v1`.

---

## Authentication

### Register User

Create a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - User already exists

### Login

Authenticate user and receive JWT tokens.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Notes:**
- Refresh token is set as an HttpOnly cookie
- Access token expires in 15 minutes
- Refresh token expires in 7 days

### Refresh Token

Get a new access token using refresh token.

```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<refresh_token>
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Logout

Invalidate user session.

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

### Get Profile

Get current user profile information.

```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Profile

Update current user profile information.

```http
PATCH /api/v1/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Request Body (all fields optional):**
- `firstName` (string): User's first name
- `lastName` (string): User's last name
- `avatar` (string): URL to user's avatar image

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "avatar": "https://example.com/new-avatar.jpg"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - User not found

---

## User Management (Admin Only)

Admin endpoints for managing users. These endpoints require admin role and appropriate permissions.

### List Users

Get all users with pagination and filtering (Admin only).

```http
GET /api/v1/users?page=1&limit=10&role=user
Authorization: Bearer <admin_access_token>
```

**Required Permissions:** `user:read`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `role` (UserRole): Filter by user role

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Update User Role

Update a user's role (Admin only).

```http
PATCH /api/v1/users/550e8400-e29b-41d4-a716-446655440000/role
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Required Permissions:** `user:manage_roles`

**Response (200 OK):** Updated user profile object.

**Error Responses:**
- `400 Bad Request` - Invalid role or cannot change own role
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

### Update User Status

Activate or deactivate a user account (Admin only).

```http
PATCH /api/v1/users/550e8400-e29b-41d4-a716-446655440000/status
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "isActive": false
}
```

**Required Permissions:** `user:update`

**Response (200 OK):** Updated user profile object.

**Notes:**
- Admins cannot deactivate their own accounts
- Deactivated users cannot log in

---

## Tasks

All task endpoints require authentication and appropriate permissions.

### Create Task

Create a new task.

```http
POST /api/v1/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Implement JWT authentication with refresh tokens",
  "priority": "high",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440001",
  "dueDate": "2024-12-31T23:59:59.999Z"
}
```

**Required Permissions:** `task:create`

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "Implement user authentication",
  "description": "Implement JWT authentication with refresh tokens",
  "status": "todo",
  "priority": "high",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440001",
  "creatorId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": null,
  "dueDate": "2024-12-31T23:59:59.999Z",
  "version": 1,
  "assignee": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "assignee@example.com",
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith"
    }
  },
  "creator": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "creator@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "isOverdue": false,
  "daysUntilDue": 364
}
```

### Get Tasks

Retrieve tasks with pagination and filtering.

```http
GET /api/v1/tasks?page=1&limit=10&status=in_progress&priority=high&search=authentication
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order - 'asc' or 'desc' (default: desc)
- `status` (TaskStatus): Filter by task status
- `priority` (TaskPriority): Filter by task priority
- `assigneeId` (string): Filter by assignee ID
- `creatorId` (string): Filter by creator ID
- `search` (string): Search in title and description

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "title": "Implement user authentication",
      "description": "Implement JWT authentication with refresh tokens",
      "status": "in_progress",
      "priority": "high",
      "assigneeId": "550e8400-e29b-41d4-a716-446655440001",
      "creatorId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "completedAt": null,
      "dueDate": "2024-12-31T23:59:59.999Z",
      "version": 1,
      "assignee": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "assignee@example.com",
        "profile": {
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "creator": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "creator@example.com",
        "profile": {
          "firstName": "John",
          "Doe"
        }
      },
      "isOverdue": false,
      "daysUntilDue": 364
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Task Statistics

Get aggregated task statistics for the current user.

```http
GET /api/v1/tasks/stats
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "total": 25,
  "byStatus": {
    "todo": 5,
    "in_progress": 10,
    "review": 3,
    "done": 7
  },
  "byPriority": {
    "low": 8,
    "medium": 12,
    "high": 4,
    "urgent": 1
  },
  "overdue": 2,
  "dueToday": 3,
  "dueThisWeek": 8
}
```

### Get Task by ID

Retrieve a specific task by its ID.

```http
GET /api/v1/tasks/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <access_token>
```

**Required Permissions:** `task:read`

**Response (200 OK):** See task object structure above.

**Error Responses:**
- `404 Not Found` - Task not found
- `403 Forbidden` - Insufficient permissions

### Update Task

Update an existing task.

```http
PATCH /api/v1/tasks/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement JWT authentication system",
  "status": "in_progress",
  "priority": "urgent"
}
```

**Required Permissions:** `task:update`

**Response (200 OK):** Updated task object.

**Error Responses:**
- `404 Not Found` - Task not found
- `409 Conflict` - Task was modified by another user (optimistic locking)
- `403 Forbidden` - Insufficient permissions

### Assign Task

Assign or unassign a task to/from a user.

```http
PATCH /api/v1/tasks/550e8400-e29b-41d4-a716-446655440002/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "assigneeId": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Required Permissions:** `task:assign`

**Notes:**
- Set `assigneeId` to `null` to unassign the task
- Only task creators or admins can assign tasks

### Delete Task

Soft delete a task (mark as deleted).

```http
DELETE /api/v1/tasks/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <access_token>
```

**Required Permissions:** `task:delete`

**Response (204 No Content):**

**Error Responses:**
- `404 Not Found` - Task not found
- `403 Forbidden` - Insufficient permissions

---

## Data Types

### Task Status
```typescript
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done'
}
```

### Task Priority
```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### User Role
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}
```

### Permissions
```typescript
enum Permission {
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  ADMIN_ACCESS = 'admin:access',
  SYSTEM_CONFIG = 'system:config'
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error details in the following format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input data or validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., concurrent modification)
- `422 Unprocessable Entity` - Business logic validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authenticated requests:** 100 requests per minute
- **Unauthenticated requests:** 10 requests per minute
- **Login attempts:** 5 attempts per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1638360000
```

---

## Real-time Features

TaskFlow includes WebSocket support for real-time updates. Connect to the WebSocket endpoint to receive live updates.

### WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Real-time Events

#### Task Events
- `task.created` - New task created
- `task.updated` - Task modified
- `task.assigned` - Task assignment changed
- `task.deleted` - Task deleted

#### Event Payload Structure
```json
{
  "type": "task.updated",
  "taskId": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "changes": {
    "status": {
      "from": "todo",
      "to": "in_progress"
    }
  }
}
```

---

## SDKs and Libraries

### JavaScript/TypeScript Client

```javascript
class TaskFlowClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async createTask(taskData) {
    const response = await fetch(`${this.baseURL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(taskData)
    });
    return response.json();
  }

  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/api/v1/tasks?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}

// Usage
const client = new TaskFlowClient('http://localhost:3001', 'your-jwt-token');
const tasks = await client.getTasks({ status: 'in_progress', limit: 20 });
```

---

## Best Practices

### Authentication
1. Store JWT tokens securely (HttpOnly cookies for refresh tokens)
2. Implement token refresh logic
3. Handle token expiration gracefully
4. Clear tokens on logout

### API Usage
1. Use appropriate HTTP methods
2. Handle pagination for list endpoints
3. Implement proper error handling
4. Respect rate limits
5. Use ETags for caching when available

### Real-time Features
1. Implement connection recovery
2. Handle reconnection logic
3. Process events in order
4. Update UI optimistically

### Performance
1. Use pagination for large datasets
2. Implement client-side caching
3. Batch operations when possible
4. Monitor API usage and response times

---

## Support

For API support and questions:

- **Interactive Documentation:** http://localhost:3001/api/docs
- **GitHub Issues:** Report bugs and request features
- **Email:** api-support@taskflow.com

---

*Last updated: December 23, 2025*







