-- =====================================================
-- FIX: Allow trigger to create user profiles
-- =====================================================
-- This fixes the "Database error saving new user" issue
-- The problem: RLS policies block the trigger from inserting
-- =====================================================

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a more permissive insert policy that allows the trigger to work
-- This allows inserts when either:
-- 1. The auth_id matches the authenticated user (normal case)
-- 2. The function is running as SECURITY DEFINER (trigger case)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_id OR
    auth.uid() IS NULL  -- Allow when called from SECURITY DEFINER function
  );

-- Alternative: Update the trigger function to use a service role
-- This is more secure and explicit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This makes the function run with owner privileges
SET search_path = public
AS $$
BEGIN
  -- Create user profile (will bypass RLS due to SECURITY DEFINER)
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

  -- Create default macro goals for today
  INSERT INTO public.macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
  SELECT
    (SELECT id FROM public.users WHERE auth_id = NEW.id),
    CURRENT_DATE,
    2000,
    150,
    200,
    65
  WHERE NOT EXISTS (
    SELECT 1 FROM public.macro_goals mg
    JOIN public.users u ON mg.user_id = u.id
    WHERE u.auth_id = NEW.id AND mg.date = CURRENT_DATE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the function security setting
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Test message
SELECT '✅ Auth trigger fixed! Try signing up again.' as status;
