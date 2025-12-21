# Port Configuration Guide

This document explains the port configuration for TaskFlow to ensure frontend and backend run on separate ports.

## Local Development (Without Docker)

### Port Assignment
- **Frontend (Next.js)**: Port `3000`
- **Backend (NestJS)**: Port `3001`

### Configuration Files

#### Frontend Configuration
- **Package.json**: Scripts explicitly set port 3000
  ```json
  "dev": "next dev -p 3000"
  "start": "next start -p 3000"
  ```

- **Environment Variables** (`.env.local` or `env.example`):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

- **API Client** (`frontend/src/lib/api-client.ts`):
  - Defaults to `http://localhost:3001` if `NEXT_PUBLIC_API_URL` is not set

#### Backend Configuration
- **Configuration** (`backend/src/config/configuration.ts`):
  - Default port: `3001` (can be overridden with `PORT` environment variable)
  - CORS origin: `http://localhost:3000` (allows frontend requests)

- **Environment Variables** (`backend/.env` or `backend/env.template`):
  ```env
  PORT=3001
  CORS_ORIGIN=http://localhost:3000
  ```

### Running the Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run start:dev
   # Backend will run on http://localhost:3001
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   # Frontend will run on http://localhost:3000
   ```

### Verification

- Backend API: http://localhost:3001/api/v1
- Backend Swagger: http://localhost:3001/api/docs
- Frontend: http://localhost:3000

## Docker Development

When using Docker Compose, ports are mapped differently:

- **Backend**: Container port 3000 → Host port 3000
- **Frontend**: Container port 3000 → Host port 3001

This is configured in `docker-compose.yml`:
```yaml
backend:
  ports:
    - "3000:3000"  # Host:Container

frontend:
  ports:
    - "3001:3000"  # Host:Container (frontend runs on 3000 inside, exposed as 3001)
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Windows:**
```powershell
# Find process using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find process using the port
lsof -i :3000
lsof -i :3001

# Kill the process (replace <PID> with actual process ID)
kill -9 <PID>
```

### Change Ports

If you need to use different ports:

1. **Change Frontend Port**:
   - Update `frontend/package.json` scripts
   - Update `NEXT_PUBLIC_API_URL` if backend port changes

2. **Change Backend Port**:
   - Set `PORT` environment variable in backend `.env`
   - Update `CORS_ORIGIN` to match new frontend port
   - Update `NEXT_PUBLIC_API_URL` in frontend `.env`

## Summary

✅ **Frontend**: Always runs on port **3000** (local development)
✅ **Backend**: Always runs on port **3001** (local development)
✅ **CORS**: Backend allows requests from `http://localhost:3000`
✅ **API URL**: Frontend connects to `http://localhost:3001`

This ensures proper separation and prevents port conflicts.

