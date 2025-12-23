# Quick Start: Create Admin User

## 🚀 Fastest Method (Recommended)

Run this command from the `backend` directory:

```bash
cd backend
npm run create-admin -- --email admin@taskflow.com --password SecurePass123!
```

**That's it!** You now have an admin user and can log in to access the admin dashboard.

---

## 📝 Full Command Options

```bash
npm run create-admin -- \
  --email admin@taskflow.com \
  --password SecurePass123! \
  --firstName Admin \
  --lastName User
```

### Options:
- `--email` - Admin email (required)
- `--password` - Admin password (required, min 8 characters)
- `--firstName` - First name (optional)
- `--lastName` - Last name (optional)
- `--update` - Update existing user to admin (if user already exists)

---

## 🔄 Update Existing User to Admin

If you already have a user account and want to make it admin:

```bash
npm run create-admin -- \
  --email existing@user.com \
  --password TheirPassword123! \
  --update
```

---

## 🗄️ Alternative: Direct SQL Update

If you prefer SQL, connect to your database and run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## ✅ Verify Admin Access

1. Log in with your admin credentials
2. Navigate to `/admin` in your browser
3. You should see the admin dashboard

---

## 📚 More Information

See [docs/ADMIN_SETUP.md](./docs/ADMIN_SETUP.md) for detailed documentation and troubleshooting.

