# Food Search System - Complete Technical Analysis

## System Overview

The food search system is a multi-layered architecture combining external API integration (USDA FoodData Central), local caching, user personalization, and real-time UI updates. Built with Next.js 16, React, TypeScript, and Supabase.

---

## Architecture Layers

### 1. Data Source Layer

**Primary: USDA FoodData Central API**
- **Base URL**: `https://api.nal.usda.gov/fdc/v1`
- **Dataset**: SR Legacy (Standard Reference) - most reliable, whole foods focused
- **Rate Limiting**: API key optional but recommended
- **Page Size**: 50 results per query (then filtered to top 10)

**Nutrient Mappings** (Critical):
```typescript
NUTRIENT_IDS = {
  ENERGY: 1008,   // Energy (kcal)
  PROTEIN: 1003,  // Protein (g)
  CARBS: 1005,    // Carbohydrate, by difference (g)
  FAT: 1004       // Total lipid (fat) (g)
}
```

---

### 2. Database Layer (Supabase PostgreSQL)

#### Core Tables

**`food_items`** - Food database with caching
```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usda_fdc_id TEXT UNIQUE NOT NULL,           -- USDA unique identifier
  name TEXT NOT NULL,                          -- Food description
  calories_per_100g DECIMAL(10,2) NOT NULL,
  protein_per_100g DECIMAL(10,2) NOT NULL,
  carbs_per_100g DECIMAL(10,2) NOT NULL,
  fat_per_100g DECIMAL(10,2) NOT NULL,
  category TEXT,                               -- SR Legacy, etc.
  last_synced TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_food_items_name ON food_items(name);
CREATE INDEX idx_food_items_usda_id ON food_items(usda_fdc_id);
```

**`user_favorites`** - User-specific favorites with memory
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  last_quantity_g INTEGER,                     -- Remembers last used quantity
  favorited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, food_item_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, favorited_at DESC);
```

**`recent_foods`** - Materialized view of recently logged foods
```sql
CREATE OR REPLACE VIEW recent_foods AS
SELECT DISTINCT ON (user_id, food_item_id)
  m.user_id,
  mi.food_item_id,
  fi.name,
  fi.calories_per_100g,
  fi.protein_per_100g,
  fi.carbs_per_100g,
  fi.fat_per_100g,
  mi.quantity_g as last_quantity_g,
  mi.logged_at
FROM meal_items mi
JOIN meals m ON mi.meal_id = m.id
JOIN food_items fi ON mi.food_item_id = fi.id
ORDER BY user_id, food_item_id, mi.logged_at DESC;
```

#### RLS Policies

- **food_items**: Read-all, authenticated write (caching mechanism)
- **user_favorites**: User-specific CRUD operations
- **recent_foods**: Automatic filtering by user_id

---

### 3. API Route Layer

**File**: `/app/api/usda/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const query = searchParams.get('query');

  // Validation
  if (!query) return 400;

  // Call search function
  const results = await searchFoods(query);

  return { success: true, foods: results };
}
```

**Simple pass-through** - business logic in `/lib/api/usda.ts`

---

### 4. Search Logic Layer

**File**: `/lib/api/usda.ts`

#### Query Expansion System

**Purpose**: Single-word protein queries auto-expand to specific cuts

```typescript
COMMON_FOOD_EXPANSIONS = {
  chicken: ['chicken', 'chicken breast', 'chicken thigh', 'chicken drumstick', ...],
  beef: ['beef', 'beef chuck', 'ground beef', 'beef sirloin', ...],
  pork: ['pork', 'pork chop', 'pork tenderloin', ...],
  // ... more proteins
}

expandQuery("chicken")         // → 6 parallel searches
expandQuery("chicken breast")  // → 1 search (already specific)
expandQuery("rice")           // → 1 search (not in map)
```

**Logic**:
1. If query contains spaces → no expansion (already specific)
2. If single word in expansion map → expand to array
3. Otherwise → return as-is

#### Search Flow

```
1. User enters query
   ↓
2. Expand query to array (1-6 variations)
   ↓
