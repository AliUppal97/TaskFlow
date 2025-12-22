# TaskFlow - Commands to Run the Complete Project

This document provides all the commands needed to run the TaskFlow application.

## 🚀 Quick Reference

**Most Common Commands:**

### Windows PowerShell (Two Terminals):
```powershell
# Terminal 1 - Backend
cd backend; if (-not (Test-Path .env)) { Copy-Item env.template .env }; npm run start:dev

# Terminal 2 - Frontend  
cd frontend; npm run dev
```

### Linux/macOS (Two Terminals):
```bash
# Terminal 1 - Backend
cd backend && [ ! -f .env ] && cp env.template .env && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Prerequisites

- Node.js 18+ installed
- PostgreSQL, MongoDB, and Redis running (or use Docker)
- npm or yarn package manager

## Option 0: Using Helper Scripts (Easiest)

### Windows (PowerShell):
```powershell
# Start both servers in separate windows
.\start-all.ps1

# Or start individually:
.\start-backend.ps1   # Backend only
.\start-frontend.ps1  # Frontend only
```

### Linux/macOS (Bash):
```bash
# Make scripts executable (first time only)
chmod +x start-all.sh start-backend.sh start-frontend.sh

# Start both servers
./start-all.sh

# Or start individually:
./start-backend.sh   # Backend only
./start-frontend.sh  # Frontend only
```

## Option 1: Run Both Servers Manually (Recommended for Development)

### Windows (PowerShell)

#### Terminal 1 - Backend:
```powershell
cd backend
npm install
# Create .env file if it doesn't exist
if (-not (Test-Path .env)) { Copy-Item env.template .env }
npm run start:dev
```

#### Terminal 2 - Frontend:
```powershell
cd frontend
npm install
# Optional: Create .env.local file for custom API URL (defaults to http://localhost:3001)
# if (-not (Test-Path .env.local)) { 
#   Set-Content .env.local "NEXT_PUBLIC_API_URL=http://localhost:3001" 
# }
npm run dev
```

### Linux/macOS (Bash)

#### Terminal 1 - Backend:
```bash
cd backend
npm install
# Create .env file if it doesn't exist
[ ! -f .env ] && cp env.template .env
npm run start:dev
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
# Optional: Create .env.local file for custom API URL (defaults to http://localhost:3001)
# [ ! -f .env.local ] && echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev
```

## Option 2: Run Both Servers in Background (Single Terminal)

### Windows (PowerShell)

```powershell
# Start Backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run start:dev"

# Start Frontend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"
```

### Linux/macOS (Bash)

```bash
# Start Backend in background
cd backend && npm run start:dev > ../backend.log 2>&1 &

# Start Frontend in background
cd frontend && npm run dev > ../frontend.log 2>&1 &

# View logs
tail -f backend.log frontend.log
```

## Option 3: Using Docker Compose (All Services)

### Start all services (PostgreSQL, MongoDB, Redis, Backend, Frontend):
```bash
docker-compose up -d
```

### Start with development hot reload:
```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### View logs:
```bash
docker-compose logs -f
```

### Stop all services:
```bash
docker-compose down
```

## Option 4: Using npm Scripts (If Available)

If you have a root `package.json` with scripts, you can run:

```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run start:dev
```

## Quick Start Commands Summary

### One-Line Commands

**Windows PowerShell:**
```powershell
# Backend
cd backend; if (-not (Test-Path .env)) { Copy-Item env.template .env }; npm run start:dev

# Frontend (in another terminal)
cd frontend; npm run dev
```

**Linux/macOS:**
```bash
# Backend
cd backend && [ ! -f .env ] && cp env.template .env && npm run start:dev

# Frontend (in another terminal)
cd frontend && npm run dev
```

## Access the Application

Once both servers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## Verify Servers Are Running

### Windows (PowerShell):
```powershell
# Check if ports are listening
netstat -ano | Select-String "LISTENING" | Select-String ":3000|:3001"

# Check Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue
```

### Linux/macOS:
```bash
# Check if ports are listening
lsof -i :3000 -i :3001

# Or using netstat
netstat -tuln | grep -E ':3000|:3001'
```

## Troubleshooting

### Backend won't start:
1. Check if `.env` file exists in `backend/` directory
2. Verify PostgreSQL, MongoDB, and Redis are running
3. Check if port 3001 is already in use
4. Review error messages in the backend terminal

### Frontend won't start:
1. Check if `.env.local` file exists in `frontend/` directory
2. Verify `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
3. Check if port 3000 is already in use
4. Review error messages in the frontend terminal

### Port already in use:
**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/macOS:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

## Environment Setup

### Backend Environment Variables
Create `backend/.env` from `backend/env.template`:
```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=taskflow

MONGODB_URI=mongodb://localhost:27017/taskflow

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_ACCESS_SECRET=your-super-secret-access-key-here-at-least-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-at-least-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend Environment Variables (Optional)
The frontend defaults to `http://localhost:3001` if `NEXT_PUBLIC_API_URL` is not set.

To customize, create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Production Build Commands

### Build Backend:
```bash
cd backend
npm run build
npm run start:prod
```

### Build Frontend:
```bash
cd frontend
npm run build
npm start
```

## Stop Servers

### Windows (PowerShell):
```powershell
# Stop all Node.js processes
Get-Process -Name node | Stop-Process -Force
```

### Linux/macOS:
```bash
# Stop processes on specific ports
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
```

