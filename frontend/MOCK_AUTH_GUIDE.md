# Mock Authentication Guide

This guide explains how to access protected pages in the frontend without running the backend server.

## Quick Start

### Method 1: Browser Console (Easiest)

1. Open your browser's developer console (F12)
2. Run this command:
   ```javascript
   window.mockAuth.enable()
   ```
3. The page will reload and you'll be automatically logged in as a mock user

### Method 2: Environment Variable

Add this to your `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_MOCK_AUTH=true
```

Then restart your Next.js development server.

### Method 3: Auto-Enable on Backend Failure

If you want mock auth to automatically enable when the backend is unavailable:

1. Open browser console
2. Run:
   ```javascript
   window.mockAuth.enableAuto()
   ```
3. Now if the backend is not running, mock auth will automatically activate

## Mock User Details

When mock authentication is enabled, you'll be logged in as:
- **Email**: `dev@taskflow.com`
- **Name**: Dev User
- **Role**: User

## Disabling Mock Auth

To disable mock authentication:

1. Open browser console
2. Run:
   ```javascript
   window.mockAuth.disable()
   ```

Or remove `NEXT_PUBLIC_MOCK_AUTH=true` from your `.env.local` file and restart the server.

## Available Console Commands

All commands are available via `window.mockAuth`:

- `window.mockAuth.enable()` - Enable mock auth
- `window.mockAuth.disable()` - Disable mock auth
- `window.mockAuth.isEnabled()` - Check if mock auth is enabled
- `window.mockAuth.enableAuto()` - Auto-enable when backend fails
- `window.mockAuth.disableAuto()` - Disable auto-enable feature

## How It Works

When mock authentication is enabled:
- The auth provider skips API calls to the backend
- A mock user is automatically created and set as authenticated
- All protected routes become accessible
- Login/Register forms will automatically succeed in mock mode

## Notes

- Mock auth only works in development mode
- API calls to fetch tasks, etc. will still fail if the backend is not running
- This is intended for frontend-only development and UI testing
- Mock auth state is stored in localStorage and persists across page reloads






