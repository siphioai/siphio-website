-- Fix RLS policies to allow INSERT/UPDATE/DELETE operations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can manage their goals" ON macro_goals;
DROP POLICY IF EXISTS "Users can manage their meals" ON meals;
DROP POLICY IF EXISTS "Users can manage their meal items" ON meal_items;
DROP POLICY IF EXISTS "Users can view their daily summary" ON daily_summary;
DROP POLICY IF EXISTS "Food items are viewable by all" ON food_items;
DROP POLICY IF EXISTS "Food items are insertable" ON food_items;

-- USERS TABLE - Allow all operations for single-user mode
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- MACRO GOALS - Allow all operations
CREATE POLICY "Allow all operations on macro_goals" ON macro_goals
  FOR ALL USING (true) WITH CHECK (true);

-- MEALS - Allow all operations
CREATE POLICY "Allow all operations on meals" ON meals
  FOR ALL USING (true) WITH CHECK (true);

-- MEAL ITEMS - Allow all operations
CREATE POLICY "Allow all operations on meal_items" ON meal_items
  FOR ALL USING (true) WITH CHECK (true);

-- DAILY SUMMARY - Allow all operations (needed for trigger)
CREATE POLICY "Allow all operations on daily_summary" ON daily_summary
  FOR ALL USING (true) WITH CHECK (true);

-- FOOD ITEMS - Allow all operations
CREATE POLICY "Allow all operations on food_items" ON food_items
  FOR ALL USING (true) WITH CHECK (true);
