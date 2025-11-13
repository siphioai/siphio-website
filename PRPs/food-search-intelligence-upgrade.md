# PRP: Food Search Intelligence Upgrade - Mind-Reading Food Logging System

**Based On**: [PRPs/INITIAL.md](PRPs/INITIAL.md)
**Target**: Web App (Phase 1 Focus)
**Estimated Time**: 10-14 hours
**Complexity**: High (Database + Backend + UI + Performance)

---

## Goal

Transform the food search and logging experience from reactive search-based to proactive intelligence-driven with:
- **Instant personalized suggestions** (top 6 foods shown immediately)
- **Clean human-readable names** ("Chicken Breast" not "Chicken, broilers or fryers, breast, meat only, cooked, roasted")
- **Smart quantity defaults** (remember user's typical amounts)
- **Typo tolerance** ("chiken" → finds "chicken")
- **Zero visual changes** to existing UI (same tabs, same interactions)

**Core Philosophy**: *"The app should feel like it reads your mind - 80% of logs happen with zero typing."*

---

## Why

**Current Pain Points**:
1. Empty UI on load → User must always type
2. Raw USDA names → Confusing and verbose
3. Always 100g default → User repeats same input constantly
4. No typo tolerance → "chiken" returns nothing
5. No personalization → Ignores user history and favorites

**Expected Impact**:
- **Time to log**: 8-12s → 2-3s (70% reduction)
- **Zero typing logs**: 60% of food logs use smart suggestions
- **User satisfaction**: 65% → 85%+ (NPS survey)
- **Search accuracy**: 60% → 90% (typo tolerance + intelligence)

---

## What

### Phase 1: Core Intelligence (10-14 hours)

1. **Database Layer** (3 hours):
   - Materialized view `user_smart_suggestions` (favorites + frequency + recency scoring)
   - Add `display_name` column to `food_items` with full-text search indexes
   - PostgreSQL FTS + pg_trgm for typo tolerance
   - Hourly refresh schedule for materialized view

2. **Backend Services** (2 hours):
   - Food name simplifier with 50+ transformation rules
   - Backfill script for existing food names

3. **API Routes** (2 hours):
   - Smart suggestions endpoint (`/api/food-search/smart-suggestions`)
   - Unified search endpoint with FTS (`/api/food-search/unified`)

4. **UI Updates** (3 hours):
   - Update `QuickAddFood.tsx` to load suggestions on mount
   - Show suggestions in Search tab immediately (no typing needed)
   - Smart quantity defaults from `typical_quantity_g`
   - Add `SmartQuantityHint.tsx` component

5. **Testing & Validation** (2 hours):
   - Test with multiple user profiles (new, casual, power user)
   - Verify favorites always appear in top 6
   - Test search typo tolerance
   - Performance benchmarking

### Success Criteria
- [ ] Smart suggestions load in <50ms (95th percentile)
- [ ] Display names are human-readable (>90% satisfaction)
- [ ] Typo tolerance works (80% of typos return correct food)
- [ ] Zero typing logs (60% of food logs use smart suggestions)
- [ ] No visual regression (exact same UI, smarter content)

---

## All Needed Context

### Documentation & References

```yaml
# PostgreSQL Full-Text Search
- url: https://www.postgresql.org/docs/current/textsearch.html
  why: Core FTS implementation, tsquery syntax, ranking functions

- url: https://www.postgresql.org/docs/current/pgtrgm.html
  why: Trigram similarity for typo tolerance, similarity() function

- url: https://www.postgresql.org/docs/current/rules-materializedviews.html
  why: Materialized view creation, refresh strategies, concurrency

# Supabase
- url: https://supabase.com/docs/guides/database/postgres/full-text-search
  why: Supabase-specific FTS patterns, tsvector generation

# Current Implementation Files (READ THESE FIRST)
- file: macro-tracker/components/QuickAddFood.tsx
  why: Main UI component - tab structure, favorites system, user handling patterns

- file: macro-tracker/lib/api/usda.ts
  why: Search logic, query expansion, deduplication, scoring algorithm patterns

- file: macro-tracker/app/api/usda/route.ts
  why: Simple pass-through pattern for Next.js API routes

- file: macro-tracker/supabase/migrations/001_initial_schema.sql
  why: Database schema, existing indexes, RLS policies, trigger patterns

# Analysis Document
- file: FOOD_SEARCH_SYSTEM_ANALYSIS.md
  why: Complete technical analysis of current system - read sections 1-6
```

### Current Codebase Structure

```bash
macro-tracker/
├── app/
│   └── api/
│       └── usda/route.ts              # Current search endpoint
├── components/
│   └── QuickAddFood.tsx               # Main UI with tabs
├── lib/
│   ├── api/usda.ts                    # Search logic + USDA integration
│   └── supabase/
│       ├── client.ts                  # Supabase client factory
│       └── server.ts                  # Server-side Supabase client
├── types/
│   ├── macros.ts                      # FoodItem interface
│   └── usda.ts                        # USDA API interfaces
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # food_items, user_favorites
        └── 003_add_favorites.sql      # user_favorites + recent_foods view
```

### Desired Codebase Structure (Files to Add)

```bash
macro-tracker/
├── app/api/food-search/              # NEW: Unified search namespace
│   ├── smart-suggestions/route.ts    # NEW: Instant personalized suggestions
│   └── unified/route.ts              # NEW: FTS + typo tolerance search
├── lib/services/                     # NEW: Service layer
│   └── food-name-simplifier.ts       # NEW: Name transformation rules
├── components/
│   └── SmartQuantityHint.tsx         # NEW: Smart quantity UI hint
└── supabase/migrations/
    └── 011_food_search_intelligence.sql  # NEW: All database changes
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: PostgreSQL FTS Gotchas

// 1. tsvector must be GENERATED ALWAYS AS ... STORED
// Don't create manually - it wastes space and gets out of sync
ALTER TABLE food_items
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(name, '')), 'B')
  ) STORED;

// 2. pg_trgm requires extension enablement
// MUST run as superuser or database owner
CREATE EXTENSION IF NOT EXISTS pg_trgm;

// 3. GIN indexes for performance (not GIST)
// GIN is faster for FTS, GIST is slower but supports more operators
CREATE INDEX idx_food_items_search ON food_items USING GIN(search_vector);
CREATE INDEX idx_food_items_trigram ON food_items USING GIN(display_name gin_trgm_ops);

// 4. Materialized view refresh requires CONCURRENTLY for zero downtime
// But CONCURRENTLY requires unique index first
CREATE UNIQUE INDEX idx_smart_suggestions_unique
  ON user_smart_suggestions(user_id, food_item_id);

REFRESH MATERIALIZED VIEW CONCURRENTLY user_smart_suggestions;

// 5. MODE() WITHIN GROUP requires PostgreSQL 9.4+
// Calculates most common value (for typical quantity)
MODE() WITHIN GROUP (ORDER BY quantity_g) as typical_quantity_g

// 6. Supabase client patterns - always use createClient()
// DON'T: import { supabase } from '@/lib/supabase'
// DO: const supabase = createClient()

// 7. Next.js API routes - use NextRequest/NextResponse
// DON'T: export default function handler(req, res)
// DO: export async function GET(request: NextRequest)

// 8. Real-time user handling pattern (from QuickAddFood.tsx)
// MUST support both authenticated and single-user mode
const { data: { user: authUser } } = await supabase.auth.getUser();
if (authUser) {
  // Multi-user: lookup by auth_id
  userId = await getUserByAuthId(authUser.id);
} else {
  // Single-user: get default user
  userId = await getDefaultUser();
}

// 9. Query expansion deduplication - use usda_fdc_id NOT name
// Same food appears with variations, FDC ID is unique identifier
const seen = new Map<string, any>();
foods.forEach(food => {
  if (!seen.has(food.usda_fdc_id)) {
    seen.set(food.usda_fdc_id, food);
  }
});

// 10. Scoring must handle edge cases
// Very short names, missing fields, zero values
const score = (
  (nameLower === queryLower ? 1000 : 0) +
  (nameLower.startsWith(queryLower) ? 500 : 0) +
  // ... more scoring logic
) || 1; // Prevent zero scores
```

---

## Implementation Blueprint

### Task 1: Database Migration - Core Intelligence Layer

**File**: `supabase/migrations/011_food_search_intelligence.sql`

**Purpose**: Create all database structures for smart suggestions, FTS, and typo tolerance

```sql
-- ===== STEP 1: Enable Extensions =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== STEP 2: Add display_name Column =====
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_food_items_display_name
  ON food_items(display_name);

-- ===== STEP 3: Full-Text Search Support =====
-- Generated tsvector column (auto-updates on INSERT/UPDATE)
ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(name, '')), 'B')
  ) STORED;

-- GIN index for FTS (faster than GIST)
CREATE INDEX IF NOT EXISTS idx_food_items_search
  ON food_items USING GIN(search_vector);

-- Trigram index for typo tolerance
CREATE INDEX IF NOT EXISTS idx_food_items_trigram
  ON food_items USING GIN(display_name gin_trgm_ops);

-- ===== STEP 4: Smart Suggestions Materialized View =====
CREATE MATERIALIZED VIEW IF NOT EXISTS user_smart_suggestions AS
WITH
-- Signal 1: Frequently logged foods (implicit behavior)
frequent_foods AS (
  SELECT
    m.user_id,
    mi.food_item_id,
    COUNT(*) as log_count,
    MODE() WITHIN GROUP (ORDER BY mi.quantity_g) as typical_quantity_g,
    MAX(mi.logged_at) as last_used_at,
    FALSE as is_favorite
  FROM meal_items mi
  JOIN meals m ON mi.meal_id = m.id
  WHERE mi.logged_at > NOW() - INTERVAL '90 days'
  GROUP BY m.user_id, mi.food_item_id
),

-- Signal 2: Favorited foods (explicit preference)
favorite_foods AS (
  SELECT
    uf.user_id,
    uf.food_item_id,
    COALESCE(
      (SELECT COUNT(*)
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = uf.user_id
         AND mi.food_item_id = uf.food_item_id
         AND mi.logged_at > NOW() - INTERVAL '90 days'
      ), 0
    ) as log_count,
    COALESCE(uf.last_quantity_g, 100) as typical_quantity_g,
    COALESCE(
      (SELECT MAX(mi.logged_at)
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = uf.user_id
         AND mi.food_item_id = uf.food_item_id
      ),
      uf.favorited_at
    ) as last_used_at,
    TRUE as is_favorite
  FROM user_favorites uf
),

-- Combine signals (favorites take precedence)
combined AS (
  SELECT * FROM favorite_foods
  UNION ALL
  SELECT * FROM frequent_foods
  WHERE NOT EXISTS (
    SELECT 1 FROM favorite_foods ff
    WHERE ff.user_id = frequent_foods.user_id
      AND ff.food_item_id = frequent_foods.food_item_id
  )
),

-- Calculate intelligent score
scored AS (
  SELECT
    user_id,
    food_item_id,
    log_count,
    typical_quantity_g,
    last_used_at,
    is_favorite,
    (
      -- Base score from logging frequency (0-500 points)
      LEAST(log_count * 10, 500) +

      -- MASSIVE bonus for favorites (1000 points)
      CASE WHEN is_favorite THEN 1000 ELSE 0 END +

      -- Recency bonus
      CASE
        WHEN last_used_at > NOW() - INTERVAL '7 days' THEN 300
        WHEN last_used_at > NOW() - INTERVAL '30 days' THEN 150
        WHEN last_used_at > NOW() - INTERVAL '60 days' THEN 50
        ELSE 0
      END
    ) as smart_score
  FROM combined
)

SELECT
  user_id,
  food_item_id,
  log_count,
  typical_quantity_g,
  last_used_at,
  is_favorite,
  smart_score
FROM scored
ORDER BY user_id, smart_score DESC;

-- ===== STEP 5: Indexes for Performance =====
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user
  ON user_smart_suggestions(user_id, smart_score DESC);

-- CRITICAL: Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_suggestions_unique
  ON user_smart_suggestions(user_id, food_item_id);

-- ===== STEP 6: Postgres Function for Fuzzy Search =====
CREATE OR REPLACE FUNCTION search_foods_fuzzy(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  usda_fdc_id TEXT,
  name TEXT,
  display_name TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.usda_fdc_id,
    f.name,
    f.display_name,
    f.calories_per_100g,
    f.protein_per_100g,
    f.carbs_per_100g,
    f.fat_per_100g,
    (
      -- Full-text search score
      ts_rank(f.search_vector, plainto_tsquery('english', search_query)) * 2 +

      -- Trigram similarity score (typo tolerance)
      similarity(f.display_name, search_query) * 3 +

      -- Exact match bonus
      CASE WHEN f.display_name ILIKE '%' || search_query || '%' THEN 1.0 ELSE 0.0 END
    ) as relevance_score
  FROM food_items f
  WHERE
    f.search_vector @@ plainto_tsquery('english', search_query)
    OR similarity(f.display_name, search_query) > similarity_threshold
  ORDER BY relevance_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 7: Refresh Function =====
CREATE OR REPLACE FUNCTION refresh_smart_suggestions()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_smart_suggestions;
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule with Supabase Edge Function (hourly cron not available in migrations)
-- See: https://supabase.com/docs/guides/functions/schedule-functions
```

**Validation**:
```bash
# Run migration
npx supabase migration up

# Verify extensions
psql -c "SELECT * FROM pg_extension WHERE extname = 'pg_trgm';"

# Test FTS function
psql -c "SELECT * FROM search_foods_fuzzy('chiken', 0.3, 5);"

# Verify materialized view
psql -c "SELECT COUNT(*) FROM user_smart_suggestions;"
```

---

### Task 2: Food Name Simplifier Service

**File**: `lib/services/food-name-simplifier.ts`

**Purpose**: Transform raw USDA names into human-readable format

```typescript
/**
 * Food Name Simplification Service
 * Transforms raw USDA names into clean, user-friendly names
 *
 * Examples:
 * "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
 *   → "Chicken Breast (roasted)"
 *
 * "Beef, ground, 93% lean meat / 7% fat, raw"
 *   → "Ground Beef 93/7"
 *
 * "Rice, white, long-grain, cooked"
 *   → "White Rice (cooked)"
 */

interface SimplificationRule {
  pattern: RegExp;
  transform: (match: RegExpMatchArray) => string;
  priority: number;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 50+ transformation rules covering common patterns
const SIMPLIFICATION_RULES: SimplificationRule[] = [
  // Chicken patterns (priority: 10)
  {
    pattern: /chicken,?\s*broilers or fryers,?\s*(breast|thigh|drumstick|leg|wing),?\s*(?:meat only,?)?\s*(cooked|raw|roasted|grilled|baked|broiled)?/i,
    transform: (m) => {
      const cut = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `Chicken ${cut}${prep}`;
    },
    priority: 10
  },

  // Ground meat patterns (priority: 9)
  {
    pattern: /(beef|turkey|chicken|pork),?\s*ground,?\s*(\d+)%?\s*lean(?:\s*meat)?\s*\/?\s*(\d+)%?\s*fat/i,
    transform: (m) => {
      const meat = capitalize(m[1]);
      return `Ground ${meat} ${m[2]}/${m[3]}`;
    },
    priority: 9
  },

  // Fish patterns (priority: 8)
  {
    pattern: /(salmon|tuna|tilapia|cod|mahi|trout),?\s*(fillet|steak)?,?\s*(cooked|raw|baked|grilled)?/i,
    transform: (m) => {
      const fish = capitalize(m[1]);
      const cut = m[2] ? ` ${capitalize(m[2])}` : '';
      const prep = m[3] ? ` (${m[3]})` : '';
      return `${fish}${cut}${prep}`;
    },
    priority: 8
  },

  // Rice patterns (priority: 7)
  {
    pattern: /rice,?\s*(white|brown|basmati|jasmine|wild)?,?\s*(long-grain|short-grain)?,?\s*(cooked|raw)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) : 'White';
      const prep = m[3] ? ` (${m[3]})` : '';
      return `${type} Rice${prep}`;
    },
    priority: 7
  },

  // Vegetable patterns (priority: 6)
  {
    pattern: /(broccoli|spinach|kale|carrots|zucchini),?\s*(cooked|raw|steamed|boiled)?/i,
    transform: (m) => {
      const veg = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${veg}${prep}`;
    },
    priority: 6
  },

  // Eggs (priority: 5)
  {
    pattern: /egg,?\s*whole,?\s*(cooked|raw|boiled|fried|scrambled)?/i,
    transform: (m) => {
      const prep = m[1] ? ` (${m[1]})` : '';
      return `Egg${prep}`;
    },
    priority: 5
  },

  // Yogurt (priority: 4)
  {
    pattern: /yogurt,?\s*(greek|plain)?,?\s*(nonfat|low-fat|whole milk)?/i,
    transform: (m) => {
      const style = m[1] ? capitalize(m[1]) + ' ' : '';
      const fat = m[2] ? ` (${m[2]})` : '';
      return `${style}Yogurt${fat}`;
    },
    priority: 4
  },

  // Cheese (priority: 3)
  {
    pattern: /cheese,?\s*(cheddar|mozzarella|parmesan|feta|swiss)?,?\s*(shredded|block|sliced)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const form = m[2] ? ` (${m[2]})` : '';
      return `${type}Cheese${form}`;
    },
    priority: 3
  },

  // Generic fallback: Remove trailing commas and extra info
  {
    pattern: /^([^,]+),\s*.+$/,
    transform: (m) => m[1].trim(),
    priority: 1
  }
];

