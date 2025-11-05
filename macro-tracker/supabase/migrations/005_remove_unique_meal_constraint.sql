-- Remove the unique constraint that prevents multiple meals of the same type per day
-- This allows users to log multiple snacks, breakfasts, etc. at different times

ALTER TABLE meals
DROP CONSTRAINT IF EXISTS meals_user_id_date_meal_type_key;

-- Note: The created_at timestamp will differentiate meals of the same type
-- Each meal entry will have its own unique timestamp in the timeline
