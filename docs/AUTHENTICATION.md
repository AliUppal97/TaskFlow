# JWT Authentication System Documentation

## Overview

The TaskFlow application implements a secure JWT-based authentication system with the following key features:

- **Dual Token Strategy**: Access tokens (short-lived) + Refresh tokens (long-lived)
- **Token Revocation**: Ability to blacklist/revoke tokens for security
- **HttpOnly Cookies**: Refresh tokens stored securely in HttpOnly cookies
- **Automatic Token Refresh**: Seamless token renewal on the frontend
- **Role-Based Access Control**: Support for different user roles
- **Security Audit Logging**: Comprehensive event logging for compliance

## Architecture

### Backend Components

#### 1. Authentication Service (`AuthService`)
- Handles user registration, login, logout, and token management
- Manages token blacklisting for security
- Integrates with Redis for token storage and caching
- Logs authentication events for audit trails

#### 2. JWT Strategies
- **JwtStrategy**: Validates access tokens from Authorization headers
- **JwtRefreshStrategy**: Validates refresh tokens from HttpOnly cookies

#### 3. Guards
- **JwtAuthGuard**: Protects routes requiring authentication, validates access tokens
- **JwtRefreshGuard**: Protects token refresh endpoints

#### 4. User Service (`UserService`)
- Manages user accounts and profiles
- Handles password hashing with bcrypt (12 salt rounds)
- Manages refresh token storage in Redis

### Frontend Components

#### 1. API Client (`apiClient`)
- Centralized HTTP client with automatic JWT token injection
- Handles token refresh on 401 errors
- Manages token storage (localStorage for access tokens, HttpOnly cookies for refresh tokens)

#### 2. React Query Hooks
- `useLogin`, `useRegister`, `useLogout`: Authentication operations
- `useProfile`: User profile management
- Automatic cache invalidation on authentication state changes

## Token Flow

### 1. User Registration
```typescript
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "USER"
}
```

### 2. User Login
```typescript
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Security Notes:**
- Access token returned in response body
- Refresh token set as HttpOnly cookie automatically
- Refresh token stored in Redis with unique ID for revocation
- Account lockout after 5 failed attempts (30-minute lockout)
- Failed login attempts are tracked and reset on successful login

### 3. Token Refresh
```typescript
POST /api/v1/auth/refresh
// Refresh token sent automatically via HttpOnly cookie
```

### 4. Logout
```typescript
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Security Actions:**
- Current access token blacklisted for remaining lifetime
- Refresh token removed from Redis
- Refresh token cookie cleared

### 5. Protected Route Access
```typescript
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

**Validation Steps:**
1. Extract Bearer token from Authorization header
2. Verify JWT signature and expiration
3. Check if token is blacklisted
4. Attach user payload to request

## Security Features

### 1. Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Constant-time comparison to prevent timing attacks
- **No Enumeration**: Same error message for invalid email/password
- **Complexity Requirements**: Must contain uppercase, lowercase, numbers, and special characters
- **Minimum Length**: 8 characters minimum

### 2. Account Security
- **Account Lockout**: 5 failed login attempts result in 30-minute lockout
- **Account Deactivation**: Administrators can deactivate user accounts
- **Failed Attempt Tracking**: Failed login attempts are tracked and reset on successful login

### 3. Session Management
- **Automatic Refresh**: Frontend intercepts 401 errors and refreshes tokens
- **Concurrent Sessions**: Multiple sessions supported with individual refresh tokens
- **Session Invalidation**: Logout invalidates all user tokens

### 4. Security Headers
- **Helmet**: Comprehensive security headers (CSP, X-Frame-Options, etc.)
- **Content Security Policy**: Prevents XSS attacks by controlling resource loading
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing

## Configuration

### Environment Variables
```bash
# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Security Configuration

#### Password Policy
- **Minimum Length**: 8 characters
- **Complexity Requirements**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&)
- **Hashing**: bcrypt with 12 salt rounds