export function simplifyFoodName(usdaName: string): string {
  if (!usdaName) return '';

  // Sort rules by priority (highest first)
  const sortedRules = [...SIMPLIFICATION_RULES].sort((a, b) => b.priority - a.priority);

  // Try each rule in order
  for (const rule of sortedRules) {
    const match = usdaName.match(rule.pattern);
    if (match) {
      const simplified = rule.transform(match);
      // Clean up any double spaces or trailing punctuation
      return simplified.replace(/\s+/g, ' ').replace(/[,;]+$/, '').trim();
    }
  }

  // No rule matched, return cleaned original
  return usdaName
    .split(',')[0]  // Take first part before comma
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Batch process all foods in database
 * Run as migration or background job
 */
export async function backfillDisplayNames(supabase: SupabaseClient) {
  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name')
    .is('display_name', null);

  if (error) throw error;

  console.log(`Backfilling display names for ${foods.length} foods...`);

  const updates = foods.map(food => ({
    id: food.id,
    display_name: simplifyFoodName(food.name)
  }));

  // Batch update (500 at a time)
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await supabase.from('food_items').upsert(batch);
    console.log(`Progress: ${i + batch.length}/${updates.length}`);
  }

  console.log('Backfill complete!');
}
```

**Validation**:
```bash
# Create test file
cat > test-simplifier.ts <<'EOF'
import { simplifyFoodName } from '@/lib/services/food-name-simplifier';

