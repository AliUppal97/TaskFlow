# Verify User Roles Guide

This guide explains how to verify user roles, troubleshoot role-related issues, and ensure users can only see their own profile data.

## Quick Verification

### Method 1: Using the Verification Script (Recommended)

Check a user's role directly from the database:

```bash
cd backend
npm run verify-role -- --email user@example.com
```

**Example Output:**
```
=== Verify User Role ===

📡 Connecting to database...
✅ Connected to database

📋 User Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Email:     user@example.com
  ID:        123e4567-e89b-12d3-a456-426614174000
  Role:      USER
  Active:    Yes
  Name:      John Doe
  Created:   12/22/2024, 10:30:00 AM
  Updated:   12/22/2024, 2:15:00 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  This user does NOT have admin role.
   Current role: user
   They cannot access the admin dashboard.

   To make this user an admin, run:
   npm run create-admin -- --email user@example.com --password <password> --update

✅ Done!
```

### Method 2: Direct SQL Query

Connect to PostgreSQL and run:

```sql
SELECT id, email, role, "isActive", profile, "createdAt", "updatedAt" 
FROM users 
WHERE email = 'user@example.com';
```

### Method 3: Check via API (If You're Already Logged In)

If you're logged in as an admin, you can check via the API:

```bash
# List all users
curl -X GET http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer <admin_token>"

# Or check specific user by filtering
curl -X GET "http://localhost:3001/api/v1/users?role=admin" \
  -H "Authorization: Bearer <admin_token>"
```

---

## Common Issues and Solutions

### Issue 1: User Shows Wrong Role in Profile Page

**Symptoms:**
- Profile page shows "USER" but user should be admin
- User cannot access admin dashboard

**Causes:**
1. **Stale JWT Token**: The JWT token contains role at login time. If role was changed after login, token still has old role.
2. **Database Role Not Updated**: The role in database is actually still "user"
3. **Frontend Cache**: Frontend is showing cached user data

**Solutions:**

**Step 1: Verify Database Role**
```bash
npm run verify-role -- --email user@example.com
```

**Step 2: If Database Shows Wrong Role**
```bash
# Update the role in database
npm run create-admin -- --email user@example.com --password <password> --update
```

**Step 3: Refresh User Session**
- **Log out** and **log back in** to get a new JWT token with updated role
- Or refresh the profile page (it fetches fresh data from database)

**Step 4: Clear Browser Cache** (if still showing wrong data)
- Clear localStorage: `localStorage.removeItem('accessToken')`
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

### Issue 2: User Cannot Access Admin Page

**Checklist:**

1. ✅ **Verify Role in Database**
   ```bash
   npm run verify-role -- --email user@example.com
   ```
   Should show `Role: ADMIN`

2. ✅ **Check if User is Active**
   ```bash
   npm run verify-role -- --email user@example.com
   ```
   Should show `Active: Yes`

3. ✅ **Log Out and Log Back In**
   - The JWT token needs to be refreshed to include the new role
   - After role change, user MUST log out and log back in

4. ✅ **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Check Network tab to see if API calls are failing

5. ✅ **Verify Admin Route Protection**
   - Admin page uses `RoleProtectedRoute` component
   - It checks `user.role === UserRole.ADMIN`
   - Make sure the user object has the correct role

---

### Issue 3: User Sees Wrong Profile Data

**Security Note:** The profile endpoint (`GET /auth/profile`) uses `req.user.id` from the JWT token, so users can ONLY see their own profile. This is enforced at the backend level.

**If user sees wrong data:**

1. **Check if Multiple Accounts Exist**
   ```bash
   # Check all users with same email pattern
   npm run verify-role -- --email user@example.com
   ```

2. **Verify You're Logged In as Correct User**
   - Check the email in the profile page
   - It should match the email you used to log in

3. **Clear Session and Re-login**
   - Log out completely
   - Log in again with correct credentials
   - Profile should show correct data

---

## How Profile Data Works

### Backend Security

The profile endpoint is secure:

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req: RequestWithUser): Promise<UserProfileDto> {
  // Uses req.user.id from JWT token - user can ONLY see their own profile
  const user = await this.userService.findById(req.user.id);
  return userProfile;
}
```

**Key Points:**
- ✅ Uses `req.user.id` from JWT token (cannot be faked)
- ✅ Users can ONLY access their own profile
- ✅ Always fetches fresh data from database
- ✅ Role is always current (not from JWT, but from database)

### Frontend Behavior

- Profile page uses `useAuth()` hook which fetches from `/auth/profile`
- Data is cached for 5 minutes (staleTime)
- After profile update, cache is refreshed automatically
- User data comes from backend, not from JWT token payload

---

## Step-by-Step: Making a User Admin

### Complete Process

1. **Verify Current Role**
   ```bash
   npm run verify-role -- --email user@example.com
   ```

2. **Update Role in Database**
   ```bash
   npm run create-admin -- --email user@example.com --password TheirPassword123! --update
   ```

3. **Verify Role Was Updated**
   ```bash
   npm run verify-role -- --email user@example.com
   ```
   Should now show `Role: ADMIN`

4. **User Must Log Out and Log Back In**
   - Important: JWT token contains role at login time
   - After role change, user needs new token with updated role
   - Backend always checks database, but frontend needs fresh token

5. **Verify Admin Access**
   - User should now be able to access `/admin` page
   - Profile page should show "ADMIN" badge

---

## Troubleshooting Checklist

Use this checklist when troubleshooting role issues:

- [ ] Database role is correct (use `npm run verify-role`)
- [ ] User account is active (`isActive: true`)
- [ ] User has logged out and logged back in after role change
- [ ] Browser cache/localStorage cleared
- [ ] No errors in browser console
- [ ] Backend is running and accessible
- [ ] Database connection is working
- [ ] JWT token is valid (not expired)

---

## Important Notes

### JWT Token and Role Changes

⚠️ **Critical:** When a user's role is changed in the database:

1. **Backend**: Always checks database for role (not JWT)
   - `JwtPermissionsGuard` loads user from database
   - Role checks use database role, not JWT role

2. **Frontend**: Uses JWT token initially, but refreshes from API
   - Profile page fetches from `/auth/profile` (gets fresh data)
   - Admin route checks `user.role` from auth context
   - Auth context refreshes profile on login

3. **Solution**: User must log out and log back in
   - This generates a new JWT token with updated role
   - Frontend gets fresh user data from backend

### Profile Data Privacy

✅ **Users can ONLY see their own profile:**
- Profile endpoint uses `req.user.id` from JWT
- Cannot be manipulated or faked
- Enforced at backend level
- No way for users to see other users' profiles via this endpoint

---

## Related Commands

```bash
# Create admin user
npm run create-admin -- --email admin@example.com --password SecurePass123!

# Verify user role
npm run verify-role -- --email user@example.com

# Update existing user to admin
npm run create-admin -- --email user@example.com --password TheirPassword123! --update
```

---

## Still Having Issues?

1. Check backend logs for errors
2. Verify database connection
3. Check if user exists in database
4. Verify JWT token is valid
5. Ensure user logged out/in after role change
6. Check browser console for frontend errors

For more help, see:
- [Admin Setup Guide](./ADMIN_SETUP.md)
- [RBAC Documentation](./RBAC.md)
- [API Documentation](./API.md)

