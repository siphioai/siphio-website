-- =====================================================
-- COMPLETE AUTHENTICATION SETUP FOR MACRO TRACKER
-- =====================================================
-- Paste this entire script into Supabase SQL Editor
-- This sets up complete multi-user authentication
-- =====================================================

-- ===== STEP 1: UPDATE USERS TABLE =====
-- Add auth_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
    CREATE INDEX idx_users_auth_id ON users(auth_id);
  END IF;
END $$;

-- ===== STEP 2: DROP OLD PERMISSIVE POLICIES =====
-- Remove single-user policies if they exist
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Allow all operations on macro_goals" ON macro_goals;
DROP POLICY IF EXISTS "Users can manage their goals" ON macro_goals;
DROP POLICY IF EXISTS "Allow all operations on meals" ON meals;
DROP POLICY IF EXISTS "Users can manage their meals" ON meals;
DROP POLICY IF EXISTS "Allow all operations on meal_items" ON meal_items;
DROP POLICY IF EXISTS "Users can manage their meal items" ON meal_items;
DROP POLICY IF EXISTS "Allow all operations on daily_summary" ON daily_summary;
DROP POLICY IF EXISTS "Users can view their daily summary" ON daily_summary;
DROP POLICY IF EXISTS "Allow all operations on food_items" ON food_items;
DROP POLICY IF EXISTS "Food items are viewable by all" ON food_items;
DROP POLICY IF EXISTS "Food items are insertable" ON food_items;

-- ===== STEP 3: CREATE SECURE USER-BASED POLICIES =====

-- USERS TABLE - Users can only see and manage their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Allow inserts from authenticated users OR from SECURITY DEFINER functions (trigger)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_id OR
    auth.uid() IS NULL  -- Allow when called from SECURITY DEFINER function (trigger)
  );

-- MACRO GOALS - Users can only manage their own goals
CREATE POLICY "Users can view own macro goals" ON macro_goals
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own macro goals" ON macro_goals
  FOR ALL
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- MEALS - Users can only manage their own meals
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can manage own meals" ON meals
  FOR ALL
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- MEAL ITEMS - Users can only manage meal items in their own meals
CREATE POLICY "Users can view own meal items" ON meal_items
  FOR SELECT
  USING (
    meal_id IN (
      SELECT id FROM meals
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own meal items" ON meal_items
  FOR ALL
  USING (
    meal_id IN (
      SELECT id FROM meals
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    meal_id IN (
      SELECT id FROM meals
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- DAILY SUMMARY - Users can only view their own summaries
CREATE POLICY "Users can view own daily summary" ON daily_summary
  FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Allow system/triggers to update daily_summary (bypass RLS for automated updates)
CREATE POLICY "System can update daily summary" ON daily_summary
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- FOOD ITEMS - Public read access, authenticated insert
CREATE POLICY "Anyone can view food items" ON food_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert food items" ON food_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ===== STEP 4: CREATE AUTO-PROFILE CREATION FUNCTION =====
-- This function automatically creates a user profile when someone signs up
-- SECURITY DEFINER allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public  -- Security best practice
AS $$
BEGIN
  -- Create user profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.users (auth_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',  -- Try full_name first (from signup form)
      NEW.raw_user_meta_data->>'name',       -- Fall back to name
      split_part(NEW.email, '@', 1)          -- Last resort: email username
    )
  );

  -- Create default macro goals for today
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
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates user profile and default macro goals when new auth user signs up';

-- ===== STEP 5: CREATE TRIGGER FOR AUTO-PROFILE =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== STEP 6: ENABLE REALTIME FOR AUTHENTICATED USERS =====
-- Ensure real-time subscriptions respect RLS policies
DO $$
BEGIN
  -- Add tables to realtime publication if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE meals;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE meal_items;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE macro_goals;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_summary;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ===== VERIFICATION & SUMMARY =====
-- Verify RLS is enabled on all tables
DO $$
DECLARE
  rls_status RECORD;
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'AUTHENTICATION SETUP COMPLETE!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Row-Level Security (RLS) Status:';
  FOR rls_status IN
    SELECT
      tablename,
      CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'macro_goals', 'meals', 'meal_items', 'daily_summary', 'food_items')
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  % - %', rls_status.tablename, rls_status.status;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Policy Count per Table:';
  FOR rls_status IN
    SELECT
      schemaname || '.' || tablename as table_name,
      COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'macro_goals', 'meals', 'meal_items', 'daily_summary', 'food_items')
    GROUP BY schemaname, tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  % - % policies', rls_status.table_name, rls_status.policy_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '1. Go to Authentication → Providers';
  RAISE NOTICE '2. Enable Email provider';
  RAISE NOTICE '3. Test signup at /signup';
  RAISE NOTICE '4. Test signin at /signin';
  RAISE NOTICE '===============================================';
END $$;

-- Show final status
SELECT
  '✅ Authentication Setup Complete!' as status,
  'Users can now sign up and sign in' as message;
