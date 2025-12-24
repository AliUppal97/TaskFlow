# Railway Deployment Checklist - Fix Build Detection

## ✅ Files Created (All Present)
- [x] `backend/package.json` - Node.js project definition
- [x] `backend/.nvmrc` - Node.js version (18)
- [x] `backend/nixpacks.toml` - Railway build configuration
- [x] `backend/Procfile` - Start command fallback
- [x] `backend/start.sh` - Start script
- [x] `backend/Dockerfile` - Docker build (fallback)

## 🔴 CRITICAL: Railway Dashboard Settings

### Step 1: Verify Root Directory (MOST IMPORTANT!)

**This is the #1 cause of build detection failures!**

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click on your project → Click on "TaskFlow" service
3. Click **"Settings"** tab
4. Scroll down to **"Root Directory"** section
5. **MUST BE SET TO:** `backend` (exactly, no slash, no quotes)
6. If it's empty or set to `/` or anything else, change it to `backend`
7. Click **"Save"** (Railway will auto-redeploy)

**Visual Check:**
```
Root Directory: [backend]  ← Should say exactly "backend"
```

### Step 2: Verify Build Commands

1. Still in **"Settings"** → **"Deploy"** tab
2. Check **"Build Command"** field:
   - Should be: `npm install && npm run build`
   - Or leave empty (Railway will use nixpacks.toml)
3. Check **"Start Command"** field:
   - Should be: `npm run start:prod`
   - Or leave empty (Railway will use Procfile/start.sh)

**If fields are empty, that's OK** - Railway will use nixpacks.toml, Procfile, or start.sh

### Step 3: Verify GitHub Connection

1. Go to **"Settings"** → **"GitHub"** tab
2. Verify your repository is connected
3. Verify the branch is correct (usually `main` or `master`)

### Step 4: Commit and Push All Files

Make sure all configuration files are pushed to GitHub:

```bash
# Check what files need to be committed
git status

# Add all Railway config files
git add backend/.nvmrc
git add backend/nixpacks.toml
git add backend/Procfile
git add backend/start.sh

# Commit
git commit -m "Add Railway configuration files"

# Push to GitHub
git push origin main
```

### Step 5: Trigger Redeploy

After pushing to GitHub:

1. Railway should auto-detect the push and redeploy
2. If not, go to **"Deployments"** tab
3. Click **"Redeploy"** button
4. Watch the build logs

## 🔍 What Railway Should See

When Railway looks at your `backend` directory, it should find:

```
backend/
├── package.json      ← Railway detects: "This is a Node.js project!"
├── nixpacks.toml     ← Railway reads: "Build with npm install && npm run build"
├── Procfile          ← Railway reads: "Start with npm run start:prod"
├── start.sh          ← Fallback start script
└── .nvmrc            ← Railway reads: "Use Node.js 18"
```

## 🐛 Troubleshooting

### Error: "Railpack could not determine how to build the app"

**Cause:** Railway can't find `package.json` in the directory it's looking at.

**Solution:**
1. ✅ **Set Root Directory to `backend`** (Step 1 above)
2. ✅ Verify `backend/package.json` exists in your GitHub repo
3. ✅ Push all files to GitHub
4. ✅ Redeploy

### Error: "Script start.sh not found"

**Cause:** Railway is looking for start.sh but can't find it (wrong directory).

**Solution:**
1. ✅ Set Root Directory to `backend` (so Railway finds `backend/start.sh`)
2. ✅ Verify `backend/start.sh` exists and is committed
3. ✅ Push to GitHub

### Build Starts But Fails Later

**Different issue** - Railway detected your app but build failed. Check build logs for:
- Missing dependencies
- TypeScript errors
- Missing environment variables

## ✅ Success Indicators

When Railway successfully detects your app, you'll see in build logs:

```
✓ Detected Node.js project
✓ Installing dependencies...
✓ Building application...
✓ Starting application...
```

## 📝 Quick Reference

**Railway Dashboard URLs:**
- Settings: `https://railway.app/project/[project-id]/service/[service-id]/settings`
- Deployments: `https://railway.app/project/[project-id]/service/[service-id]/deployments`

**Key Settings:**
- Root Directory: `backend`
- Build Command: `npm install && npm run build` (or leave empty)
- Start Command: `npm run start:prod` (or leave empty)

## 🆘 Still Not Working?

1. **Double-check Root Directory** - This fixes 90% of issues
2. **Check Railway Status:** https://status.railway.app
3. **View Build Logs** - Look for specific error messages
4. **Try Manual Build Commands** - Set them explicitly in Railway settings
5. **Use Dockerfile** - Railway will use Dockerfile if Nixpacks fails (you have one!)

---

**Remember:** The Root Directory setting is the most critical step. Without it set to `backend`, Railway will never find your `package.json` file!

