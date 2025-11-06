# 🔐 Complete Supabase Authentication Setup Guide

This guide will help you fully integrate authentication into your Macro Tracker app.

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Environment variables configured in `.env.local`
- ✅ Initial database schema already created (migrations 001-005)

## 🚀 Step 1: Run SQL Migration

### Option A: Run the Complete Setup Script (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the **entire contents** of `supabase/COMPLETE_AUTH_SETUP.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see success messages and a verification summary

### Option B: Run Individual Migrations

If you prefer to run migrations individually:

```bash
# In your Supabase SQL Editor, run these in order:
1. supabase/migrations/006_enable_multi_user_auth.sql
2. supabase/migrations/007_fix_auth_name_handling.sql
```

## ✅ Step 2: Enable Email Authentication

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle it **ON**
4. **Important Settings:**
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** - DISABLE this for development (enable in production)
   - ✅ **Secure email change** - Enable for production
   - ✅ **Enable email signup** - ON

5. **Save changes**

## 🎨 Step 3: Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Welcome email
   - **Magic Link** - Passwordless login
   - **Change Email Address** - Email change confirmation
   - **Reset Password** - Password reset email

### Example: Customize Confirm Signup Template

```html
<h2>Welcome to Macro Tracker!</h2>
<p>Thanks for signing up. Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>Start tracking your macros with AI-powered insights!</p>
```

## 🔍 Step 4: Verify Setup

Run this query in SQL Editor to verify everything is set up:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'macro_goals', 'meals', 'meal_items', 'daily_summary')
ORDER BY tablename;

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

All tables should show `rowsecurity = true` and you should see multiple policies per table.

## 🧪 Step 5: Test Authentication Flow

### Test Signup

1. Navigate to `http://localhost:3001/signup`
2. Fill in the signup form:
   - **Full Name:** Test User
   - **Email:** test@example.com
   - **Password:** testpassword123
3. Click **Start Free Trial**
4. You should be redirected to the dashboard (`/`)

### Test Auto-Profile Creation

After signup, check the database:

```sql
-- Check user was created
SELECT id, email, name, auth_id
FROM users
ORDER BY created_at DESC
LIMIT 1;

-- Check default macro goals were created
SELECT mg.*, u.email
FROM macro_goals mg
JOIN users u ON mg.user_id = u.id
WHERE u.email = 'test@example.com'
ORDER BY mg.date DESC;
```

### Test Signin

1. Navigate to `http://localhost:3001/signin`
2. Enter credentials:
   - **Email:** test@example.com
   - **Password:** testpassword123
3. Click **Sign In**
4. You should be redirected to the dashboard

### Test Data Isolation (Multi-User)

1. **Create 2 test accounts**
2. **Sign in as User 1** and log some meals
3. **Sign in as User 2** and log different meals
4. **Verify:** Each user only sees their own data

```sql
-- View all users and their meal counts
SELECT
  u.email,
  u.name,
  COUNT(DISTINCT m.id) as meal_count,
  COUNT(DISTINCT mi.id) as meal_item_count
FROM users u
LEFT JOIN meals m ON u.id = m.user_id
LEFT JOIN meal_items mi ON m.id = mi.meal_id
GROUP BY u.id, u.email, u.name
ORDER BY u.created_at DESC;
```

## 🔧 Step 6: Update Frontend (Already Done!)

The following components are already implemented:

✅ **Authentication Pages:**
- `/signup` - SignupForm with Supabase integration
- `/signin` - SigninForm with Supabase integration
- `/auth/callback` - OAuth callback handler

✅ **Authentication Logic:**
- Supabase client configuration
- Error handling
- Loading states
- Redirects after auth

## 🎯 What Happens When Users Sign Up

1. **User fills out signup form** with name, email, password
2. **Supabase creates auth user** in `auth.users` table
3. **Trigger fires** (`on_auth_user_created`)
4. **Function creates profile:**
   - Inserts row in `public.users` table
   - Links `auth_id` to auth user
   - Stores `full_name` from metadata
5. **Function creates default goals:**
   - Inserts default macro goals for today
   - 2000 cal, 150g protein, 200g carbs, 65g fat
6. **User is redirected** to dashboard
7. **User can immediately** start logging food

## 🔐 Security Features

### Row-Level Security (RLS)

All tables have RLS enabled with policies that:

- ✅ Users can only view their own data
- ✅ Users can only modify their own data
- ✅ Users cannot access other users' meals/goals
- ✅ Food items are public (read-only)
- ✅ Daily summaries are auto-calculated by triggers

### Example RLS Policy

```sql
-- Users can only view their own meals
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

This ensures that when a user queries meals, they automatically only get their own meals.

## 🐛 Troubleshooting

### Issue: "User not found" after signup

**Solution:** Check if trigger is working:

```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Manually verify auth user has profile
SELECT
  au.id as auth_id,
  au.email as auth_email,
  u.id as profile_id,
  u.email as profile_email,
  u.name
FROM auth.users au
LEFT JOIN public.users u ON u.auth_id = au.id
ORDER BY au.created_at DESC
LIMIT 5;
```

### Issue: "Permission denied" when querying data

**Solution:** Check RLS policies:

```sql
-- View all policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Issue: Can see other users' data

**Solution:** RLS might not be enabled:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
```

## 📊 Monitor Authentication

### View Recent Signups

```sql
SELECT
  au.email,
  au.created_at as signup_time,
  u.name as profile_name,
  CASE WHEN u.id IS NOT NULL THEN '✅' ELSE '❌' END as profile_created
FROM auth.users au
LEFT JOIN public.users u ON u.auth_id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
```

### View Active Sessions

Go to **Supabase Dashboard** → **Authentication** → **Users** to see:
- Total user count
- Recent signups
- Email confirmation status
- Last sign-in times

## 🎉 Success Checklist

Once you've completed all steps, verify:

- [ ] SQL migration ran successfully
- [ ] Email provider is enabled in Supabase
- [ ] Trigger `on_auth_user_created` exists
- [ ] RLS is enabled on all tables
- [ ] Policies exist for each table
- [ ] Test signup creates user profile automatically
- [ ] Test signup creates default macro goals
- [ ] Test signin works with created account
- [ ] Users can only see their own data
- [ ] Landing page → Signup → Dashboard flow works

## 🚀 Next Steps

Now that authentication is set up:

1. **Add password reset flow** (forgot password page)
2. **Add email verification** (optional, for production)
3. **Add social auth** (Google, GitHub, etc.)
4. **Add user settings page** (change email, password, name)
5. **Add profile pictures** (upload to Supabase Storage)
6. **Add onboarding flow** (guide new users through first meal log)

## 📞 Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are correct
4. Test SQL queries directly in SQL Editor

---

**Authentication is now fully integrated!** 🎉

Users can sign up, sign in, and their data is automatically secured with Row-Level Security.
