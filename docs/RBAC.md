# Role-Based Access Control (RBAC) Documentation

## Overview

TaskFlow implements a comprehensive Role-Based Access Control (RBAC) system that ensures users can only access resources and perform actions appropriate to their role and permissions. The system uses a multi-layered approach combining authentication, authorization, and fine-grained permissions.

## Architecture

### Backend Architecture

The RBAC system consists of several key components:

1. **Guards**: NestJS guards that intercept requests and enforce access control
2. **Decorators**: TypeScript decorators that declare required permissions and roles
3. **Policies**: Resource-level authorization rules for complex business logic
4. **Permissions**: Granular permissions mapped to roles

### Frontend Architecture

The frontend implements client-side RBAC through:

1. **Protected Route Components**: React components that restrict access to entire pages
2. **Conditional Rendering**: UI elements shown/hidden based on user permissions
3. **API Integration**: Frontend respects backend authorization responses

## User Roles

TaskFlow defines two primary user roles:

### Admin (`admin`)
- Full system access and administrative privileges
- Can manage users, roles, and system settings
- Can view and manage all tasks regardless of ownership
- Has access to administrative dashboard and user management tools

### User (`user`)
- Standard user with task management capabilities
- Can create, read, update, and delete their own tasks
- Can be assigned to tasks by creators or admins
- Limited to their own profile and assigned tasks

## Permissions System

### Permission Definitions

The system defines the following permissions:

#### Task Permissions
- `task:create` - Create new tasks
- `task:read` - View tasks
- `task:update` - Modify existing tasks
- `task:delete` - Delete tasks
- `task:assign` - Assign tasks to other users

#### User Management Permissions
- `user:read` - View user information
- `user:update` - Update user profiles and status
- `user:delete` - Delete user accounts
- `user:manage_roles` - Change user roles

#### Administrative Permissions
- `admin:access` - Access administrative features
- `system:config` - Configure system settings

### Role-Permission Mapping

```typescript
const ROLE_PERMISSIONS = {
  [UserRole.USER]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
  ],
  [UserRole.ADMIN]: [
    // All user permissions plus admin permissions
    ...USER_PERMISSIONS,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
    Permission.ADMIN_ACCESS,
    Permission.SYSTEM_CONFIG,
  ],
};
```

## Backend Implementation

### Guards

#### JwtPermissionsGuard
- **Purpose**: Authenticates users and checks permissions
- **Usage**: Applied to routes requiring both authentication and permission checks
- **Implementation**: Combines JWT validation with permission verification

#### RolesGuard
- **Purpose**: Validates user roles for route access
- **Usage**: `@Roles(UserRole.ADMIN)` decorator on controllers/methods
- **Implementation**: Checks if user has one of the required roles

#### PolicyGuard
- **Purpose**: Resource-level authorization for complex business rules
- **Usage**: `@UsePolicy()` decorator with custom policy classes
- **Implementation**: Delegates to policy classes for fine-grained access control

### Decorators

#### @RequirePermissions
```typescript
@RequirePermissions(Permission.TASK_CREATE, Permission.TASK_READ)
@Post()
async createTask(@Body() data: CreateTaskDto) {
  // Only users with TASK_CREATE and TASK_READ permissions can access
}
```

#### @Roles
```typescript
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  // Only admin users can access any route in this controller
}
```

#### @UsePolicy
```typescript
@UsePolicy({
  policyName: 'task',
  action: 'update',
  resourceType: 'task',
  getResource: (req) => ({ id: req.params.id }),
})
@Patch(':id')
async updateTask(@Param('id') id: string) {
  // Policy-based authorization for task updates
}
```

### Policies

Policies implement fine-grained authorization rules:

#### TaskPolicy

| Action | Creator | Assignee | Admin | Guest |
|--------|---------|----------|-------|-------|
| create | ✅ Any authenticated user | - | - | ❌ |
| read | ✅ | ✅ | ✅ | ❌ |
| update | ✅ | ✅ | ✅ | ❌ |
| delete | ✅ | ❌ | ✅ | ❌ |
| assign | ✅ | ✅ | ✅ | ❌ |

