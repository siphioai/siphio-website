# 🚀 Quick Start: Enable Authentication (5 Minutes)

## Step 1: Run SQL (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of `supabase/COMPLETE_AUTH_SETUP.sql`
3. Paste and **Run**
4. ✅ See success message

## Step 2: Enable Email Auth (1 minute)

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. Toggle **Email** → **ON**
3. **Disable "Confirm email"** for development
4. **Save**

## Step 3: Test (2 minutes)

1. Go to `http://localhost:3001/signup`
2. Create test account
3. ✅ Should redirect to dashboard
4. Sign out and test signin at `/signin`

## ✅ Done!

Authentication is fully integrated. Users can:
- Sign up with email/password
- Sign in to their account
- Only see their own data (RLS enabled)
- Get default macro goals automatically

---

## 📄 Files Created

1. **`supabase/COMPLETE_AUTH_SETUP.sql`** - Paste this into Supabase SQL Editor
2. **`SUPABASE_AUTH_SETUP_GUIDE.md`** - Full setup guide with troubleshooting
3. **`supabase/migrations/007_fix_auth_name_handling.sql`** - Individual migration

## 🔗 Key URLs

- Signup: `http://localhost:3001/signup`
- Signin: `http://localhost:3001/signin`
- Landing: `http://localhost:3001/landing`
- Dashboard: `http://localhost:3001/`

## 🐛 Quick Troubleshooting

**Problem:** User not created after signup
```sql
-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Problem:** Can't see data after signin
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

**Problem:** Error during signup
- Check browser console
- Check Supabase Dashboard → Logs → Auth Logs
- Verify environment variables in `.env.local`
