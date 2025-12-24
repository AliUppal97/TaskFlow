# TaskFlow Application - Complete Pages List

## Total Pages: **14 Pages**

This document lists all accessible pages/routes in the TaskFlow Next.js application.

---

## Public Pages (No Authentication Required)

### 1. **Home/Landing Page**
- **URL:** `/`
- **File:** `frontend/src/app/page.tsx`
- **Description:** Landing page with features, stats, and call-to-action buttons. Redirects authenticated users to dashboard.

### 2. **Login Page**
- **URL:** `/login`
- **File:** `frontend/src/app/login/page.tsx`
- **Description:** User authentication/login page.

### 3. **Register Page**
- **URL:** `/register`
- **File:** `frontend/src/app/register/page.tsx`
- **Description:** New user registration page.

### 4. **Forgot Password Page**
- **URL:** `/forgot-password`
- **File:** `frontend/src/app/forgot-password/page.tsx`
- **Description:** Password reset request page.

### 5. **Verify Email Page**
- **URL:** `/verify-email`
- **File:** `frontend/src/app/verify-email/page.tsx`
- **Description:** Email verification page for new user accounts.

---

## Protected Pages (Authentication Required)

### 6. **Dashboard Page**
- **URL:** `/dashboard`
- **File:** `frontend/src/app/dashboard/page.tsx`
- **Description:** Main dashboard showing user overview, recent tasks, and quick navigation cards.

### 7. **Tasks Page**
- **URL:** `/tasks`
- **File:** `frontend/src/app/tasks/page.tsx`
- **Description:** Task management page with task list, filters, stats, and real-time updates via WebSocket.

### 8. **Profile Page**
- **URL:** `/profile`
- **File:** `frontend/src/app/profile/page.tsx`
- **Description:** User profile management page.

### 9. **Settings Page**
- **URL:** `/settings`
- **File:** `frontend/src/app/settings/page.tsx`
- **Description:** User settings and preferences page.

### 10. **Notifications Page**
- **URL:** `/notifications`
- **File:** `frontend/src/app/notifications/page.tsx`
- **Description:** User notifications and alerts page.

### 11. **Help Page**
- **URL:** `/help`
- **File:** `frontend/src/app/help/page.tsx`
- **Description:** Help and support documentation page.

---

## Admin-Only Pages (Admin Role Required)

### 12. **Admin Dashboard Page**
- **URL:** `/admin`
- **File:** `frontend/src/app/admin/page.tsx`
- **Description:** Admin dashboard with user management, system health monitoring, and system configuration. Protected by `RoleProtectedRoute` with `UserRole.ADMIN`.

---

## Error Pages (Special Routes)

### 13. **404 Not Found Page**
- **URL:** Any non-existent route (e.g., `/non-existent-page`)
- **File:** `frontend/src/app/not-found.tsx`
- **Description:** Custom 404 error page displayed when a route doesn't exist.

### 14. **Error Page**
- **URL:** Triggered on application errors
- **File:** `frontend/src/app/error.tsx`
- **Description:** Global error boundary page displayed when an unhandled error occurs in the application.

---

## Complete URL List

Here are all URLs to visit every page in the application:

```
Public Pages:
1. http://localhost:3000/
2. http://localhost:3000/login
3. http://localhost:3000/register
4. http://localhost:3000/forgot-password
5. http://localhost:3000/verify-email

Protected Pages (Require Login):
6. http://localhost:3000/dashboard
7. http://localhost:3000/tasks
8. http://localhost:3000/profile
9. http://localhost:3000/settings
10. http://localhost:3000/notifications
11. http://localhost:3000/help

Admin-Only Pages (Require Admin Role):
12. http://localhost:3000/admin

Error Pages:
13. http://localhost:3000/any-non-existent-route (shows 404)
14. Error page is triggered automatically on errors
```

---

## Notes

- **Port Configuration:** The default frontend port is `3000`. Adjust URLs if using a different port.
- **Authentication:** Protected pages require user authentication. Unauthenticated users are redirected to `/login`.
- **Role-Based Access:** The `/admin` page requires the `ADMIN` role. Regular users are redirected to `/dashboard`.
- **Dynamic Routes:** Currently, there are no dynamic routes (e.g., `/tasks/[id]`) in the application.
- **Error Handling:** The error page (`error.tsx`) is a Next.js error boundary that catches runtime errors. The not-found page (`not-found.tsx`) handles 404 errors.

---

## Summary

- **Total Pages:** 14
- **Public Pages:** 5
- **Protected Pages:** 6
- **Admin-Only Pages:** 1
- **Error Pages:** 2


