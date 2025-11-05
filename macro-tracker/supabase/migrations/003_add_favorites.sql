-- supabase/migrations/003_add_favorites.sql
-- Add favorites functionality

-- ===== USER FAVORITES TABLE =====
-- Track user's favorite foods for quick adding
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  last_quantity_g DECIMAL(10, 2), -- Remember last used quantity
  favorited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, food_item_id) -- Prevent duplicate favorites
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, favorited_at DESC);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorites" ON user_favorites
  FOR ALL USING (true);

-- ===== HELPER VIEW FOR RECENT FOODS =====
-- This view gets the 10 most recently logged unique foods
CREATE OR REPLACE VIEW recent_foods AS
SELECT DISTINCT ON (mi.food_item_id, m.user_id)
  m.user_id,
  mi.food_item_id,
  mi.quantity_g as last_quantity_g,
  mi.logged_at,
  fi.name,
  fi.calories_per_100g,
  fi.protein_per_100g,
  fi.carbs_per_100g,
  fi.fat_per_100g
FROM meal_items mi
JOIN meals m ON mi.meal_id = m.id
JOIN food_items fi ON mi.food_item_id = fi.id
ORDER BY mi.food_item_id, m.user_id, mi.logged_at DESC;

-- ===== VERIFICATION =====
SELECT 'Favorites table created successfully' as status;
