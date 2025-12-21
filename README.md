# TaskFlow - Real-Time Collaborative Task Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A production-ready, enterprise-grade task management system built with modern technologies. Features real-time collaboration, comprehensive security, and scalable architecture.

## 🌟 Features

### 🚀 Core Functionality
- **Task Management**: Create, update, assign, and track tasks with full CRUD operations
- **Real-time Collaboration**: WebSocket-powered instant updates across all clients
- **User Authentication**: JWT-based auth with access/refresh tokens and HttpOnly cookies
- **Role-Based Access Control**: Admin and User roles with granular permissions
- **Advanced Filtering**: Filter tasks by status, priority, assignee, and search terms
- **Pagination**: Efficient data loading with customizable page sizes

### 🔒 Security & Compliance
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Request Validation**: Comprehensive input validation with class-validator
- **Rate Limiting**: Built-in protection against abuse
- **CORS Configuration**: Secure cross-origin resource sharing
- **Audit Logging**: Complete event logging for compliance

### ⚡ Performance & Scalability
- **Redis Caching**: High-performance caching layer with invalidation strategies
- **Database Optimization**: Indexed queries and efficient data access
- **WebSocket Optimization**: Connection pooling and room-based messaging
- **Docker Ready**: Containerized deployment with multi-stage builds
- **Health Checks**: Built-in monitoring and health endpoints

### 🎨 User Experience
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Real-time Updates**: Instant task changes without page refresh
- **Mobile Friendly**: Responsive design for all device sizes
- **Accessibility**: WCAG compliant components
- **Offline Ready**: Progressive Web App capabilities

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │     NestJS      │    │   Databases     │
│   Frontend      │◄──►│   Backend API   │◄──►│                 │
│                 │    │                 │    │ • PostgreSQL    │
│ • React Query   │    │ • TypeORM       │    │ • MongoDB       │
│ • WebSockets    │    │ • JWT Auth      │    │ • Redis         │
│ • TypeScript    │    │ • WebSockets    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Backend Architecture (Clean Architecture)
```
src/
├── common/           # Shared utilities, interfaces, policies
├── config/           # Database, Redis, JWT configuration
├── entities/         # TypeORM entities (User, Task, EventLog)
├── modules/          # Feature modules
│   ├── auth/        # Authentication system
│   ├── tasks/       # Task management + WebSockets
│   └── events/      # Event logging service
├── guards/          # Route guards (JWT, Roles, Permissions)
├── decorators/      # Custom decorators (@Roles, @Permissions)
├── interceptors/    # Request/response interceptors
├── dto/            # Data Transfer Objects
└── providers/      # Global providers
```

### Frontend Architecture
```
src/
├── app/             # Next.js App Router pages
├── components/      # Shared UI components
├── features/        # Feature-specific code
│   ├── auth/       # Authentication pages & components
│   └── tasks/      # Task management (dashboard, forms, lists)
├── providers/      # React Context providers
├── hooks/          # Custom React hooks
├── lib/            # Utilities (API client, utils)
└── types/          # TypeScript type definitions
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL (TypeORM)
- **Cache**: Redis
- **Events**: MongoDB
- **Authentication**: JWT with HttpOnly cookies
- **Validation**: class-validator
- **WebSockets**: Socket.IO
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **WebSockets**: Socket.IO Client

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Health checks
- **Security**: Rate limiting, CORS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+

### Local Development with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskflow.git
   cd taskflow
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   # Start all services (PostgreSQL, MongoDB, Redis, Backend, Frontend)
   docker-compose up -d

   # Or for development with hot reload
   docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://localhost:3000
   - **API Documentation**: http://localhost:3000/api/docs

### Manual Setup (without Docker)

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.template .env
   # Configure your .env file
   npm run start:dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Configure your .env.local file
   npm run dev
   ```

## 📖 API Documentation

### Authentication Endpoints

```bash
POST /api/v1/auth/register  # Register new user
POST /api/v1/auth/login     # Login user
POST /api/v1/auth/refresh   # Refresh access token
POST /api/v1/auth/logout    # Logout user
GET  /api/v1/auth/profile   # Get user profile
```

### Task Endpoints

```bash
GET    /api/v1/tasks        # List tasks (paginated, filtered)
POST   /api/v1/tasks        # Create task
GET    /api/v1/tasks/:id    # Get task by ID
PATCH  /api/v1/tasks/:id    # Update task
DELETE /api/v1/tasks/:id    # Delete task
PATCH  /api/v1/tasks/:id/assign  # Assign task
GET    /api/v1/tasks/stats  # Get task statistics
```

### WebSocket Events

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000/tasks', {
  auth: { token: 'your-jwt-token' }
});

// Subscribe to task updates
socket.emit('subscribe-to-task', { taskId: 'task-uuid' });

// Listen for task events
socket.on('task-event', (event) => {
  console.log('Task event:', event);
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
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

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:cov         # Test coverage
```

### Frontend Tests
```bash
cd frontend
npm run test             # Unit tests
npm run test:e2e         # End-to-end tests
```

## 🚢 Deployment

### Docker Production Deployment

1. **Build and deploy**
   ```bash
   # Production build
   docker-compose -f docker-compose.prod.yml up -d

   # Or use Docker Compose with environment file
   docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d
   ```

### Manual Production Deployment

1. **Backend Deployment**
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Application health status
- `GET /ping` - Simple connectivity check
- `GET /api/v1/tasks/stats` - Task statistics

### Docker Health Checks
All services include built-in health checks for:
- Database connectivity
- Redis availability
- Application responsiveness

## 🔐 Security

### Authentication Flow
1. User registers/logs in
2. Server returns access token (in response) and refresh token (HttpOnly cookie)
3. Client includes access token in Authorization header
4. Server validates token and processes request
5. On token expiry, client uses refresh endpoint to get new tokens

### Security Features
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Security**: Short-lived access tokens (15min) with secure refresh tokens
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Comprehensive validation on all inputs
- **CORS**: Configured for specific origins
- **Audit Logging**: All actions are logged for compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write comprehensive tests
- Follow conventional commit messages
- Update documentation for new features
- Ensure all linting passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Next.js](https://nextjs.org/) - The React framework for production
- [TypeORM](https://typeorm.io/) - ORM for TypeScript
- [Socket.IO](https://socket.io/) - Real-time bidirectional communication
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

For support, email support@taskflow.com or join our Slack community.

---

Built with ❤️ using modern web technologies for enterprise-grade task management.