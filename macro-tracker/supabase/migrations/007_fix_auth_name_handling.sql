-- Migration 007: Fix Auth Name Handling
-- This migration improves the user profile creation to properly handle full_name from metadata

-- Update the handle_new_user function to use full_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',  -- Try full_name first
      NEW.raw_user_meta_data->>'name',       -- Fall back to name
      split_part(NEW.email, '@', 1)          -- Last resort: email username
    )
  );

  -- Create default macro goals for the new user
  INSERT INTO public.macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
  SELECT
    (SELECT id FROM public.users WHERE auth_id = NEW.id),
    CURRENT_DATE,
    2000,  -- Default 2000 calories
    150,   -- Default 150g protein
    200,   -- Default 200g carbs
    65     -- Default 65g fat
  WHERE NOT EXISTS (
    SELECT 1 FROM public.macro_goals mg
    JOIN public.users u ON mg.user_id = u.id
    WHERE u.auth_id = NEW.id AND mg.date = CURRENT_DATE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to use updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile and default goals when new auth user signs up';