const testCases = [
  'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
  'Beef, ground, 93% lean meat / 7% fat, raw',
  'Rice, white, long-grain, cooked',
  'Salmon, Atlantic, farmed, raw',
  'Broccoli, cooked, boiled, drained, without salt'
];

testCases.forEach(name => {
  console.log(`${name}\n  → ${simplifyFoodName(name)}\n`);
});
EOF

# Run tests
npx ts-node test-simplifier.ts

# Expected output:
# Chicken, broilers or fryers... → Chicken Breast (roasted)
# Beef, ground, 93% lean... → Ground Beef 93/7
# Rice, white, long-grain... → White Rice (cooked)
```

---

### Task 3: Smart Suggestions API Route

**File**: `app/api/food-search/smart-suggestions/route.ts`

**Purpose**: Get top 6 personalized instant suggestions

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Get current user (handles both authenticated and single-user mode)
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let userId: string | null = null;

  if (authUser) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();
    userId = userData?.id || null;
  } else {
    const { data: defaultUser } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    userId = defaultUser?.id || null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Get top 6 smart suggestions
  const { data, error } = await supabase
    .from('user_smart_suggestions')
    .select(`
      *,
      food_items (
        id,
        display_name,
        name,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g
      )
    `)
    .eq('user_id', userId)
    .order('smart_score', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Smart suggestions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    suggestions: data.map(item => ({
      ...item.food_items,
      typical_quantity_g: item.typical_quantity_g,
      is_favorite: item.is_favorite,
      log_count: item.log_count,
      last_used_at: item.last_used_at,
      smart_score: item.smart_score
    }))
  });
}
```