**Rationale:**
- **Create**: Any authenticated user can create tasks
- **Read**: Users can see tasks they created or are assigned to
- **Update**: Creators and assignees can modify tasks (collaboration)
- **Delete**: Only creators can delete (prevents accidental deletion by assignees)
- **Assign**: Creators, assignees, and admins can reassign tasks

## Frontend Implementation

### Protected Route Components

#### ProtectedRoute
```tsx
<ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
  <AdminDashboard />
</ProtectedRoute>
```

#### RoleProtectedRoute
```tsx
<RoleProtectedRoute allowedRoles={[UserRole.ADMIN]} redirectTo="/dashboard">
  <AdminPanel />
</RoleProtectedRoute>
```

### Permission-Based UI Rendering

Components check user permissions before rendering action buttons:

```tsx
const canEdit = task.creatorId === currentUserId || task.assigneeId === currentUserId;
const canDelete = task.creatorId === currentUserId;
const canAssign = canEdit;

// Only show edit button if user can edit
{canEdit && (
  <Button onClick={() => onEdit(task)}>Edit</Button>
)}

// Only show delete button if user can delete
{canDelete && (
  <Button onClick={() => onDelete(task.id)}>Delete</Button>
)}
```

## API Endpoints

### Authentication Endpoints (Public)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile (authenticated)

### User Management Endpoints (Admin Only)
- `GET /users` - List all users (admin)
- `PATCH /users/:id/role` - Update user role (admin with USER_MANAGE_ROLES)
- `PATCH /users/:id/status` - Update user status (admin with USER_UPDATE)

### Task Endpoints
- `GET /tasks` - List tasks (authenticated users)
- `POST /tasks` - Create task (TASK_CREATE permission)
- `GET /tasks/:id` - Get task details (policy-based)
- `PATCH /tasks/:id` - Update task (policy-based + TASK_UPDATE)
- `DELETE /tasks/:id` - Delete task (policy-based + TASK_DELETE)
- `PATCH /tasks/:id/assign` - Assign task (policy-based + TASK_ASSIGN)

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Refresh tokens stored in HttpOnly cookies
- Token blacklisting for logout
- Rate limiting on authentication endpoints

### Authorization
- Defense in depth with multiple guard layers
- Permission checks on both backend and frontend
- Resource ownership validation
- Prevention of privilege escalation

### Audit Trail
- All authorization decisions logged
- Event logging for security monitoring
- User action tracking

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_ACCESS_TOKEN_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Default Role Assignment
- New users are assigned `UserRole.USER` by default
- Admin role must be explicitly assigned by existing admins
- Role changes require `USER_MANAGE_ROLES` permission

## Testing

### Unit Tests
- Guard implementations tested with mock users
- Policy classes tested with various scenarios
- Permission mappings verified

### Integration Tests
- End-to-end authorization flows
- Role-based access control verification
- Permission escalation prevention

### Security Testing
- Authorization bypass attempts
- Privilege escalation scenarios
- Token manipulation tests

## Maintenance

### Adding New Permissions
1. Add permission to `Permission` enum
2. Map permission to appropriate roles in `ROLE_PERMISSIONS`
3. Apply `@RequirePermissions` decorator to routes
4. Update frontend components to respect new permissions

### Adding New Roles
1. Add role to `UserRole` enum
2. Define role permissions in `ROLE_PERMISSIONS`
3. Update UI components to handle new role
4. Test role-based access control

### Modifying Policies
1. Update policy class logic
2. Ensure backward compatibility
3. Update tests
4. Document policy changes

## Troubleshooting

### Common Issues

#### User Cannot Access Expected Features
1. Check user's role assignment
2. Verify role-permission mapping
3. Check guard application on routes
4. Review policy implementation

#### Permission Denied Errors
1. Verify JWT token validity
2. Check permission requirements on endpoint
3. Review user role and permissions
4. Check policy constraints

#### Frontend Showing/Hiding Incorrect Elements
1. Verify permission checks in components
2. Check user object structure
3. Review conditional rendering logic
4. Test with different user roles

## Future Enhancements

### Planned Features
- Organization-based access control
- Time-based permissions
- Approval workflows for sensitive operations
- Granular field-level permissions
- Custom role creation by admins

### Scalability Considerations
- Permission caching for high-performance systems
- Distributed policy evaluation
- Microservices authorization patterns
- Third-party identity provider integration</content>
</xai:function_call">The RBAC documentation has been created.
