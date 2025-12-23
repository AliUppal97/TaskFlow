# Complete Vercel Deployment Guide for TaskFlow

This guide provides step-by-step instructions for deploying your TaskFlow application to Vercel (frontend) and recommended backend hosting solutions.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment Options](#backend-deployment-options)
3. [Deploy Backend First](#deploy-backend-first)
4. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (for Vercel integration)
- ✅ Vercel account (free tier available)
- ✅ Backend hosting account (Railway, Render, or AWS)
- ✅ Database hosting accounts:
  - MongoDB Atlas (free tier available)
  - PostgreSQL hosting (Railway, Supabase, or Neon)
  - Redis hosting (Upstash, Redis Cloud, or Railway)

---

## Backend Deployment Options

Since Vercel is optimized for frontend/serverless functions, your NestJS backend needs separate hosting. Here are the best options:

### Option 1: Railway (Recommended for Simplicity) ⭐

**Pros:**
- Easy setup, similar to Vercel
- Built-in PostgreSQL and Redis
- Automatic deployments from GitHub
- Free tier available ($5 credit/month)
- Supports WebSockets

**Pricing:** ~$5-20/month

### Option 2: Render

**Pros:**
- Free tier available (with limitations)
- Built-in PostgreSQL
- Automatic deployments
- Supports WebSockets

**Cons:**
- Free tier spins down after inactivity
- Limited resources on free tier

**Pricing:** Free tier available, paid starts at $7/month

### Option 3: AWS (EC2/ECS/Elastic Beanstalk)

**Pros:**
- Highly scalable
- Full control
- Enterprise-grade

**Cons:**
- More complex setup
- Requires AWS knowledge
- Higher cost

**Pricing:** ~$15-50/month

### Option 4: DigitalOcean App Platform

**Pros:**
- Simple deployment
- Good documentation
- Supports WebSockets

**Pricing:** ~$12-25/month

---

## Deploy Backend First

**⚠️ Important:** Deploy your backend first to get the API URL, which you'll need for frontend configuration.

### Step 1: Set Up Databases

#### 1.1 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose free tier M0)
4. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Username: `taskflow_user`
   - Password: Generate a strong password (save it!)
   - Database User Privileges: "Read and write to any database"
5. Whitelist IP addresses:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (or add specific IPs)
6. Get connection string:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/taskflow`)

#### 1.2 PostgreSQL Setup

**Option A: Railway PostgreSQL**
1. Go to [Railway](https://railway.app)
2. Create account → "New Project"
3. Click "+ New" → "Database" → "PostgreSQL"
4. Copy connection details from the "Variables" tab

**Option B: Supabase (Free)**
1. Go to [Supabase](https://supabase.com)
2. Create account → "New Project"
3. Wait for database to provision
4. Go to "Settings" → "Database"
5. Copy connection string from "Connection string" section

**Option C: Neon (Free)**
1. Go to [Neon](https://neon.tech)
2. Create account → "Create Project"
3. Copy connection string from dashboard

#### 1.3 Redis Setup

**Option A: Upstash (Free tier)**
1. Go to [Upstash](https://upstash.com)
2. Create account → "Create Database"
3. Choose "Regional" (free tier)
4. Copy REST URL and token from dashboard

**Option B: Railway Redis**
1. In Railway project, click "+ New" → "Database" → "Redis"
2. Copy connection details from "Variables" tab

**Option C: Redis Cloud (Free tier)**
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create account → "New Subscription" → "Free"
3. Create database → Copy connection details

---

### Step 2: Deploy Backend to Railway (Recommended)

#### 2.1 Prepare Backend for Deployment

1. **Create `vercel.json` for backend (if needed) or use Railway's native deployment**

2. **Update backend environment variables** - Create a `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database (PostgreSQL) - Use your Railway/Supabase connection string
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-postgres-user
DATABASE_PASSWORD=your-postgres-password
DATABASE_NAME=taskflow

# MongoDB - Use your Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow

# Redis - Use your Upstash/Railway connection details
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT Secrets - Generate strong random strings (at least 32 characters)
JWT_ACCESS_SECRET=your-production-access-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Will be updated after frontend deployment
CORS_ORIGIN=https://your-app.vercel.app
```

3. **Generate JWT secrets** (use a secure random string generator):
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use online generator: https://randomkeygen.com/
```

#### 2.2 Deploy to Railway

1. **Connect Repository:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your TaskFlow repository
   - Select the `backend` folder as the root directory

2. **Configure Build Settings:**
   - Railway auto-detects Node.js projects
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Root Directory: `/backend` (if deploying from monorepo)

3. **Add Environment Variables:**
   - In Railway project, go to "Variables" tab
   - Add all environment variables from your `.env.production`
   - Railway will automatically expose a public URL (e.g., `https://your-backend.up.railway.app`)

4. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://taskflow-backend.up.railway.app`)

5. **Verify Deployment:**
   - Visit: `https://your-backend-url.up.railway.app/api/docs`
   - You should see Swagger documentation
   - Test health endpoint: `https://your-backend-url.up.railway.app/health`

#### 2.3 Update CORS Origin

After getting your backend URL, update the CORS origin in Railway:
- Go to Railway → Your Backend Service → Variables
- Update `CORS_ORIGIN` to your Vercel frontend URL (you'll get this after frontend deployment)
- Or set it to `*` temporarily for testing (not recommended for production)

---

### Alternative: Deploy Backend to Render

1. **Create Account:**
   - Go to [Render](https://render.com)
   - Sign up with GitHub

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `taskflow-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm run start:prod`

3. **Add Environment Variables:**
   - Go to "Environment" tab
   - Add all variables from `.env.production`

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment
   - Copy the URL (e.g., `https://taskflow-backend.onrender.com`)

---

## Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Update `next.config.ts`** (if needed for production):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add any production-specific config here
  // Vercel handles most optimizations automatically
};

export default nextConfig;
```

2. **Ensure `.gitignore` includes:**
```
.env.local
.env*.local
node_modules
.next
```

### Step 2: Push to GitHub

1. **Commit all changes:**
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. **Ensure your repository is on GitHub** (not just local)

### Step 3: Deploy to Vercel

#### 3.1 Initial Deployment

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository containing TaskFlow

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (if monorepo) or leave empty if frontend is root
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   Add these variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
   ```
   ⚠️ **Important:** Replace with your actual backend URL from Railway/Render

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Vercel will provide a URL like: `https://taskflow-xyz.vercel.app`

#### 3.2 Update Backend CORS

After getting your Vercel URL:

1. **Go back to Railway/Render:**
   - Update `CORS_ORIGIN` environment variable
   - Set to: `https://your-app.vercel.app`
   - Redeploy backend (Railway auto-redeploys, Render requires manual)

2. **Verify CORS:**
   - Open browser console on your Vercel app
   - Try logging in
   - Check for CORS errors

---

## Post-Deployment Configuration

### Step 1: Create Admin User

After backend is deployed, create an admin user:

1. **SSH into your backend server** (if possible), or:
2. **Use Railway/Render console:**
   - Railway: Go to your service → "Deployments" → Click on a deployment → "View Logs" → "Open Shell"
   - Render: Go to your service → "Shell" tab

3. **Run admin creation script:**
```bash
cd backend
npm run create-admin
# Follow prompts to create admin user
```

**Alternative: Use API to create admin:**
1. Register a user via API: `POST /api/v1/auth/register`
2. Update user role to admin in database (via MongoDB Atlas/Railway console)

### Step 2: Configure Custom Domain (Optional)

#### Vercel Custom Domain:
1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_API_URL` if needed

#### Backend Custom Domain:
- **Railway:** Go to service → "Settings" → "Generate Domain" (free subdomain) or add custom domain
- **Render:** Go to service → "Settings" → "Custom Domain"

### Step 3: Set Up Environment-Specific Variables

**Vercel Environment Variables:**
- Go to project → "Settings" → "Environment Variables"
- Add variables for different environments:
  - Production: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
  - Preview: `NEXT_PUBLIC_API_URL=https://your-backend-url.com` (or staging URL)
  - Development: (optional, for local dev)

### Step 4: Enable Automatic Deployments

**Vercel:**
- Automatic deployments are enabled by default
- Every push to `main` branch = production deployment
- Pull requests = preview deployments

**Railway:**
- Automatic deployments enabled by default
- Every push to connected branch = new deployment

**Render:**
- Automatic deployments enabled by default
- Can configure auto-deploy branch in settings

---

## How Backend Works After Deployment

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│  Vercel         │  HTTPS  │  Railway/Render │
│  (Frontend)     │────────►│  (Backend API)  │
│                 │         │                 │
│  Next.js App    │         │  NestJS Server  │
└─────────────────┘         └─────────────────┘
                                      │
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
            │  MongoDB     │  │ PostgreSQL  │  │   Redis     │
            │  Atlas       │  │  Railway/   │  │  Upstash/  │
            │              │  │  Supabase   │  │  Railway    │
            └──────────────┘  └─────────────┘  └─────────────┘
```

### Key Points:

1. **Frontend (Vercel):**
   - Serves static Next.js pages
   - Makes API calls to backend
   - Handles WebSocket connections to backend
   - Environment variable `NEXT_PUBLIC_API_URL` points to backend

2. **Backend (Railway/Render):**
   - Runs NestJS server continuously
   - Handles all API requests
   - Manages WebSocket connections
   - Connects to external databases
   - CORS configured to allow Vercel domain

3. **Database Connections:**
   - **PostgreSQL:** TypeORM connects via connection string
   - **MongoDB:** Mongoose connects via Atlas connection string
   - **Redis:** ioredis connects via Redis URL/password

4. **WebSocket Support:**
   - Backend must support WebSockets (Railway/Render both support)
   - Frontend connects via: `wss://your-backend-url.com/tasks`
   - Socket.IO handles connection management

### Request Flow:

1. **User visits:** `https://your-app.vercel.app`
2. **Vercel serves:** Next.js static pages
3. **Frontend makes API call:** `axios.get('${NEXT_PUBLIC_API_URL}/api/v1/tasks')`
4. **Request goes to:** Railway/Render backend
5. **Backend processes:** Validates JWT, queries databases, returns response
6. **Frontend receives:** Data and updates UI

### WebSocket Flow:

1. **Frontend connects:** `io('${NEXT_PUBLIC_API_URL}/tasks', { auth: { token } })`
2. **Backend authenticates:** Validates JWT token
3. **Connection established:** Socket.IO room-based messaging
4. **Real-time updates:** Backend emits events, frontend receives via WebSocket

### Environment Variables Flow:

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL` → Publicly accessible (included in client bundle)
- Used by: `api-client.ts`, `websocket-provider.tsx`

**Backend (Railway/Render):**
- All environment variables are server-side only
- `CORS_ORIGIN` → Must match Vercel domain
- Database credentials → Secure, never exposed

---

## Troubleshooting

### Issue: CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solution:**
1. Check `CORS_ORIGIN` in backend matches Vercel URL exactly
2. Include protocol: `https://your-app.vercel.app` (not just `your-app.vercel.app`)
3. Redeploy backend after changing CORS_ORIGIN

### Issue: API Calls Fail (404 or Connection Refused)

**Symptoms:** Network tab shows failed requests

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. Check backend is running (visit backend URL in browser)
3. Ensure backend URL includes `https://` protocol
4. Check backend logs for errors

### Issue: WebSocket Connection Fails

**Symptoms:** Real-time updates not working

**Solution:**
1. Verify WebSocket URL uses `wss://` (secure WebSocket)
2. Check backend supports WebSockets (Railway/Render both do)
3. Verify JWT token is valid
4. Check browser console for WebSocket errors
5. Ensure backend WebSocket gateway is properly configured

### Issue: Database Connection Errors

**Symptoms:** Backend logs show database connection failures

**Solution:**
1. **MongoDB Atlas:**
   - Verify IP whitelist includes `0.0.0.0/0` (or Railway/Render IPs)
   - Check connection string format
   - Verify username/password are correct

2. **PostgreSQL:**
   - Verify connection string format
   - Check database exists
   - Verify credentials

3. **Redis:**
   - Verify connection URL/host
   - Check password (if required)
   - Ensure Redis instance is running

### Issue: Build Fails on Vercel

**Symptoms:** Vercel deployment fails during build

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (Vercel auto-detects, but can specify in `package.json`)
4. Check for TypeScript errors: `npm run build` locally first
5. Ensure `next.config.ts` is valid

### Issue: Environment Variables Not Working

**Symptoms:** `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solution:**
1. **Important:** Only `NEXT_PUBLIC_*` variables are available in browser
2. Add variables in Vercel dashboard (not `.env.local`)
3. Redeploy after adding variables
4. Variables are injected at build time, not runtime

### Issue: JWT Authentication Fails

**Symptoms:** Login works but subsequent requests fail

**Solution:**
1. Verify JWT secrets are set in backend
2. Check token expiration times
3. Ensure `withCredentials: true` in axios config (already set)
4. Check CORS allows credentials
5. Verify refresh token endpoint works

---

## Production Checklist

Before going live, ensure:

- [ ] Backend deployed and accessible
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set correctly
- [ ] `CORS_ORIGIN` matches Vercel domain
- [ ] All environment variables configured
- [ ] Database connections working
- [ ] Admin user created
- [ ] WebSocket connections working
- [ ] SSL/HTTPS enabled (automatic on Vercel/Railway)
- [ ] Custom domain configured (optional)
- [ ] Monitoring/logging set up (optional)
- [ ] Backup strategy for databases (optional)

---

## Cost Estimation

### Free Tier (Development/Small Projects):

- **Vercel:** Free (unlimited personal projects)
- **Railway:** $5 credit/month (usually enough for small apps)
- **MongoDB Atlas:** Free (512MB storage)
- **Supabase/Neon:** Free (limited resources)
- **Upstash Redis:** Free (10K commands/day)

**Total:** ~$0-5/month

### Production Tier (Recommended):

- **Vercel Pro:** $20/month (or free for personal)
- **Railway:** ~$10-20/month
- **MongoDB Atlas:** ~$9/month (M2 cluster)
- **PostgreSQL:** ~$5-10/month
- **Redis:** ~$5-10/month

**Total:** ~$50-70/month

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check backend logs (Railway/Render)
3. Review browser console for errors
4. Verify all environment variables
5. Test API endpoints directly (Postman/curl)

---

**Last Updated:** 2024
**Maintained by:** TaskFlow Team

