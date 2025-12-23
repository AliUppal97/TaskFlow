# Backend Deployment Architecture

This document explains how your NestJS backend works after deployment to Railway, Render, or other hosting platforms.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / Users                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS Requests
                       │ WebSocket Connections
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Railway/Render)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NestJS Application                      │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │   Auth       │  │   Tasks      │  │  Events   │ │  │
│  │  │   Module     │  │   Module     │  │  Module   │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         WebSocket Gateway                    │   │  │
│  │  │    (Socket.IO for Real-time Updates)         │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │   Guards     │  │ Interceptors │  │ Filters   │ │  │
│  │  │  (JWT, RBAC) │  │  (Logging)   │  │ (Errors)  │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Port: 3001 (or auto-assigned by platform)                │
│  Protocol: HTTP/HTTPS, WebSocket (WSS)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │   MongoDB    │ │    Redis     │
│  (Railway/   │ │   (Atlas)    │ │  (Upstash/   │
│   Supabase)  │ │              │ │   Railway)   │
│              │ │              │ │              │
│  - Users     │ │  - Events    │ │  - Cache     │
│  - Tasks     │ │  - Logs      │ │  - Sessions  │
│  - Relations │ │  - Notifications│  - Rate Limit│
└──────────────┘ └──────────────┘ └──────────────┘
```

## How It Works

### 1. Request Flow

```
User Request
    │
    ▼
[Vercel Frontend]
    │
    │ HTTPS Request
    │ Authorization: Bearer <JWT>
    ▼
[Backend Server]
    │
    ├─► [CORS Middleware] - Validates origin
    ├─► [Helmet] - Security headers
    ├─► [Cookie Parser] - Parses refresh token cookie
    ├─► [JWT Guard] - Validates access token
    ├─► [Role Guard] - Checks user permissions (if needed)
    ├─► [Validation Pipe] - Validates request body/params
    ├─► [Controller] - Handles business logic
    ├─► [Service] - Database operations
    │   │
    │   ├─► [TypeORM] ──► PostgreSQL (Users, Tasks)
    │   ├─► [Mongoose] ──► MongoDB (Events, Logs)
    │   └─► [Redis] ──► Cache/Sessions
    │
    └─► [Response] ──► JSON data to frontend
```

### 2. WebSocket Flow

```
Frontend WebSocket Connection
    │
    │ wss://backend-url/tasks
    │ auth: { token: <JWT> }
    ▼
[Backend WebSocket Gateway]
    │
    ├─► [JWT Authentication] - Validates token
    ├─► [Room Management] - Joins user to rooms
    │
    ├─► [Task Events] - Broadcasts task updates
    │   │
    │   ├─► Task created ──► Emit to all users
    │   ├─► Task updated ──► Emit to task subscribers
    │   └─► Task deleted ──► Emit to task subscribers
    │
    └─► [Notification Events] - Sends real-time notifications
```

### 3. Database Connections

#### PostgreSQL (TypeORM)
- **Purpose:** Primary database for structured data
- **Entities:** Users, Tasks, TaskAssignments
- **Connection:** Managed via TypeORM connection pool
- **Migrations:** Run automatically on startup (if configured)

#### MongoDB (Mongoose)
- **Purpose:** Event logging and notifications
- **Collections:** EventLogs, Notifications
- **Connection:** Mongoose connection pool
- **Indexes:** Auto-created on first write

#### Redis (ioredis)
- **Purpose:** Caching and session management
- **Use Cases:**
  - Cache task lists (with TTL)
  - Rate limiting counters
  - Session storage
  - Real-time presence tracking

### 4. Authentication Flow

```
Login Request
    │
    ▼
[Auth Controller]
    │
    ├─► Validate credentials
    ├─► Hash password (bcrypt)
    ├─► Query PostgreSQL for user
    │
    ├─► Generate JWT tokens:
    │   ├─► Access Token (15min) ──► Return in response body
    │   └─► Refresh Token (7days) ──► Set as HttpOnly cookie
    │
    └─► Return user data + access token

Subsequent Requests
    │
    ▼
[Request Interceptor]
    │
    ├─► Extract token from Authorization header
    ├─► Validate token (JWT Guard)
    │
    ├─► If valid ──► Attach user to request ──► Continue
    │
    └─► If invalid ──► 401 Unauthorized

Token Refresh
    │
    ▼
[Refresh Endpoint]
    │
    ├─► Extract refresh token from HttpOnly cookie
    ├─► Validate refresh token
    ├─► Generate new access token
    │
    └─► Return new access token
```

## Platform-Specific Details

### Railway

**How It Works:**
- Railway runs your backend as a **persistent Node.js process**
- Uses Docker containers (you can provide Dockerfile or Railway auto-detects)
- Provides automatic HTTPS with free SSL certificate
- Auto-scales based on traffic (paid plans)
- Environment variables managed in dashboard

**Process Lifecycle:**
1. Railway clones your repository
2. Runs `npm install` (or your build command)
3. Runs `npm run build` (compiles TypeScript)
4. Runs `npm run start:prod` (starts Node.js server)
5. Keeps process running continuously
6. Restarts on crashes or deployments

**Networking:**
- Railway assigns a public URL (e.g., `https://xxx.up.railway.app`)
- All HTTP/HTTPS traffic routes to your app
- WebSocket connections supported automatically
- Port is auto-assigned (use `PORT` env var or Railway assigns)