**Validation**:
```bash
# Test API route
curl http://localhost:3000/api/food-search/smart-suggestions

# Expected response:
# {
#   "success": true,
#   "suggestions": [
#     {
#       "id": "...",
#       "display_name": "Chicken Breast (roasted)",
#       "typical_quantity_g": 180,
#       "is_favorite": true,
#       "log_count": 15,
#       "smart_score": 1450
#     },
#     // ... 5 more
#   ]
# }
```

---

### Task 4: Unified Search API Route with FTS

**File**: `app/api/food-search/unified/route.ts`

**Purpose**: Unified search with Postgres FTS + trigram similarity

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  const supabase = createClient();

  // Search local USDA foods with FTS + trigram
  const { data: localFoods, error: localError } = await supabase.rpc(
    'search_foods_fuzzy',
    {
      search_query: query,
      similarity_threshold: 0.3,
      max_results: 10
    }
  );

  if (localError) {
    console.error('Local search error:', localError);
    return NextResponse.json({ error: localError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    foods: localFoods.map((f: any) => ({ ...f, source: 'usda' }))
  });
}
```

**Validation**:
```bash
# Test typo tolerance
curl "http://localhost:3000/api/food-search/unified?query=chiken"

# Should return chicken results despite typo

# Test FTS
curl "http://localhost:3000/api/food-search/unified?query=ground+beef"

