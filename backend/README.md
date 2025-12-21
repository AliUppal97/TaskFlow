# TaskFlow Backend API

Backend API for TaskFlow - A real-time collaborative task management system built with NestJS.

## 🚀 Features

- **RESTful API** with comprehensive CRUD operations
- **WebSocket Support** for real-time task updates
- **JWT Authentication** with access/refresh tokens
- **Role-Based Access Control** (Admin and User roles)
- **Redis Caching** for improved performance
- **Event Logging** with MongoDB
- **PostgreSQL** for primary data storage
- **Swagger/OpenAPI** documentation
- **Health Checks** and monitoring endpoints

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- npm 8+ or yarn 1.22+

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp env.template .env

# Configure your .env file with database credentials and JWT secrets
```

## ⚙️ Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=taskflow

# MongoDB
MONGODB_URI=mongodb://localhost:27017/taskflow

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-here-at-least-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-at-least-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

## 🏃 Running the Application

### Development Mode

```bash
# Start with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker

```bash
# Build Docker image
docker build -t taskflow-backend .

# Run container
docker run -p 3000:3000 --env-file .env taskflow-backend
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, interfaces, policies
│   ├── cache/       # Redis caching decorators and service
│   ├── decorators/  # Transaction decorator
│   ├── filters/     # Exception filters
│   ├── interceptors/# Request/response interceptors
│   ├── interfaces/  # TypeScript interfaces
│   ├── policies/    # Authorization policies
│   └── services/   # Shared services (logger)
├── config/          # Configuration modules
│   ├── configuration.ts
│   ├── database.config.ts
│   ├── mongodb.config.ts
│   └── redis.config.ts
├── decorators/      # Custom decorators (@Roles, @Permissions, @Policy)
├── dto/            # Data Transfer Objects
├── entities/       # TypeORM entities (User, Task, EventLog)
├── guards/         # Route guards (JWT, Roles, Permissions)
├── interceptors/   # Logging interceptor
├── modules/        # Feature modules
│   ├── auth/       # Authentication module
│   ├── events/     # Event logging module
│   └── tasks/      # Task management module (includes WebSocket gateway)
└── main.ts         # Application entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/profile` - Get user profile

### Tasks
- `GET /api/v1/tasks` - List tasks (with pagination and filtering)
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task by ID
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `PATCH /api/v1/tasks/:id/assign` - Assign task to user
- `GET /api/v1/tasks/stats` - Get task statistics

### Health
- `GET /health` - Application health check
- `GET /ping` - Simple connectivity check

## 🔌 WebSocket Events

The backend exposes WebSocket events for real-time task updates:

**Connection**: `ws://localhost:3000/tasks`

**Events**:
- `subscribe-to-task` - Subscribe to task updates
- `task-event` - Receive task update events
- `task-created` - Task created event
- `task-updated` - Task updated event
- `task-deleted` - Task deleted event

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation with class-validator
- **CORS**: Configured for specific origins
- **Audit Logging**: All actions logged for compliance

## 📝 Code Style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## 🐛 Debugging

```bash
# Start in debug mode
npm run start:debug

# Then attach debugger on port 9229
```

## 📦 Dependencies

### Core
- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@nestjs/platform-express` - Express adapter
- `@nestjs/websockets` - WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter

### Database
- `@nestjs/typeorm` - TypeORM integration
- `typeorm` - ORM
- `pg` - PostgreSQL driver
- `@nestjs/mongoose` - Mongoose integration
- `mongoose` - MongoDB ODM

### Authentication
- `@nestjs/jwt` - JWT module
- `@nestjs/passport` - Passport integration
- `passport-jwt` - JWT strategy
- `bcryptjs` - Password hashing

### Caching
- `@nestjs/cache-manager` - Cache manager
- `cache-manager` - Cache abstraction
- `ioredis` - Redis client

### Validation
- `class-validator` - Validation decorators
- `class-transformer` - Object transformation

## 📄 License

This project is licensed under the MIT License.