3. Check Supabase cache (parallel queries with Promise.all)
   ├─ CACHE HIT → Return cached results (filtered & sorted)
   └─ CACHE MISS → Continue
   ↓
4. Query USDA API (parallel requests for all expansions)
   ↓
5. Normalize USDA response → FoodItem format
   ↓
6. Deduplicate by usda_fdc_id (NOT by name)
   ↓
7. Filter out junk/processed foods
   ↓
8. Score & sort by relevance
   ↓
9. Take top 10
   ↓
10. Upsert ALL results to cache (not just top 10)
    ↓
11. Return top 10 to client
```

#### Deduplication Strategy

**Critical**: Uses `usda_fdc_id` as unique key, NOT food name

```typescript
function deduplicateFoods(foods: any[]): any[] {
  const seen = new Map<string, any>();
  for (const food of foods) {
    if (!seen.has(food.usda_fdc_id)) {
      seen.set(food.usda_fdc_id, food);
    }
  }
  return Array.from(seen.values());
}
```

**Why**: Same food appears with slight variations across different queries. USDA FDC ID is the true unique identifier.

#### Quality Filtering

**Exclude Words** (processed/junk food indicators):
```typescript
excludeWords = [
  'snack', 'cracker', 'chip', 'cookie', 'cake', 'candy', 'cereal',
  'bar', 'mix', 'prepared', 'frozen meal', 'instant', 'canned',
  'with sauce', 'flavored', 'seasoned', 'enriched', 'fortified',
  'breaded', 'nugget', 'patty', 'battered', 'fried with coating',
  'processed', 'formed', 'restructured'
]
```

**Minimum Threshold**: `calories_per_100g >= 10`

#### Relevance Scoring Algorithm

```typescript
Score Calculation:
- Exact match:                  +1000
- Starts with query:            +500
- Contains all query words:     +100 per word
- Fewer commas (simpler name):  -20 per comma

Whole Food Bonuses:
- Cooking methods:              +200  (raw, cooked, roasted, grilled, baked)
- Anatomy words:                +150  (breast, thigh, tenderloin, fillet, etc.)
- Ground meat:                  +150
- "Broilers or fryers":         +100  (most common chicken type)
- "Meat only":                  +75

Processed Penalties:
- Breaded/nugget/patty:         -500
```

**Final Output**: Top 10 by score (descending)

---

### 5. UI Component Layer

#### Component: `QuickAddFood.tsx`

**Primary search interface** with tabs, favorites, and recents

**State Management**:
```typescript
- query: string                 // Search input
- results: FoodItem[]          // API results
- favorites: QuickFood[]       // User favorites
- recents: QuickFood[]         // Recent foods
- selectedFood: QuickFood      // For quantity dialog
- quantity: string             // Default: "100"
- searching: boolean           // Loading state
- activeTab: 'search' | 'favorites' | 'recent'
```

**Data Flow**:
```
Load Component
  ↓
Parallel Load: loadFavorites() + loadRecents()
  ↓
User Types Query + Enter/Click
  ↓
handleSearch() → fetch('/api/usda?query=...') → setResults()
  ↓
User Clicks Food Card
  ↓
handleQuickAdd() → Opens Dialog (pre-fill last_quantity_g if available)
  ↓
User Enters Quantity + Confirms
  ↓
handleAdd() → onAddFood(foodItemId, quantity)
  ↓
Updates favorites.last_quantity_g if favorited
  ↓
loadRecents() to refresh
```

**Features**:

1. **Tab System**:
   - Search: API results
   - Favorites (count badge): User-specific starred foods
   - Recent (count badge): Last 10 logged foods with quantities

2. **Favorites System**:
   - Star icon on every food card
   - Click star → toggleFavorite()
   - Confetti animation when adding (canvas-confetti)
   - Toast notifications
   - Remembers last quantity used

3. **Smart Defaults**:
   - Quantity defaults to 100g
   - OR last_quantity_g if available from favorites/recents
   - Auto-focus on quantity input

4. **Real-time User Handling**:
   ```typescript
   // Handles both authenticated and single-user mode
   if (authUser) {
     // Multi-user: Lookup by auth_id
     userId = await getUserByAuthId(authUser.id);
   } else {
     // Single-user: Get default user
     userId = await getDefaultUser();
   }
   ```

#### Component: `FoodLog.tsx`

**Consumes QuickAddFood** for adding meals

**Integration Points**:
```typescript
<QuickAddFood
  onAddFood={(foodItemId, quantity) => handleAddFood(foodItemId, quantity, meal.id)}