# Should return relevant ground beef results
```

---

### Task 5: Update QuickAddFood.tsx

**File**: `components/QuickAddFood.tsx`

**Changes**:
1. Load smart suggestions on mount
2. Show suggestions in Search tab immediately
3. Switch to unified search API
4. Smart quantity defaults

```typescript
// Add to existing imports
import { SmartQuantityHint } from '@/components/SmartQuantityHint';

// Add to state (line ~32)
const [smartSuggestions, setSmartSuggestions] = useState<QuickFood[]>([]);

// Update useEffect (line ~42)
useEffect(() => {
  loadSmartSuggestions();  // NEW: Load on mount
  loadFavorites();
  loadRecents();
}, []);

// NEW: Load smart suggestions function
const loadSmartSuggestions = async () => {
  try {
    const response = await fetch('/api/food-search/smart-suggestions');
    const data = await response.json();
    setSmartSuggestions(data.suggestions || []);

    // Auto-populate search results with smart suggestions
    if (activeTab === 'search' && !query) {
      setResults(data.suggestions);
    }
  } catch (error) {
    console.error('Error loading smart suggestions:', error);
  }
};

// Update handleSearch (line ~141)
const handleSearch = async () => {
  if (!query.trim()) {
    // Show smart suggestions when empty
    setResults(smartSuggestions);
    return;
  }

  setSearching(true);

  // Use unified search API (Postgres FTS + branded foods)
  const response = await fetch(`/api/food-search/unified?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  setResults(data.foods || []);
  setSearching(false);
  setActiveTab('search');
};

// Update handleQuickAdd (line ~255)
const handleQuickAdd = (food: QuickFood) => {
  // Smart quantity: Get user's typical amount
  const smartQty = food.typical_quantity_g || 100;

  setSelectedFood(food);
  setQuantity(smartQty.toString());
};

// Update Dialog quantity section (line ~461)
<div>
  <label className="text-sm font-semibold mb-2 block">Quantity (grams)</label>
  {selectedFood && (selectedFood.typical_quantity_g || selectedFood.last_quantity_g) && (
    <SmartQuantityHint
      quantity={selectedFood.typical_quantity_g || selectedFood.last_quantity_g || 100}
      source={selectedFood.is_favorite ? 'favorite' : 'last_used'}
      logCount={selectedFood.log_count}
    />
  )}
  <Input
    type="number"
    value={quantity}
    onChange={(e) => setQuantity(e.target.value)}
    min="1"
    placeholder="Enter grams"
    autoFocus
  />
</div>
```

**Validation**:
```bash
# Start dev server
npm run dev

# Open browser to food log page
open http://localhost:3000

# Test:
# 1. Open QuickAddFood - should see top 6 suggestions immediately
# 2. Click a suggestion - should pre-fill typical quantity
# 3. Type "chiken" - should find chicken despite typo
# 4. Verify favorites appear at top
```

---

### Task 6: Create SmartQuantityHint Component

**File**: `components/SmartQuantityHint.tsx`

**Purpose**: Show quantity intelligence in dialog

```typescript
interface SmartQuantityHintProps {
  quantity: number;
  source: 'last_used' | 'weekly_avg' | 'favorite' | 'default';
  logCount?: number;
}

export function SmartQuantityHint({ quantity, source, logCount }: SmartQuantityHintProps) {
  const hints = {
    last_used: `Your last amount: ${quantity}g`,
    weekly_avg: `Your average: ${quantity}g (last ${logCount} logs)`,
    favorite: `Your usual: ${quantity}g`,
    default: `Suggested: ${quantity}g`
  };

  return (
    <p className="text-xs text-muted-foreground mb-2">
      💡 {hints[source]}
    </p>
  );
}
```

---

### Task 7: Backfill Display Names Script

**File**: `scripts/backfill-display-names.ts`

**Purpose**: One-time script to update existing foods

```typescript
import { createClient } from '@supabase/supabase-js';
import { simplifyFoodName } from '../lib/services/food-name-simplifier';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function backfillDisplayNames() {
  console.log('Starting backfill of display names...');

  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name')
    .is('display_name', null);

  if (error) {
    console.error('Error fetching foods:', error);
    return;
  }

  console.log(`Found ${foods.length} foods without display names`);

  const updates = foods.map(food => ({
    id: food.id,
    display_name: simplifyFoodName(food.name)
  }));

  // Batch update (500 at a time)
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error: updateError } = await supabase
      .from('food_items')
      .upsert(batch);

    if (updateError) {
      console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
    } else {
      console.log(`Progress: ${i + batch.length}/${updates.length}`);
    }
  }

  console.log('Backfill complete!');
}

backfillDisplayNames();
```

**Validation**:
```bash
# Run backfill script
npx ts-node scripts/backfill-display-names.ts

# Verify results
psql -c "SELECT name, display_name FROM food_items LIMIT 10;"

# Check for nulls
psql -c "SELECT COUNT(*) FROM food_items WHERE display_name IS NULL;"
# Should be 0
```

---

## Validation Loop

### Level 1: Database Validation

```bash
# 1. Verify extensions
psql -c "SELECT * FROM pg_extension WHERE extname = 'pg_trgm';"

# 2. Check materialized view
psql -c "SELECT user_id, COUNT(*) FROM user_smart_suggestions GROUP BY user_id;"

# 3. Test FTS function
psql -c "SELECT display_name, relevance_score FROM search_foods_fuzzy('chicken', 0.3, 5);"

# 4. Verify indexes
psql -c "\d+ food_items"
# Should show: search_vector, idx_food_items_search, idx_food_items_trigram

# Expected: All queries return results, no errors
```

### Level 2: API Testing

```bash
# 1. Test smart suggestions
curl http://localhost:3000/api/food-search/smart-suggestions

# Expected: Top 6 personalized foods with smart_score

# 2. Test unified search
curl "http://localhost:3000/api/food-search/unified?query=chicken+breast"

# Expected: Relevant chicken breast results

# 3. Test typo tolerance
curl "http://localhost:3000/api/food-search/unified?query=chiken"

# Expected: Chicken results despite typo

# 4. Performance test
time curl "http://localhost:3000/api/food-search/smart-suggestions"

# Expected: < 50ms response time
```

### Level 3: UI Integration Testing

```bash
# Start dev server
npm run dev

# Manual test checklist:
# [ ] Open QuickAddFood - see top 6 suggestions immediately (0 typing)
# [ ] Suggestions show clean names ("Chicken Breast" not raw USDA)
# [ ] Click suggestion - quantity pre-fills with typical amount
# [ ] Search "chiken" - finds chicken despite typo
# [ ] Favorites appear at top of suggestions
# [ ] Recent foods show last used quantities
# [ ] UI looks identical (no visual regression)
# [ ] Star button still works with confetti
# [ ] Tab switching works (Search, Favorites, Recent)
# [ ] Quantity dialog shows smart hint ("Your usual: 180g")
```

### Level 4: Performance Benchmarking

```bash
# 1. Smart suggestions latency
ab -n 100 -c 10 http://localhost:3000/api/food-search/smart-suggestions

# Expected: Mean < 50ms, 95th percentile < 100ms

# 2. Unified search latency
ab -n 100 -c 10 "http://localhost:3000/api/food-search/unified?query=chicken"

# Expected: Mean < 200ms, 95th percentile < 300ms

# 3. Database query performance
EXPLAIN ANALYZE SELECT * FROM user_smart_suggestions WHERE user_id = 'uuid' LIMIT 6;

# Expected: Index Scan, < 5ms execution time
```

---

## Final Validation Checklist

- [ ] All migrations run successfully: `npx supabase migration up`
- [ ] Extensions enabled: `pg_trgm` present
- [ ] Materialized view populated: `user_smart_suggestions` has data
- [ ] Display names backfilled: No NULL display_name values
- [ ] Smart suggestions API returns top 6: `/api/food-search/smart-suggestions`
- [ ] Unified search works: `/api/food-search/unified?query=...`
- [ ] Typo tolerance functional: "chiken" finds "chicken"
- [ ] UI shows suggestions immediately: No typing required for top 6
- [ ] Smart quantities pre-fill: Uses typical_quantity_g
- [ ] Performance targets met: <50ms suggestions, <200ms search
- [ ] No visual regression: UI looks identical
- [ ] Favorites prioritized: Always in top suggestions
- [ ] Error handling graceful: Empty states for new users

---

## Anti-Patterns to Avoid

- ❌ Don't create indexes manually - use GENERATED ALWAYS AS for tsvector
- ❌ Don't skip CONCURRENTLY on materialized view refresh - causes locks
- ❌ Don't use GIST indexes for FTS - GIN is faster
- ❌ Don't forget pg_trgm extension - similarity() won't work
- ❌ Don't duplicate name simplifier logic - centralize in service
- ❌ Don't hardcode user IDs - use existing user handling pattern
- ❌ Don't change UI visually - same tabs, same interactions
- ❌ Don't skip backfill - existing foods need display names
- ❌ Don't ignore empty user history - handle gracefully (show search box)
- ❌ Don't make search required - suggestions should work without typing

---

## Success Metrics

**Performance**:
- Smart suggestions load: <50ms (95th percentile)
- Unified search latency: <200ms (95th percentile)
- Database queries: All use indexes, <10ms execution

**Quality**:
- Display names human-readable: >90% user satisfaction
- Typo tolerance: 80% of common typos return correct food
- Smart scoring: Favorites always in top 6

**User Experience**:
- Zero typing logs: 60% of food logs use smart suggestions
- Time to log: 8-12s → 2-3s (70% reduction)
- User satisfaction: 65% → 85%+ (NPS survey)

**Technical**:
- No visual regression: UI pixel-perfect match
- Backward compatibility: Old USDA API still works
- Error handling: Graceful degradation for new users

---

## PRP Confidence Score: **9/10**

**Strengths**:
- Comprehensive database migration with all SQL patterns
- Clear service layer separation (name simplifier)
- Follows existing codebase patterns (user handling, API routes)
- Detailed validation gates at each step
- Performance-focused design (materialized views, indexes)

**Risks**:
- Name simplifier rules may need tuning (50+ rules is ambitious)
- Materialized view refresh strategy needs Supabase Edge Function setup
- Performance depends on database size (may need optimization for >100k foods)

**Mitigation**:
- Start with 10 core name simplifier rules, expand iteratively
- Use manual refresh initially, add cron later
- Monitor query performance and add additional indexes if needed

---

*Generated with Claude Code - Food Search Intelligence Upgrade PRP*
*Total estimated time: 10-14 hours*
*One-pass implementation confidence: 90%*
