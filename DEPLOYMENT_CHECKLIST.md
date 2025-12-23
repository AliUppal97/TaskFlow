# Quick Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Build succeeds locally (`npm run build` in frontend)
- [ ] No TypeScript errors
- [ ] Environment variables documented

## Database Setup

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] PostgreSQL database created (Railway/Supabase/Neon)
- [ ] PostgreSQL connection details obtained
- [ ] Redis instance created (Upstash/Railway)
- [ ] Redis connection details obtained

## Backend Deployment

- [ ] Railway/Render account created
- [ ] Backend repository connected
- [ ] All environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001` (or auto-assigned)
  - [ ] Database credentials (PostgreSQL)
  - [ ] `MONGODB_URI`
  - [ ] Redis credentials
  - [ ] `JWT_ACCESS_SECRET` (32+ chars)
  - [ ] `JWT_REFRESH_SECRET` (32+ chars)
  - [ ] `CORS_ORIGIN` (will update after frontend deploy)
- [ ] Backend deployed successfully
- [ ] Backend URL obtained (e.g., `https://xxx.up.railway.app`)
- [ ] Swagger docs accessible (`/api/docs`)
- [ ] Health endpoint working (`/health`)

## Frontend Deployment

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Root directory set correctly (`frontend` or root)
- [ ] Environment variable added:
  - [ ] `NEXT_PUBLIC_API_URL` = backend URL
- [ ] Frontend deployed successfully
- [ ] Frontend URL obtained (e.g., `https://xxx.vercel.app`)

## Post-Deployment

- [ ] Backend `CORS_ORIGIN` updated to frontend URL
- [ ] Backend redeployed (if needed)
- [ ] Admin user created
- [ ] Test login functionality
- [ ] Test API calls from frontend
- [ ] Test WebSocket connection
- [ ] Verify real-time updates work
- [ ] Check browser console for errors
- [ ] Test on mobile device (responsive)

## Security Checklist

- [ ] JWT secrets are strong (32+ characters, random)
- [ ] Database passwords are strong
- [ ] CORS_ORIGIN is specific (not `*`)
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Environment variables not exposed in client code
- [ ] API keys/secrets not in version control

## Performance Checklist

- [ ] Frontend build optimized
- [ ] Images optimized (Next.js Image component)
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Redis caching working

## Monitoring (Optional)

- [ ] Error tracking set up (Sentry, etc.)
- [ ] Analytics configured
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Log aggregation (if needed)

## Custom Domain (Optional)

- [ ] Domain purchased
- [ ] DNS configured for Vercel
- [ ] SSL certificate active (automatic)
- [ ] Backend custom domain configured (if desired)
- [ ] `NEXT_PUBLIC_API_URL` updated if backend domain changed

---

## Quick Commands Reference

### Local Testing
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm run build
npm run start:prod
```

### Check Deployment Status
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Render: https://dashboard.render.com

### View Logs
- Vercel: Project → Deployments → Click deployment → Logs
- Railway: Service → Deployments → View Logs
- Render: Service → Logs tab

---

**Tip:** Bookmark this checklist and check off items as you complete them!