/>
```

**Adds to specific meal OR creates new snack meal**

#### Component: `FoodSearch.tsx`

**Simpler version** without tabs/favorites (legacy)
- Used in simpler contexts
- Same API calls
- Same quantity dialog

---

### 6. Type System

**File**: `/types/macros.ts` (inferred)

```typescript
interface FoodItem {
  id: string;                    // UUID from Supabase
  usda_fdc_id: string;          // USDA unique ID
  name: string;                  // Food description
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;             // "SR Legacy", etc.
  last_synced?: string;          // Timestamp
}

interface QuickFood extends FoodItem {
  last_quantity_g?: number;      // User memory
  is_favorite?: boolean;         // UI flag
}

interface USDASearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: Array<{
    nutrientId: number;
    value: number;
  }>;
}

interface USDASearchResponse {
  foods: USDASearchResult[];
}
```

---

## Performance Characteristics

### Caching Strategy

**Cache Hit** (Best Case):
- Time: ~50-150ms (Supabase query only)
- Cost: $0 (free tier)
- Queries: `O(n)` where n = expanded queries (1-6)

**Cache Miss** (Worst Case):
- Time: ~1-3 seconds (USDA API + processing)
- Cost: API rate limit usage
- Queries: 1-6 parallel USDA requests + 1 batch upsert

**Cache Persistence**:
- Infinite (last_synced for future purging, but not implemented)
- All results cached (not just top 10)
- Upsert on conflict: `usda_fdc_id`

### Search Performance

**Query Expansion Impact**:
- Single word protein: 6 parallel requests → 6x data → better results
- Specific query: 1 request → faster, focused results
- Trade-off: Latency vs. result quality

**Database Queries**:
- Favorites load: `O(1)` - indexed by user_id + timestamp
- Recents load: `O(1)` - materialized view with limit 10
- Search cache check: `O(n)` - where n = expanded queries (typically 1-6)

**UI Responsiveness**:
- Search loading state: prevents duplicate requests
- Optimistic UI updates: None (waits for confirmation)
- Real-time updates: Supabase subscriptions in FoodLog (not in search)

---

## Integration Points

### With Meal System

```typescript
// FoodLog.tsx
handleAddFood(foodItemId, quantity, targetMealId?) {
  if (targetMealId) {
    // Add to existing meal
    createMealItem(targetMealId, foodItemId, quantity);
  } else {
    // Create new snack meal
    meal = createMeal(type: 'snack');
    createMealItem(meal.id, foodItemId, quantity);
  }
}
```

**Macro Calculation**:
```typescript
multiplier = quantity / 100;
calories = food.calories_per_100g * multiplier;
protein = food.protein_per_100g * multiplier;
carbs = food.carbs_per_100g * multiplier;
fat = food.fat_per_100g * multiplier;
```

### With User System

**Multi-user Mode**:
```typescript
user = await getUser();
if (user.auth_id) {
  // Authenticated user
  userData = await lookupByAuthId(user.auth_id);
} else {
  // Single-user fallback
  userData = await getDefaultUser();
}
```

**Favorites & Recents** are user-scoped:
- `user_favorites.user_id`
- `recent_foods` view filters by user_id

---

## Error Handling

### API Layer

```typescript
// Graceful degradation per query
apiCalls.map(async (q) => {
  try {
    return await fetchUSDA(q);
  } catch (error) {
    console.warn(`Failed for "${q}":`, error);
    return []; // Don't fail entire request
  }
});
```

**Fallback Chain**:
1. Try cache
2. Try USDA API
3. Return partial results (from successful queries only)
4. Never return error to user (worst case: empty array)

### UI Layer

```typescript
// User-facing errors
try {
  await toggleFavorite();
  toast.success('Added to favorites! ⭐');
} catch {
  toast.error('Failed to update favorites');
}
```

**No Error UI**: Empty states only
- "No favorites yet"
- "No recent foods"
- "Found 0 results" (implicit - no results shown)

---

## Security & Data Privacy

### RLS Policies

```sql
-- food_items: Public read, authenticated write
CREATE POLICY "Anyone can view food items" ON food_items
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert food items" ON food_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- user_favorites: User-scoped
CREATE POLICY "Users can manage their favorites" ON user_favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id);
```

### Data Validation

**Frontend**:
- Quantity must be > 0
- Query must not be empty
- Type checking via TypeScript

**Backend**:
- No user input directly in SQL (Supabase client handles escaping)
- API key in environment variable
- USDA API responses validated by TypeScript interfaces

**No Sensitive Data**: Food items are public knowledge

---

## Known Limitations & Issues

### Current System

1. **No Pagination**: Always returns top 10
   - Fixed limit for simplicity
   - May miss relevant results if bad scoring

2. **No Search History**: Each search is independent
   - No learning from user behavior
   - No personalized ranking

3. **Static Query Expansion**: Hardcoded protein list
   - Doesn't cover vegetables, grains, etc.
   - Manual maintenance required

4. **Cache Never Expires**: `last_synced` not used
   - Stale USDA data possible
   - Database grows indefinitely

5. **No Fuzzy Matching**: Exact substring only
   - Typos not handled
   - "chiken" won't find "chicken"

6. **Single Data Source**: USDA only
   - Limited international foods
   - No branded products
   - No user-created foods

7. **Scoring Algorithm**: Simple heuristics
   - No ML/AI ranking
   - No user feedback loop
   - May prioritize wrong results

8. **No Autocomplete**: Full search on enter only
   - Poor mobile UX
   - Slower discovery

9. **Fixed Nutrient Set**: Only 4 macros
   - No micronutrients
   - No fiber, sugar breakdown
   - No sodium, cholesterol, etc.

10. **Favorites Don't Sync Quantity**: Only remembers last quantity
    - Can't have multiple saved quantities
    - No "usual breakfast portion" vs "snack portion"

---

## Data Flow Diagram

```
┌─────────────┐
│   User UI   │
│ QuickAddFood│
└──────┬──────┘
       │ 1. Search Query
       ↓