#### Account Lockout Policy
- **Failed Attempts Threshold**: 5 attempts
- **Lockout Duration**: 30 minutes
- **Reset on Success**: Failed attempts reset to 0 on successful login

#### Token Expiration Strategy
- **Access Tokens**: Short-lived (15 minutes) for security
- **Refresh Tokens**: Long-lived (7 days) for user convenience
- **Blacklist TTL**: Matches token expiration time

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | Refresh Token (Cookie) |
| POST | `/auth/logout` | User logout | Access Token |
| GET | `/auth/profile` | Get user profile | Access Token |

### Request/Response Examples

#### Registration
```typescript
// Request
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "USER",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}

// Response
{
  "id": "uuid-string",
  "email": "john.doe@example.com",
  "role": "USER",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "createdAt": "2023-12-23T...",
  "updatedAt": "2023-12-23T..."
}
```

#### Login
```typescript
// Request
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}

// Response (access token only, refresh token in HttpOnly cookie)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

#### Profile
```typescript
// Request
GET /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Response
{
  "id": "uuid-string",
  "email": "john.doe@example.com",
  "role": "USER",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "createdAt": "2023-12-23T...",
  "updatedAt": "2023-12-23T..."
}
```

## Frontend Integration

### Login Flow
```typescript
const loginMutation = useLogin({
  onSuccess: (data) => {
    // Access token stored in localStorage automatically
    // Refresh token stored in HttpOnly cookie by backend
    navigate('/dashboard');
  }
});
```

### Automatic Token Refresh
```typescript
// Handled automatically by API client interceptors
// On 401 error: attempt refresh, retry original request
// On refresh failure: redirect to login
```

### Logout Flow
```typescript
const logoutMutation = useLogout({
  onSuccess: () => {
    // Tokens cleared automatically
    // User redirected to login
    navigate('/login');
  }
});
```

## Security Best Practices

### 1. Token Storage
- **Access Tokens**: localStorage (acceptable for SPAs)
- **Refresh Tokens**: HttpOnly cookies (prevents XSS attacks)

### 2. CORS Configuration
```typescript
// Backend CORS settings
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Required for HttpOnly cookies
}
```

### 3. Error Handling
- **Generic Messages**: Don't reveal whether email exists during login
- **Token Expiration**: Clear tokens and redirect on invalid tokens
- **Network Errors**: Graceful fallback with user notification

### 4. Monitoring
- **Event Logging**: All authentication events logged
- **Token Blacklisting**: Track revoked tokens
- **Failed Attempts**: Monitor for brute force attacks

## Troubleshooting

### Common Issues

#### 1. "Invalid token" Errors
- Check if access token is expired (15-minute limit)
- Verify token wasn't blacklisted during logout
- Ensure correct Authorization header format: `Bearer <token>`

#### 2. Refresh Token Issues
- Check if refresh token cookie exists
- Verify Redis connection for token storage
- Check token expiration (7-day limit)

#### 3. CORS Errors
- Ensure `credentials: true` in frontend requests
- Verify CORS origin configuration matches frontend URL
- Check if HttpOnly cookies are being sent

#### 4. Build Errors
- Ensure all environment variables are set
- Check Redis connection in development
- Verify JWT secrets are strong random strings

### Debug Mode
Enable debug logging in development:
```bash
NEXT_PUBLIC_DEBUG_API=true
```

This will log API request/response details for troubleshooting.

## Future Enhancements

### Potential Security Improvements
1. **Rate Limiting**: Implement rate limiting for auth endpoints
2. **Two-Factor Authentication**: Add TOTP/SMS verification
3. **Device Tracking**: Track and manage user devices/sessions
4. **Password Policies**: Enforce strong password requirements
5. **Account Lockout**: Temporary lockout after failed attempts

### Scalability Considerations
1. **Token Distribution**: Consider JWT token distribution for microservices
2. **Session Stores**: Evaluate Redis cluster for high availability
3. **Audit Storage**: Implement log aggregation for large-scale deployments

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HttpOnly Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies)
