# Complete Railway Backend Deployment Guide for TaskFlow

This guide provides detailed step-by-step instructions for deploying your TaskFlow NestJS backend to Railway.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up Databases](#setting-up-databases)
3. [Preparing Your Backend](#preparing-your-backend)
4. [Deploying to Railway](#deploying-to-railway)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Verifying Deployment](#verifying-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance & Updates](#maintenance--updates)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **GitHub account** (for Railway integration)
- ✅ **Railway account** (sign up at [railway.app](https://railway.app))
- ✅ **MongoDB Atlas account** (free tier available)
- ✅ **PostgreSQL hosting** (Railway, Supabase, or Neon)
- ✅ **Redis hosting** (Railway, Upstash, or Redis Cloud)
- ✅ **Git repository** with your code pushed to GitHub
- ✅ **Node.js 18+** installed locally (for testing)

---

## Setting Up Databases

### Step 1: Set Up MongoDB Atlas

MongoDB Atlas is used for event logs and notifications.

#### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign In"
3. Create a free account (or sign in if you have one)

#### 1.2 Create a Cluster

1. After logging in, click "Build a Database"
2. Choose **"M0 Free"** tier (free forever)
3. Select a cloud provider and region (choose closest to your users)
4. Click "Create Cluster"
5. Wait 3-5 minutes for cluster to be created

#### 1.3 Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter:
   - **Username:** `taskflow_user` (or your preferred name)
   - **Password:** Click "Autogenerate Secure Password" or create a strong password
   - ⚠️ **IMPORTANT:** Save the password securely! You'll need it later.
5. Under **"Database User Privileges"**, select **"Read and write to any database"**
6. Click **"Add User"**

#### 1.4 Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ For production, consider restricting to Railway IPs, but for simplicity, allow all
4. Click **"Confirm"**

#### 1.5 Get Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as driver and **"4.1 or later"** as version
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user credentials
7. Add database name at the end: `/taskflow?retryWrites=true&w=majority`
8. **Save this connection string** - you'll need it for Railway environment variables

**Example:**
```
mongodb+srv://taskflow_user:YourPassword123@cluster0.abc123.mongodb.net/taskflow?retryWrites=true&w=majority
```

---

### Step 2: Set Up PostgreSQL Database

PostgreSQL is used for users, tasks, and relationships.

#### Option A: Railway PostgreSQL (Recommended - Easiest)

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (recommended for easy integration)

2. **Create PostgreSQL Database:**
   - In Railway dashboard, click **"New Project"**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Wait for database to provision (takes 1-2 minutes)

3. **Get Connection Details:**
   - Click on your PostgreSQL service
   - Go to **"Variables"** tab
   - You'll see these variables:
     - `PGHOST`
     - `PGPORT`
     - `PGUSER`
     - `PGPASSWORD`
     - `PGDATABASE`
     - `DATABASE_URL` (full connection string)
   - **Save these values** - you'll need them for environment variables

**Note:** Railway PostgreSQL connection string format:
```
postgresql://postgres:password@host:port/database
```

#### Option B: Supabase (Free Alternative)

1. Go to [Supabase](https://supabase.com)
2. Sign up and create a new project
3. Wait for database to provision (2-3 minutes)
4. Go to **"Settings"** → **"Database"**
5. Find **"Connection string"** section
6. Copy the connection string (URI format)
7. Save it for Railway environment variables

#### Option C: Neon (Free Alternative)

1. Go to [Neon](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string from dashboard
4. Save it for Railway environment variables

---

### Step 3: Set Up Redis

Redis is used for caching and session management.

#### Option A: Railway Redis (Recommended - Easiest)

1. **In your Railway project:**
   - Click **"+ New"** → **"Database"** → **"Add Redis"**
   - Wait for Redis to provision (takes 1-2 minutes)

2. **Get Connection Details:**
   - Click on your Redis service
   - Go to **"Variables"** tab
   - You'll see:
     - `REDIS_HOST`
     - `REDIS_PORT`
     - `REDIS_PASSWORD`
     - `REDIS_URL` (full connection string)
   - **Save these values**

#### Option B: Upstash (Free Tier)

1. Go to [Upstash](https://upstash.com)
2. Sign up and create account
3. Click **"Create Database"**
4. Choose **"Regional"** (free tier)
5. Select a region close to your backend
6. Copy the **REST URL** and **Token** from dashboard
7. For Railway, you'll need:
   - `REDIS_HOST` (from REST URL)
   - `REDIS_PORT` (usually 6379)
   - `REDIS_PASSWORD` (the token)

#### Option C: Redis Cloud (Free Tier)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up and create a subscription
3. Create a database
4. Copy connection details

---

## Preparing Your Backend

### Step 1: Verify Your Code is Ready

1. **Ensure your code is committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Test build locally:**
   ```bash
   cd backend
   npm install
   npm run build
   ```
   - Ensure build succeeds without errors

3. **Verify package.json scripts:**
   - Check that `start:prod` script exists: `"start:prod": "node dist/main"`
   - Check that `build` script exists: `"build": "nest build"`

### Step 2: Prepare Environment Variables

Create a list of all environment variables you'll need. Here's the complete list:

```bash
# Application
NODE_ENV=production
PORT=3001

# PostgreSQL Database
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-postgres-password
DATABASE_NAME=taskflow

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow?retryWrites=true&w=majority

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT Secrets (Generate strong random strings - at least 32 characters)
JWT_ACCESS_SECRET=your-production-access-secret-min-32-chars-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars-long
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Update after frontend deployment)
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Step 3: Generate JWT Secrets

Generate strong random secrets for JWT tokens:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use online generator:**
- Visit [randomkeygen.com](https://randomkeygen.com/)
- Use "CodeIgniter Encryption Keys" - copy a 32+ character string

Generate **two separate secrets**:
- One for `JWT_ACCESS_SECRET`
- One for `JWT_REFRESH_SECRET`

⚠️ **IMPORTANT:** Keep these secrets secure and never commit them to Git!

---

## Deploying to Railway

### Step 1: Create Railway Project

1. **Go to Railway Dashboard:**
   - Visit [railway.app/dashboard](https://railway.app/dashboard)
   - Sign in if not already logged in

2. **Create New Project:**
   - Click **"New Project"** button
   - Select **"Deploy from GitHub repo"**
   - Authorize Railway to access your GitHub if prompted
   - Select your TaskFlow repository from the list

3. **Railway will detect your repository:**
   - Railway automatically detects Node.js projects
   - It will show a preview of your repository structure

### Step 2: Configure Service Settings

1. **Set Root Directory:**
   - Railway should auto-detect, but verify:
   - Click on your service
   - Go to **"Settings"** tab
   - Under **"Root Directory"**, set to: `backend`
   - This tells Railway where your backend code is located

2. **Configure Build Settings:**
   - Railway auto-detects Node.js, but verify:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - Railway usually auto-detects these, but you can set them manually in **"Settings"** → **"Deploy"**

3. **Set Node.js Version (Optional but Recommended):**
   - In **"Settings"** → **"Variables"**, add:
     - `NODE_VERSION=18` (or your preferred version)
   - Or create a `.nvmrc` file in your backend folder:
     ```
     18
     ```

### Step 3: Add Environment Variables

1. **Go to Variables Tab:**
   - Click on your backend service
   - Click **"Variables"** tab
   - Click **"+ New Variable"** for each variable

2. **Add Application Variables:**
   ```
   NODE_ENV = production
   PORT = 3001
   ```

3. **Add PostgreSQL Variables:**
   - If using Railway PostgreSQL, you can reference variables from the database service:
     - Click **"Reference Variable"**
     - Select your PostgreSQL service
     - Reference: `DATABASE_URL` → `DATABASE_URL`
   - Or add manually:
     ```
     DATABASE_HOST = <your-postgres-host>
     DATABASE_PORT = 5432
     DATABASE_USERNAME = postgres
     DATABASE_PASSWORD = <your-postgres-password>
     DATABASE_NAME = taskflow
     ```

4. **Add MongoDB Variable:**
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
   ```
   - Replace with your actual MongoDB Atlas connection string

5. **Add Redis Variables:**
   - If using Railway Redis, reference variables:
     - Reference: `REDIS_URL` → `REDIS_URL`
   - Or add manually:
     ```
     REDIS_HOST = <your-redis-host>
     REDIS_PORT = 6379
     REDIS_PASSWORD = <your-redis-password>
     REDIS_DB = 0
     ```

6. **Add JWT Secrets:**
   ```
   JWT_ACCESS_SECRET = <your-generated-access-secret>
   JWT_ACCESS_EXPIRES_IN = 15m
   JWT_REFRESH_SECRET = <your-generated-refresh-secret>
   JWT_REFRESH_EXPIRES_IN = 7d
   ```

7. **Add CORS Origin (Temporary):**
   ```
   CORS_ORIGIN = *
   ```
   - ⚠️ Set to `*` temporarily for testing
   - Update to your frontend URL after frontend deployment

### Step 4: Deploy

1. **Railway will automatically start deploying:**
   - After adding variables, Railway detects changes
   - It will automatically trigger a deployment
   - You can see the deployment progress in the **"Deployments"** tab

2. **Monitor Deployment:**
   - Click on the deployment to see logs
   - Watch for:
     - ✅ Build successful
     - ✅ Dependencies installed
     - ✅ Application started
     - ✅ Server listening on port

3. **Wait for Deployment to Complete:**
   - First deployment takes 3-5 minutes
   - Subsequent deployments are faster (1-2 minutes)

### Step 5: Get Your Backend URL

1. **After deployment completes:**
   - Railway automatically generates a public URL
   - Go to **"Settings"** → **"Networking"**
   - You'll see a URL like: `https://your-backend-name.up.railway.app`

2. **Generate Custom Domain (Optional):**
   - Click **"Generate Domain"** for a custom subdomain
   - Or add your own custom domain

3. **Save Your Backend URL:**
   - You'll need this for frontend configuration
   - Example: `https://taskflow-backend.up.railway.app`

---

## Post-Deployment Configuration

### Step 1: Verify Backend is Running

1. **Check Health Endpoint:**
   - Visit: `https://your-backend-url.up.railway.app/health`
   - Should return: `{ "status": "ok" }`

2. **Check Swagger Documentation:**
   - Visit: `https://your-backend-url.up.railway.app/api/docs`
   - Should show Swagger UI with all API endpoints

3. **Check Logs:**
   - Go to Railway dashboard → Your service → **"Deployments"** → Click latest deployment → **"View Logs"**
   - Look for: `🚀 TaskFlow API is running on: http://0.0.0.0:3001`
   - Check for any error messages

### Step 2: Test API Endpoints

1. **Test Health Endpoint:**
   ```bash
   curl https://your-backend-url.up.railway.app/health
   ```

2. **Test Swagger UI:**
   - Open Swagger docs in browser
   - Try a simple endpoint (like health check)

### Step 3: Create Admin User

After backend is deployed, create an admin user:

#### Option A: Using Railway Shell (Recommended)

1. **Open Railway Shell:**
   - Go to your backend service in Railway
   - Click **"Deployments"** → Latest deployment
   - Click **"View Logs"** → **"Open Shell"** (or use **"Shell"** tab)

2. **Run Admin Creation Script:**
   ```bash
   cd backend
   npm run create-admin
   ```
   - Follow prompts to create admin user
   - Enter email, password, and confirm admin role

#### Option B: Using API

1. **Register a user:**
   ```bash
   curl -X POST https://your-backend-url.up.railway.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "SecurePassword123!",
       "firstName": "Admin",
       "lastName": "User"
     }'
   ```

2. **Update user role to admin:**
   - Connect to your PostgreSQL database
   - Update the `users` table:
     ```sql
     UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
     ```

### Step 4: Update CORS Origin

After deploying your frontend (to Vercel or another platform):

1. **Get Frontend URL:**
   - Example: `https://taskflow.vercel.app`

2. **Update CORS in Railway:**
   - Go to Railway → Your backend service → **"Variables"**
   - Find `CORS_ORIGIN`
   - Update to: `https://your-frontend-url.vercel.app`
   - Railway will automatically redeploy

3. **Verify CORS:**
   - Test API calls from your frontend
   - Check browser console for CORS errors

---

## Verifying Deployment

### Checklist

- [ ] Backend URL is accessible
- [ ] Health endpoint returns `{ "status": "ok" }`
- [ ] Swagger docs are accessible at `/api/docs`
- [ ] No errors in Railway logs
- [ ] Database connections are working (check logs)
- [ ] Admin user created successfully
- [ ] CORS origin updated to frontend URL
- [ ] API endpoints respond correctly

### Test Endpoints

1. **Health Check:**
   ```bash
   curl https://your-backend-url.up.railway.app/health
   ```

2. **Swagger Docs:**
   - Visit: `https://your-backend-url.up.railway.app/api/docs`

3. **Register User (Test):**
   ```bash
   curl -X POST https://your-backend-url.up.railway.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

---

## Troubleshooting

### Issue: Deployment Fails

**Symptoms:** Railway shows deployment failed

**Solutions:**
1. **Check Build Logs:**
   - Go to Railway → Deployments → Failed deployment → View Logs
   - Look for error messages

2. **Common Issues:**
   - **Missing dependencies:** Check `package.json` has all dependencies
   - **Build errors:** Run `npm run build` locally to catch TypeScript errors
   - **Missing environment variables:** Ensure all required variables are set

3. **Fix and Redeploy:**
   - Fix the issue locally
   - Commit and push to GitHub
   - Railway will auto-redeploy

### Issue: Backend Starts But Crashes

**Symptoms:** Deployment succeeds but service keeps restarting

**Solutions:**
1. **Check Logs:**
   - View logs in Railway dashboard
   - Look for error messages

2. **Common Causes:**
   - **Database connection failed:** Check database credentials
   - **Port conflict:** Ensure `PORT` env var is set (Railway assigns port automatically)
   - **Missing environment variables:** Check all required vars are set

3. **Database Connection Issues:**
   - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - Check PostgreSQL connection string format
   - Verify Redis credentials

### Issue: Database Connection Timeout

**Symptoms:** Logs show database connection errors

**Solutions:**
1. **MongoDB Atlas:**
   - Verify IP whitelist includes `0.0.0.0/0`
   - Check connection string format
   - Verify username/password are correct

2. **PostgreSQL:**
   - Verify connection string format
   - Check database exists
   - Verify credentials

3. **Redis:**
   - Check Redis instance is running
   - Verify connection URL/host
   - Check password (if required)

### Issue: CORS Errors

**Symptoms:** Frontend can't make API calls, browser shows CORS errors

**Solutions:**
1. **Check CORS_ORIGIN:**
   - Ensure it matches your frontend URL exactly
   - Include `https://` protocol
   - No trailing slash

2. **Update and Redeploy:**
   - Update `CORS_ORIGIN` in Railway variables
   - Wait for automatic redeploy

### Issue: 404 on API Endpoints

**Symptoms:** API endpoints return 404

**Solutions:**
1. **Check API Prefix:**
   - All routes are prefixed with `/api/v1`
   - Example: `/api/v1/auth/login` (not `/auth/login`)

2. **Check Swagger:**
   - Visit `/api/docs` to see all available endpoints

### Issue: JWT Authentication Fails

**Symptoms:** Login works but subsequent requests fail

**Solutions:**
1. **Check JWT Secrets:**
   - Verify secrets are set in environment variables
   - Ensure they're at least 32 characters long
   - Check they're different for access and refresh tokens

2. **Check Token Expiration:**
   - Verify `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are set

3. **Check CORS:**
   - Ensure CORS allows credentials
   - Verify `withCredentials: true` in frontend axios config

### Issue: WebSocket Not Working

**Symptoms:** Real-time updates not working

**Solutions:**
1. **Verify WebSocket URL:**
   - Use `wss://` (secure WebSocket) not `ws://`
   - Format: `wss://your-backend-url.up.railway.app/tasks`

2. **Check Railway Support:**
   - Railway supports WebSockets automatically
   - No additional configuration needed

3. **Check Logs:**
   - Look for WebSocket connection errors in logs

### Issue: High Memory Usage

**Symptoms:** Service uses too much memory

**Solutions:**
1. **Check Database Connections:**
   - Monitor connection pool sizes
   - Ensure connections are properly closed

2. **Check Redis Cache:**
   - Verify cache TTLs are set (prevent memory leaks)
   - Monitor cache size

3. **Upgrade Plan:**
   - Consider upgrading Railway plan for more resources

---

## Maintenance & Updates

### Updating Your Backend

1. **Make Changes Locally:**
   ```bash
   # Make your code changes
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **Railway Auto-Deploys:**
   - Railway automatically detects GitHub pushes
   - Triggers new deployment
   - Usually completes in 1-2 minutes

3. **Monitor Deployment:**
   - Watch deployment logs
   - Verify deployment succeeds
   - Test endpoints after deployment

### Viewing Logs

1. **Real-time Logs:**
   - Railway dashboard → Your service → **"Deployments"** → Latest → **"View Logs"**

2. **Historical Logs:**
   - Click on any deployment to see its logs

### Managing Environment Variables

1. **Update Variables:**
   - Go to Railway → Your service → **"Variables"**
   - Click on variable to edit
   - Railway auto-redeploys after changes

2. **Add New Variables:**
   - Click **"+ New Variable"**
   - Add name and value
   - Railway redeploys automatically

### Scaling Your Backend

1. **Railway Auto-Scaling:**
   - Railway automatically handles scaling
   - Free tier includes basic resources
   - Paid plans offer more resources

2. **Manual Scaling:**
   - Upgrade Railway plan for more CPU/RAM
   - Railway handles load balancing automatically

### Database Backups

1. **MongoDB Atlas:**
   - Free tier includes daily backups
   - Configure backup schedule in Atlas dashboard

2. **PostgreSQL:**
   - Railway PostgreSQL: Check Railway docs for backup options
   - Supabase: Includes automatic backups
   - Neon: Includes point-in-time recovery

---

## Railway-Specific Tips

### Using Railway PostgreSQL

**Advantages:**
- Same platform as backend (easier management)
- Automatic connection string via `DATABASE_URL`
- No separate billing

**How to Use:**
1. Create PostgreSQL service in same Railway project
2. Reference `DATABASE_URL` in backend service variables
3. Railway handles connection automatically

### Using Railway Redis

**Advantages:**
- Same platform as backend
- Automatic connection via `REDIS_URL`
- No separate billing

**How to Use:**
1. Create Redis service in same Railway project
2. Reference `REDIS_URL` in backend service variables
3. Railway handles connection automatically

### Railway Environment Variables

**Best Practices:**
- Use **"Reference Variable"** for Railway services (PostgreSQL, Redis)
- This keeps variables in sync automatically
- Easier to manage

**Example:**
- Instead of manually entering PostgreSQL credentials
- Reference `DATABASE_URL` from PostgreSQL service
- Railway handles the rest

### Railway Networking

**Automatic HTTPS:**
- Railway provides free SSL certificates
- All URLs use HTTPS automatically
- No configuration needed

**Custom Domains:**
- Add custom domain in **"Settings"** → **"Networking"**
- Railway handles SSL certificate automatically
- Update DNS records as instructed

---

## Cost Estimation

### Free Tier (Development/Small Projects)

- **Railway:** $5 credit/month (usually enough for small apps)
- **MongoDB Atlas:** Free (512MB storage)
- **PostgreSQL:** Free (Railway/Supabase free tiers)
- **Redis:** Free (Railway/Upstash free tiers)

**Total:** ~$0-5/month

### Production Tier (Recommended)

- **Railway:** ~$10-20/month (Hobby plan)
- **MongoDB Atlas:** ~$9/month (M2 cluster)
- **PostgreSQL:** Included in Railway or ~$5-10/month
- **Redis:** Included in Railway or ~$5-10/month

**Total:** ~$25-50/month

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com/getting-started/)
- [NestJS Deployment Guide](https://docs.nestjs.com/recipes/deployment)
- [Railway Discord Community](https://discord.gg/railway)

---

## Quick Reference

### Railway Dashboard URLs

- **Dashboard:** https://railway.app/dashboard
- **Documentation:** https://docs.railway.app
- **Status Page:** https://status.railway.app

### Important Commands

**Local Testing:**
```bash
cd backend
npm install
npm run build
npm run start:prod
```

**Check Deployment:**
- Railway Dashboard → Your Service → Deployments

**View Logs:**
- Railway Dashboard → Your Service → Deployments → Latest → View Logs

**Open Shell:**
- Railway Dashboard → Your Service → Deployments → Latest → Open Shell

---

## Support

If you encounter issues:

1. **Check Railway Logs:** Most issues are visible in deployment logs
2. **Check Railway Status:** https://status.railway.app
3. **Railway Discord:** Join Railway Discord for community support
4. **Review This Guide:** Most common issues are covered above

---

**Last Updated:** 2024  
**Maintained by:** TaskFlow Team

---

## Summary

Deploying to Railway involves:

1. ✅ Setting up databases (MongoDB Atlas, PostgreSQL, Redis)
2. ✅ Creating Railway project and connecting GitHub repo
3. ✅ Configuring environment variables
4. ✅ Deploying backend service
5. ✅ Verifying deployment and creating admin user
6. ✅ Updating CORS after frontend deployment

Railway makes deployment simple with:
- Automatic deployments from GitHub
- Built-in PostgreSQL and Redis
- Free SSL certificates
- Easy environment variable management
- Real-time logs and monitoring

Your backend will be accessible at: `https://your-backend-name.up.railway.app`