┌─────────────────┐
│  Next.js Route  │
│ /api/usda/route │
└──────┬──────────┘
       │ 2. Forward Query
       ↓
┌────────────────────┐
│  Search Function   │
│   lib/api/usda.ts  │
└──────┬─────────────┘
       │
       ├──→ 3a. Check Supabase Cache
       │    ┌─────────────────┐
       │    │   food_items    │
       │    │  (PostgreSQL)   │
       │    └─────────────────┘
       │         │
       │         ├─ CACHE HIT → Return
       │         │
       │         └─ CACHE MISS → Continue
       │
       └──→ 3b. Query USDA API (parallel)
            ┌──────────────────────┐
            │  FoodData Central    │
            │  (USDA External API) │
            └──────┬───────────────┘
                   │ 4. Raw Results
                   ↓
            ┌──────────────────────┐
            │   Normalize Data     │
            │  - Map nutrients     │
            │  - Extract macros    │
            └──────┬───────────────┘
                   │ 5. Normalized
                   ↓
            ┌──────────────────────┐
            │   Deduplicate        │
            │  (by usda_fdc_id)    │
            └──────┬───────────────┘
                   │ 6. Unique Foods
                   ↓
            ┌──────────────────────┐
            │   Filter Junk        │
            │  (exclude words)     │
            └──────┬───────────────┘
                   │ 7. Quality Foods
                   ↓
            ┌──────────────────────┐
            │  Score & Sort        │
            │  (relevance algo)    │
            └──────┬───────────────┘
                   │ 8. Ranked List
                   ↓
            ┌──────────────────────┐
            │   Take Top 10        │
            └──────┬───────────────┘
                   │ 9. Final Results
                   ↓
            ┌──────────────────────┐
            │  Cache All Results   │
            │  (upsert to DB)      │
            └──────┬───────────────┘
                   │ 10. Cached
                   ↓
       ┌─────────────────────┐
       │   Return to UI      │
       │   (top 10 only)     │
       └─────────────────────┘