**Database Access:**
- Railway databases are accessible via connection strings
- Connection strings provided as environment variables
- Automatic connection pooling handled by TypeORM/Mongoose

### Render

**How It Works:**
- Similar to Railway but with some differences
- Free tier: Spins down after 15 minutes of inactivity
- Paid tier: Always-on service
- Automatic deployments from GitHub

**Process Lifecycle:**
- Same as Railway
- Free tier: First request after inactivity takes ~30s (cold start)

**Networking:**
- Render assigns URL (e.g., `https://xxx.onrender.com`)
- WebSocket support included
- Free tier has request timeout limits

### AWS/Other Platforms

**How It Works:**
- Full control over infrastructure
- Can use EC2 (virtual machine), ECS (containers), or Elastic Beanstalk
- Requires more configuration but more flexibility
- Better for high-scale applications

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3001  # Or auto-assigned

# PostgreSQL
DATABASE_HOST=xxx.railway.app
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=xxx
DATABASE_NAME=taskflow

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow

# Redis
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx

# JWT
JWT_ACCESS_SECRET=xxx (32+ chars)
JWT_REFRESH_SECRET=xxx (32+ chars)

# CORS
CORS_ORIGIN=https://your-app.vercel.app
```

### How Variables Are Loaded

1. **Platform Dashboard:** Variables set in Railway/Render dashboard
2. **ConfigService:** NestJS `@nestjs/config` loads variables
3. **Configuration Module:** Maps env vars to typed config object
4. **Application:** Uses config throughout app

## Scaling Considerations

### Horizontal Scaling (Multiple Instances)

If you need to scale to multiple backend instances:

1. **Stateless Design:** ✅ Your app is stateless (JWT tokens, no server-side sessions)
2. **Database Connections:** ✅ PostgreSQL/MongoDB handle multiple connections
3. **Redis:** ✅ Shared Redis instance for cache/sessions
4. **WebSockets:** ⚠️ Socket.IO supports Redis adapter for multi-instance
   - Need to configure Socket.IO Redis adapter
   - All instances share WebSocket connections via Redis

### Vertical Scaling (More Resources)

- Railway/Render: Upgrade plan for more CPU/RAM
- AWS: Increase instance size
- Monitor: Database connection limits, memory usage

## Monitoring & Logging

### Built-in Logging

Your backend includes:
- Request logging interceptor
- Error logging filter
- Console logging (stdout/stderr)

### Platform Logs

- **Railway:** View logs in dashboard → Deployments → Logs
- **Render:** View logs in dashboard → Logs tab
- **AWS:** CloudWatch Logs

### Health Checks

Your backend exposes:
- `GET /health` - Health check endpoint
- `GET /api/docs` - Swagger documentation

Platforms can use these for:
- Health monitoring
- Auto-restart on failures
- Load balancer health checks

## Security Considerations

### HTTPS/SSL
- ✅ Automatic on Railway/Render (free SSL)
- ✅ All traffic encrypted

### CORS
- ✅ Configured to allow only Vercel domain
- ✅ Credentials enabled for cookies

### Database Security
- ✅ Connection strings use SSL/TLS
- ✅ Credentials in environment variables (not code)
- ✅ IP whitelisting (MongoDB Atlas)

### JWT Security
- ✅ Short-lived access tokens (15min)
- ✅ Refresh tokens in HttpOnly cookies
- ✅ Strong secrets (32+ characters)

## Troubleshooting Common Issues

### Issue: Backend Crashes on Startup

**Check:**
1. Database connection strings are correct
2. All required environment variables are set
3. Build succeeded (check build logs)
4. Port is available (or use PORT env var)

### Issue: Database Connection Timeout

**Check:**
1. Database is running and accessible
2. IP whitelist includes Railway/Render IPs (for MongoDB)
3. Connection string format is correct
4. Database credentials are correct

### Issue: WebSocket Not Working

**Check:**
1. Platform supports WebSockets (Railway/Render both do)
2. URL uses `wss://` (secure WebSocket)
3. JWT token is valid
4. CORS allows WebSocket connections

### Issue: High Memory Usage

**Check:**
1. Database connection pool sizes
2. Redis cache TTLs (prevent memory leaks)
3. Log file sizes
4. Consider upgrading plan

## Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use platform's environment variable management
   - Use different values for dev/staging/prod

2. **Database Connections:**
   - Use connection pooling (TypeORM/Mongoose handle this)
   - Set appropriate pool sizes
   - Monitor connection counts

3. **Error Handling:**
   - All errors are caught by global exception filter
   - Errors logged but not exposed to clients
   - Return user-friendly error messages

4. **Performance:**
   - Use Redis caching for frequently accessed data
   - Optimize database queries (indexes)
   - Monitor response times

5. **Deployment:**
   - Test locally with production-like environment
   - Use staging environment before production
   - Monitor logs after deployment
   - Have rollback plan

---

## Summary

Your backend after deployment:

1. **Runs continuously** as a Node.js process
2. **Handles HTTP/HTTPS requests** from frontend
3. **Manages WebSocket connections** for real-time updates
4. **Connects to external databases** (PostgreSQL, MongoDB, Redis)
5. **Validates authentication** on every request
6. **Processes business logic** and returns responses
7. **Logs all activity** for monitoring and debugging

The backend is **stateless** (no server-side sessions), making it easy to scale horizontally if needed.

---

**Last Updated:** 2024

