# 🔧 Fix: "Database error saving new user"

## The Problem
The RLS (Row-Level Security) policies were blocking the trigger function from creating user profiles.

## The Solution
Run this SQL in your Supabase SQL Editor:

### Option 1: Quick Fix (Run This Now)

Copy and paste this into **Supabase SQL Editor** and click **Run**:

```sql
-- Fix the insert policy to allow trigger to work
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_id OR
    auth.uid() IS NULL  -- Allow SECURITY DEFINER functions (triggers)
  );

-- Update the trigger function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );

  INSERT INTO public.macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
  SELECT
    (SELECT id FROM public.users WHERE auth_id = NEW.id),
    CURRENT_DATE,
    2000, 150, 200, 65
  WHERE NOT EXISTS (
    SELECT 1 FROM public.macro_goals mg
    JOIN public.users u ON mg.user_id = u.id
    WHERE u.auth_id = NEW.id AND mg.date = CURRENT_DATE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Fixed! Try signing up again.' as status;
```

### Option 2: Use the Fix File

Alternatively, copy the entire contents of `supabase/FIX_AUTH_RLS.sql` and run it.

## ✅ After Running the Fix

1. Go back to `http://localhost:3001/signup`
2. Try creating your account again
3. It should now work! ✨

## What Changed?

1. **Updated RLS policy** - Now allows inserts from `SECURITY DEFINER` functions
2. **Updated trigger function** - Explicitly set to `SECURITY DEFINER` mode
3. **Added `search_path`** - Security best practice

## Verify It Worked

After signing up successfully, check in Supabase SQL Editor:

```sql
-- Check if user profile was created
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;

-- Check if default goals were created
SELECT * FROM macro_goals ORDER BY created_at DESC LIMIT 1;
```

You should see your new user and default macro goals!