```

---

## Component Dependency Tree

```
FoodLog.tsx (Main Container)
    ├── QuickAddFood.tsx (Search UI)
    │   ├── Input (Search bar)
    │   ├── Button (Search trigger)
    │   ├── Tabs (Search | Favorites | Recent)
    │   ├── FoodCard[] (Results list)
    │   │   ├── Star button (toggleFavorite)
    │   │   └── Click → handleQuickAdd()
    │   ├── Dialog (Quantity input)
    │   │   ├── Input (Quantity in grams)
    │   │   └── Button → handleAdd()
    │   └── Confetti (Visual feedback)
    │
    ├── /api/usda (Next.js API Route)
    │   └── lib/api/usda.ts (Search logic)
    │       ├── expandQuery()
    │       ├── searchFoods()
    │       ├── deduplicateFoods()
    │       ├── filterAndSortResults()
    │       └── normalizeUSDAFood()
    │
    └── Supabase Client
        ├── food_items (Cache table)
        ├── user_favorites (Favorites table)
        └── recent_foods (View)

Alternative Simple UI:
FoodSearch.tsx (Minimal version)
    ├── Same API integration
    └── No tabs/favorites (search only)
```

---

## Database Schema Relationships

```
users (1) ──────┬──────────── (*) user_favorites (*) ──> (1) food_items
                │
                └──────────── (*) meals (*) ──> (*) meal_items (*) ──> (1) food_items

View: recent_foods
  └──> Aggregates: meal_items + meals + food_items
       Filters: Latest 10 per (user_id, food_item_id)
```

---

## API Request/Response Examples

### Search Request

```http
GET /api/usda?query=chicken%20breast
```

### Search Response

```json
{
  "success": true,
  "foods": [
    {
      "id": "uuid-here",
      "usda_fdc_id": "171477",
      "name": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      "calories_per_100g": 165.00,
      "protein_per_100g": 31.02,
      "carbs_per_100g": 0.00,
      "fat_per_100g": 3.57,
      "category": "SR Legacy"
    },
    // ... 9 more items
  ]
}
```

### USDA API Request (Internal)

```http
GET https://api.nal.usda.gov/fdc/v1/foods/search
  ?query=chicken+breast
  &dataType=SR+Legacy
  &pageSize=50
  &api_key=YOUR_KEY
```

### USDA API Response (Simplified)

```json
{
  "foods": [
    {
      "fdcId": 171477,
      "description": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      "dataType": "SR Legacy",
      "foodNutrients": [
        { "nutrientId": 1008, "value": 165 },
        { "nutrientId": 1003, "value": 31.02 },
        { "nutrientId": 1005, "value": 0 },
        { "nutrientId": 1004, "value": 3.57 }
      ]
    }
  ]
}
```

---

## File Structure

```
macro-tracker/
├── app/
│   └── api/
│       └── usda/
│           └── route.ts              # Next.js API endpoint
│
├── lib/
│   ├── api/
│   │   └── usda.ts                   # Search logic & USDA integration
│   └── supabase/
│       └── client.ts                 # Supabase client factory
│
├── components/
│   ├── QuickAddFood.tsx              # Primary search UI (with tabs)
│   ├── FoodSearch.tsx                # Simple search UI (legacy)
│   └── FoodLog.tsx                   # Container (uses QuickAddFood)
│
├── types/
│   ├── macros.ts                     # FoodItem interface
│   └── usda.ts                       # USDA API interfaces
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql    # food_items table
        └── 003_add_favorites.sql     # user_favorites + recent_foods view
```

---

## Configuration Requirements

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional: Faster USDA API (no rate limit)
USDA_API_KEY=your-api-key-here
```

### Database Indexes (Critical for Performance)

