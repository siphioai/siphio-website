# Multi-User Authentication Setup Guide

## ✅ Step 1: Database Migration (COMPLETED)
You've already run migration `006_enable_multi_user_auth.sql` which:
- Added `auth_id` column to users table
- Created secure RLS policies that filter by authenticated user
- Set up auto-profile creation trigger
- Enabled real-time for authenticated users

## 🔧 Step 2: Enable Supabase Auth Providers

1. **Go to your Supabase Dashboard** → Authentication → Providers
2. **Enable Email Provider** (for email/password sign up)
3. **Optional: Enable Social Providers** (Google, GitHub, etc.)
4. **Configure Email Templates** (optional - customize signup/reset emails)

## 📝 Step 3: Update Frontend Code

The following files need to be created/updated to handle authentication:

### Files to Create:
1. ✅ `middleware.ts` - Protect routes requiring auth
2. ✅ `app/auth/login/page.tsx` - Login page
3. ✅ `app/auth/signup/page.tsx` - Signup page
4. ✅ `app/auth/callback/route.ts` - OAuth callback handler
5. ✅ `components/AuthProvider.tsx` - Auth state management
6. ✅ `components/UserMenu.tsx` - User profile dropdown
7. ✅ `lib/hooks/useAuth.ts` - Auth helper hook

### Files to Update:
1. ⚠️ `app/layout.tsx` - Wrap with AuthProvider
2. ⚠️ `app/page.tsx` - Add auth check and redirect
3. ⚠️ All components that query database - Update to use auth user

## 🔐 Step 4: Environment Variables

Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 Step 5: Testing Multi-User Support

After implementing auth:
1. Create 2 test accounts
2. Log food entries in both accounts
3. Verify each user only sees their own data
4. Test real-time updates (open 2 browser windows)
5. Verify RLS policies work (no cross-user data access)

## 🚀 Next Steps

Would you like me to:
1. **Create all the auth components and pages** (login, signup, protected routes)
2. **Update existing components** to work with authenticated users
3. **Add user profile management** (settings page, logout, etc.)

Choose one and I'll implement it step by step!
