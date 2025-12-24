# Admin User Setup Guide

This guide explains how to create your first admin user in TaskFlow. Since admin users are required to access the admin dashboard and manage other users, you need to bootstrap an admin user when setting up the application.

## Methods to Create an Admin User

There are three ways to create an admin user:

### Method 1: Using the Bootstrap Script (Recommended)

The easiest way is to use the provided bootstrap script.

#### Prerequisites
- Database is running and accessible
- Environment variables are set (or defaults will be used)

#### Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the script:**
   ```bash
   npm run create-admin
   ```

3. **Follow the prompts:**
   - Enter admin email
   - Enter admin password (must be at least 8 characters)
   - Enter first name (optional)
   - Enter last name (optional)

The script will:
- Connect to your database
- Check if the user already exists
- Create a new admin user or update existing user to admin role
- Hash the password securely using bcrypt

#### Example:
```bash
$ npm run create-admin

=== Create Admin User ===

Enter admin email: admin@taskflow.com
Enter admin password: SecurePass123!
Enter first name (optional): Admin
Enter last name (optional): User

📡 Connecting to database...
✅ Connected to database

🔐 Hashing password...
👤 Creating admin user...
✅ Admin user created successfully!

📧 Email: admin@taskflow.com
🔑 Role: admin

✅ Done!
```

---

### Method 2: Direct Database Update (SQL)

If you already have a user account and want to make it an admin, you can update the database directly.

#### Steps

1. **Connect to your PostgreSQL database:**
   ```bash
   psql -h localhost -U postgres -d taskflow
   ```

2. **Find the user's ID:**
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```

3. **Update the user's role:**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

4. **Verify the update:**
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```

#### Example:
```sql
taskflow=# SELECT id, email, role FROM users;
                  id                  |        email         | role
--------------------------------------+----------------------+-------
 123e4567-e89b-12d3-a456-426614174000 | user@example.com    | user

taskflow=# UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
UPDATE 1

taskflow=# SELECT id, email, role FROM users WHERE email = 'user@example.com';
                  id                  |        email         | role
--------------------------------------+----------------------+-------
 123e4567-e89b-12d3-a456-426614174000 | user@example.com    | admin
```

---

### Method 3: Register with Admin Role (API)

**⚠️ Security Warning:** This method allows anyone to register as admin. Only use this in development or if you secure the registration endpoint.

The registration API accepts a `role` field. You can register a new user with admin role:

#### Steps

1. **Make a POST request to the registration endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@taskflow.com",
       "password": "SecurePass123!",
       "role": "admin",
       "profile": {
         "firstName": "Admin",
         "lastName": "User"
       }
     }'
   ```

2. **Or using the frontend:**
   - Go to the registration page
   - Fill in the form
   - Use browser developer tools to modify the request payload and add `"role": "admin"`

**Note:** In production, you should restrict the registration endpoint to prevent unauthorized admin creation.

---

## After Creating an Admin User

Once you have an admin user:

1. **Log in** with the admin credentials
2. **Access the admin dashboard** at `/admin`
3. **Manage other users** - You can now:
   - View all users
   - Change user roles
   - Activate/deactivate users
   - View system statistics

## Troubleshooting

### Script fails to connect to database
- Check that your database is running
- Verify environment variables are set correctly
- Check database credentials in `.env` file

### User already exists
- The script will ask if you want to update the existing user to admin
- Or use Method 2 (SQL) to update the role directly

### Password requirements
- Password must be at least 8 characters
- Should contain uppercase, lowercase, numbers, and special characters for security

### Cannot access admin page after creating admin
- Make sure you're logged in with the admin account
- Check that the user's role is actually `admin` in the database
- Clear browser cache and cookies
- Log out and log back in to refresh your JWT token

## Security Best Practices

1. **Change default admin password** immediately after first login
2. **Use strong passwords** (at least 12 characters, mixed case, numbers, symbols)
3. **Limit admin accounts** - Only create admin users when necessary
4. **Monitor admin activity** - Check the event logs regularly
5. **Use Method 1 or 2** in production (not Method 3)

## Related Documentation

- [RBAC Documentation](./RBAC.md) - Learn about role-based access control
- [API Documentation](./API.md) - API endpoints for user management
- [Architecture Documentation](./ARCHITECTURE.md) - System architecture overview


