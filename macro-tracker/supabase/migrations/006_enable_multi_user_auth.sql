-- Migration 006: Enable Multi-User Authentication
-- This migration converts the app from single-user to multi-user mode with proper auth

-- ===== STEP 1: UPDATE USERS TABLE =====
-- Link users table to Supabase auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- ===== STEP 2: DROP EXISTING PERMISSIVE POLICIES =====
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on macro_goals" ON macro_goals;
DROP POLICY IF EXISTS "Allow all operations on meals" ON meals;
DROP POLICY IF EXISTS "Allow all operations on meal_items" ON meal_items;
DROP POLICY IF EXISTS "Allow all operations on daily_summary" ON daily_summary;
DROP POLICY IF EXISTS "Allow all operations on food_items" ON food_items;

-- ===== STEP 3: CREATE SECURE USER-BASED POLICIES =====

-- USERS TABLE - Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

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

-- Allow trigger to update daily_summary (bypass RLS)
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

-- ===== STEP 4: CREATE FUNCTION TO AUTO-CREATE USER PROFILE =====
-- Automatically create a user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== STEP 5: ENABLE REALTIME FOR AUTHENTICATED USERS =====
-- Ensure real-time subscriptions respect RLS policies
ALTER PUBLICATION supabase_realtime ADD TABLE meals;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_items;
ALTER PUBLICATION supabase_realtime ADD TABLE macro_goals;

-- ===== VERIFICATION =====
-- Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'macro_goals', 'meals', 'meal_items', 'daily_summary', 'food_items');
