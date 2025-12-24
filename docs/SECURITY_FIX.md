# Security Fix: JWT Authentication Guard

## Issue

The `JwtAuthGuard` was setting `request.user = payload` (JWT payload object) instead of loading the full `User` entity from the database. This caused:

1. **Wrong User Data**: Profile endpoint returned wrong user's data
2. **Security Risk**: Users could potentially see other users' profiles
3. **Stale Role Data**: Role changes wouldn't be reflected until re-login

## Root Cause

The `JwtAuthGuard.canActivate()` method was:
- Verifying the JWT token ✅
- Setting `request.user = payload` ❌ (just the JWT payload, not User entity)
- The payload has `sub` (user ID), but `req.user.id` was undefined
- Profile endpoint uses `req.user.id`, causing wrong user lookup

## Fix

Updated `JwtAuthGuard` to:
1. Verify JWT token signature and expiration
2. Check if token is blacklisted
3. **Load full User entity from database using `payload.sub`**
4. Check if user account is active
5. Attach full `User` entity to `request.user`

### Changes Made

**File: `backend/src/guards/jwt-auth.guard.ts`**
- Added `UserService` injection
- Load user from database: `const user = await this.userService.findById(payload.sub)`
- Check if user exists and is active
- Set `request.user = user` (full User entity, not just payload)

**File: `backend/src/modules/auth/auth.module.ts`**
- Added `JwtAuthGuard` to providers so it can inject `UserService`

## Benefits

✅ **Security**: Users can only see their own profile (enforced by database lookup)  
✅ **Fresh Data**: Always gets latest user data from database (role, isActive, etc.)  
✅ **Correct User**: Uses user ID from token to load correct user from database  
✅ **Account Status**: Checks if account is active before allowing access  

## Testing

After this fix:

1. **Verify Profile Returns Correct User**
   ```bash
   curl 'http://localhost:3001/api/v1/auth/profile' \
     -H 'Authorization: Bearer <your-token>'
   ```
   Should return the user that matches the token's `sub` field.

2. **Verify Role Changes Are Immediate**
   - Change user role in database
   - Make API call (don't need to re-login)
   - Should see updated role immediately

3. **Verify Deactivated Accounts Are Blocked**
   - Deactivate a user account
   - Try to access profile
   - Should get "Account is deactivated" error

## Related Files

- `backend/src/guards/jwt-auth.guard.ts` - Fixed guard
- `backend/src/modules/auth/auth.module.ts` - Added guard to providers
- `backend/src/modules/auth/auth.controller.ts` - Uses the guard
- `backend/src/common/interfaces/request-with-user.interface.ts` - Type definition

## Migration Notes

No database migration needed. This is a code fix only.

**Action Required:**
- Restart the backend server for changes to take effect
- Users don't need to re-login (existing tokens will work, but will now load correct user)