```sql
-- Search performance
CREATE INDEX idx_food_items_name ON food_items(name);

-- Deduplication performance
CREATE INDEX idx_food_items_usda_id ON food_items(usda_fdc_id);

-- Favorites loading
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id, favorited_at DESC);
```

---

## Testing Considerations

### Manual Testing Scenarios

1. **Simple Query**: "chicken" → Should expand to 6 variations
2. **Specific Query**: "chicken breast" → No expansion, focused results
3. **Cache Test**: Search same query twice → Second should be instant
4. **Quality Filter**: Search "chicken nugget" → Should be excluded or downranked
5. **Relevance**: Search "rice" → Should prioritize plain rice over rice dishes
6. **Favorites**: Star a food → Should persist and remember quantity
7. **Recents**: Log a food → Should appear in recent tab with quantity
8. **Empty Search**: No query → Should disable button
9. **No Results**: Random gibberish → Should show empty state
10. **Multi-user**: Different users → Should have separate favorites/recents

### Performance Benchmarks

- Cache hit: < 150ms
- Cache miss: < 3s (USDA API dependent)
- Favorites load: < 100ms
- Recents load: < 100ms
- UI render: < 50ms (React optimization needed)

---

## Future Enhancement Opportunities

### High Priority

1. **Autocomplete/Typeahead**: Real-time suggestions as user types
2. **Fuzzy Search**: Handle typos and variations
3. **Search History**: Learn from user patterns
4. **Barcode Scanner**: Mobile camera integration
5. **User-Created Foods**: Custom food database
6. **Branded Foods**: USDA Branded database (requires different parsing)

### Medium Priority

7. **Micronutrients**: Expand beyond 4 macros
8. **Portion Sizes**: "1 cup", "1 piece" instead of only grams
9. **Recent Search Terms**: Quick re-search
10. **Food Categories**: Filter by type (protein, grain, vegetable)
11. **Nutritional Density Scores**: Quality indicators
12. **Meal Templates**: Save common meals

### Low Priority

13. **AI-Powered Search**: ML ranking based on user behavior
14. **Image Recognition**: Photo-based food logging
15. **Recipe Integration**: Breakdown complex dishes
16. **International Databases**: Non-US food data
17. **Offline Mode**: Cache more aggressively
18. **Collaborative Filtering**: "Users like you also logged..."

---

## Critical Implementation Notes

### DO:
- Always deduplicate by `usda_fdc_id`, never by name
- Cache ALL results, not just top 10 (better future searches)
- Use parallel API calls for query expansions
- Gracefully degrade on partial failures
- Remember last quantities for UX
- Filter processed foods aggressively

### DON'T:
- Don't expand multi-word queries (already specific)
- Don't trust food names as unique identifiers
- Don't make sequential API calls (use Promise.all)
- Don't show errors for food not found (empty state instead)
- Don't skip nutrient ID validation (some foods missing nutrients)
- Don't cache USDA responses directly (normalize first)

### WATCH OUT:
- USDA API rate limits (use API key in production)
- Database storage growth (cache never expires)
- Scoring algorithm edge cases (very short names, etc.)
- RLS policies for multi-user scenarios
- Real-time subscription cleanup (FoodLog component)
- Confetti animation performance on slow devices

---

## Summary

The food search system is a sophisticated caching layer on top of USDA FoodData Central, with intelligent query expansion, quality filtering, and user personalization. The architecture prioritizes performance (cache-first), UX (remembers quantities, favorites), and data quality (filters junk food, scores relevance).

**Key Strengths**:
- Fast (cache-first with parallel requests)
- Smart (query expansion for better results)
- User-friendly (favorites, recents, quantity memory)
- Reliable (graceful degradation, no user-facing errors)

**Key Weaknesses**:
- Limited to USDA data (no branded, international, or user foods)
- No fuzzy search or typo handling
- Static quality filters (no learning)
- No pagination (fixed top 10)
- No autocomplete (full search only)

This system is production-ready for whole food tracking but needs significant enhancements for broader food logging scenarios (restaurants, packaged foods, recipes, etc.).
