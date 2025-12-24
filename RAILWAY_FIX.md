# Quick Fix for Railway Build Detection Issue

## Problem
Railway shows error: "Railpack could not determine how to build the app" or "Script start.sh not found"

## ⚠️ CRITICAL: Root Directory Must Be Set!

**90% of Railway build failures are caused by Root Directory not being set correctly!**

### Step 1: Set Root Directory in Railway (DO THIS FIRST!)

**This is the #1 fix - do this before anything else!**

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Click on your project (e.g., "miraculous-dream" or "splendid-rejoicing")
3. Click on the **"TaskFlow"** service
4. Click the **"Settings"** tab (at the top)
5. Scroll down to find **"Root Directory"** section
6. **Current value might be:** Empty, `/`, or something else
7. **Change it to exactly:** `backend` (no slash, no quotes, just the word `backend`)
8. Click **"Save"** button
9. Railway will automatically trigger a new deployment

**Visual Guide:**
```
Railway Dashboard → Your Project → TaskFlow Service → Settings Tab

┌─────────────────────────────────────┐
│ Root Directory                      │
│ ┌─────────────────────────────────┐ │
│ │ backend                         │ │  ← Type exactly "backend"
│ └─────────────────────────────────┘ │
│                                     │
│ [Save]                              │  ← Click Save
└─────────────────────────────────────┘
```

**Why This Matters:**
- Without Root Directory = `backend`, Railway looks at your repo root
- Railway can't find `backend/package.json` 
- Railway can't detect it's a Node.js project
- Build fails immediately

### Step 2: Commit and Push Configuration Files

Make sure these files are committed and pushed to GitHub:

```bash
# Check status
git status

# Add Railway config files
git add backend/.nvmrc 
git add backend/nixpacks.toml 
git add backend/Procfile
git add backend/start.sh

# Commit
git commit -m "Add Railway configuration files"

# Push to GitHub
git push origin main
```

Railway will automatically detect the push and redeploy.

### Step 3: Manually Set Build Commands (If Still Failing)

If Railway still can't detect after setting root directory:

1. Go to Railway → Your Service → **"Settings"** → **"Deploy"** tab
2. Find **"Build Command"** field
3. Set it to: `npm install && npm run build`
4. Find **"Start Command"** field  
5. Set it to: `npm run start:prod`
6. Click **"Save"**
7. Railway will redeploy automatically

### Step 4: Verify Files Exist

Check that Railway can see these files in the `backend` folder:
- ✅ `package.json` (must exist)
- ✅ `.nvmrc` (contains `18`)
- ✅ `nixpacks.toml` (build configuration)
- ✅ `Procfile` (fallback start command)

### Step 5: Check Deployment Logs

After redeploying, check the build logs:
- Should see: `Installing dependencies...`
- Should see: `Building application...`
- Should see: `Starting application...`

## Why This Happens

Railway's Railpack (Nixpacks) needs to:
1. Find `package.json` in the root directory you specify
2. Detect Node.js project structure
3. Know how to build and start the app

If Root Directory isn't set to `backend`, Railway looks at the repo root and can't find `package.json`.

## Alternative: Use Dockerfile

If Nixpacks still doesn't work, Railway will automatically use your `Dockerfile` if it exists in the `backend` folder (which it does). Make sure Root Directory is set to `backend` so Railway can find it.

## Still Having Issues?

1. **Check Railway Status:** https://status.railway.app
2. **Verify GitHub Connection:** Railway → Settings → GitHub (ensure repo is connected)
3. **Check Build Logs:** Look for specific error messages
4. **Try Manual Redeploy:** Deployments tab → Click "Redeploy"

