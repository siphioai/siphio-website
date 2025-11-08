name: "Smart Query Expansion for USDA Food Search"
description: |
  Enhance USDA food search to return whole foods (chicken breast, ground beef)
  instead of processed foods (chicken nuggets, beef patties) for single-word protein queries.

---

## Goal

Implement intelligent query expansion in the USDA food search API to dramatically improve search relevance for common single-word protein searches. When a user searches for "chicken", they should get whole cuts (breast, thigh, drumstick) not processed items (nuggets, patties, breadcrumbs).

**Target File:** [macro-tracker/lib/api/usda.ts](macro-tracker/lib/api/usda.ts) (currently 145 lines, will grow to ~250-295 lines)

**No breaking changes:** All existing searches must continue to work. The API contract remains unchanged.

## Why

**Business Value:**
- Users are frustrated searching for "chicken" and getting chicken nuggets as top results
- USDA SR Legacy uses verbose hierarchical naming: "Chicken, broilers or fryers, breast, meat only, raw"
- Single-word searches don't match this naming structure well
- Better search = faster meal logging = better user retention

**User Impact:**
- Searching "chicken" → Get: chicken breast, chicken thigh, chicken drumstick, ground chicken
- Searching "beef" → Get: beef chuck, ground beef, beef sirloin, beef brisket
- No more processed junk foods in top 10 results

**Integration:**
- Used by [QuickAddFood.tsx](macro-tracker/components/QuickAddFood.tsx) and [FoodSearch.tsx](macro-tracker/components/FoodSearch.tsx)
- Called via `/api/usda?query=...` endpoint in [route.ts](macro-tracker/app/api/usda/route.ts)
- Results cached in Supabase `food_items` table

## What

**User-Visible Behavior:**

Before:
```
User searches: "chicken"
Results: Chicken nuggets, Chicken breadcrumbs, Chicken patty, Fried chicken with batter
```

After:
```
User searches: "chicken"
Results: Chicken breast (raw), Chicken thigh (cooked), Chicken drumstick (roasted), Ground chicken
```

**Technical Requirements:**

1. **Query Expansion:** Detect single-word protein searches and expand to specific cuts
2. **Parallel API Calls:** Use `Promise.all()` to query all expansions simultaneously
3. **Deduplication:** Merge results and remove duplicates by USDA FDC ID
4. **Enhanced Scoring:** Heavily favor whole foods, penalize processed items
5. **Backward Compatibility:** Multi-word queries work exactly as before
6. **Performance:** Maintain <2s response time for cold searches, <100ms for cached

### Success Criteria

- [x] Single-word searches expand to specific cuts (chicken → chicken breast, chicken thigh, etc.)
- [x] Multi-word searches do NOT expand (chicken breast → no expansion)
- [x] Parallel API calls complete in <2 seconds
- [x] No duplicate FDC IDs in results
- [x] Processed foods ranked below whole foods or excluded entirely
- [x] Cache stores all expanded query results
- [x] All existing tests pass
- [x] TypeScript compiles with no errors
- [x] Linting passes with no errors

## All Needed Context

### Documentation & References

```yaml
USDA API Documentation:
  - url: https://fdc.nal.usda.gov/api-guide.html
    why: Official API documentation for search endpoint
    critical: "Rate limit is 1,000 requests/hour per IP. Use pageSize=50 for better filtering pool."

  - url: https://api.nal.usda.gov/fdc/v1/foods/search
    why: Search endpoint we're enhancing
    parameters: "query, dataType (SR Legacy), pageSize, api_key"

SR Legacy Database Info:
  - url: https://www.ars.usda.gov/arsuserfiles/80400525/data/sr-legacy/sr-legacy_doc.pdf
    why: Naming conventions for meats
    critical: "Uses hierarchical comma-delimited structure: 'Chicken, broilers or fryers, breast, meat only, raw'"

Current Implementation:
  - file: macro-tracker/lib/api/usda.ts
    why: Main file to modify - contains searchFoods(), filterAndSortResults(), normalizeUSDAFood()
    pattern: "Already has caching, basic filtering, scoring system"

  - file: macro-tracker/types/usda.ts
    why: Type definitions for USDA API responses
    usage: "USDASearchResponse, USDASearchResult, USDANutrient"

  - file: macro-tracker/types/macros.ts
    why: FoodItem interface that we return
    critical: "FoodItem has usda_fdc_id as unique identifier for deduplication"

  - file: macro-tracker/app/api/usda/route.ts
    why: API route handler that calls searchFoods()
    contract: "GET /api/usda?query={query} → { success: true, foods: FoodItem[] }"
```

### Current Codebase Structure

```
macro-tracker/
├── lib/
│   └── api/
│       └── usda.ts              ← MODIFY THIS FILE
├── types/
│   ├── usda.ts                  ← Read for types
│   └── macros.ts                ← Read for FoodItem interface
├── app/
│   └── api/
│       └── usda/
│           └── route.ts         ← Read to understand API contract
├── components/
│   ├── QuickAddFood.tsx         ← Frontend consumer (no changes)
│   └── FoodSearch.tsx           ← Frontend consumer (no changes)
└── package.json
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: USDA SR Legacy Naming Patterns
// Chicken: "Chicken, broilers or fryers, [cut], meat only/meat and skin, raw/cooked, [method]"
// Beef: "Beef, [cut], [grade], raw/cooked"
// Fish: "Fish, [species], [cut], raw/cooked"
// Turkey: "Turkey, [cut], meat only/meat and skin, raw/cooked"
// Pork: "Pork, [cut], [grade], raw/cooked"

// GOTCHA: Single words don't match hierarchical names well
// Search "chicken" → Misses "Chicken, broilers or fryers, breast, meat only, raw"
// Solution: Expand "chicken" to ["chicken", "chicken breast", "chicken thigh", etc.]

// GOTCHA: Must preserve original query in expansion array
// Why: Backward compatibility - some entries might match "chicken" directly
// Example: expandQuery("chicken") → ["chicken", "chicken breast", "chicken thigh", ...]

// GOTCHA: Don't expand if already specific (multi-word)
// "chicken breast" should NOT expand → already specific
// "chicken" should expand → too generic

// CRITICAL: USDA FDC ID is the unique key, not food name
// Same food can appear with slight variations in different searches
// Must deduplicate by usda_fdc_id field from FoodItem

// GOTCHA: Use Promise.all() for parallel calls, NOT sequential await in loop
// Bad:  for (let q of queries) { results.push(await fetch(q)) }  // Sequential!
// Good: await Promise.all(queries.map(q => fetch(q)))           // Parallel!

// GOTCHA: Cache AFTER filtering/sorting, not raw USDA responses
// Why: We want cached results to be pre-filtered and ready to use

// GOTCHA: Handle partial API failures gracefully
// If one expanded query fails (e.g., "ground chicken" times out)
// Continue with other successful queries, don't fail entire request

// NEXT.JS SPECIFICS:
// - This is server-side code (imported by route.ts API handler)
// - Environment variables available via process.env
// - Can use fetch() directly (Node 18+ / Next.js provides it)
// - TypeScript strict mode enabled (see tsconfig.json)

// PERFORMANCE:
// - USDA API rate limit: 1,000 req/hour per IP (free tier)
// - 5 parallel requests for "chicken" = 5 quota usage
// - Caching is CRITICAL to avoid hitting limits
// - Supabase upsert handles cache updates efficiently
```

## Implementation Blueprint

### Data Models & Structures (No new types needed)

We're using existing types from the codebase:
- `FoodItem` from [macro-tracker/types/macros.ts](macro-tracker/types/macros.ts:14-25)
- `USDASearchResponse` from [macro-tracker/types/usda.ts](macro-tracker/types/usda.ts:16-21)

**Key field for deduplication:** `usda_fdc_id: string` in FoodItem

### Task List (in order of completion)

```yaml
Task 1: Create COMMON_FOOD_EXPANSIONS mapping
  Description: Define expansion rules for common single-word protein searches
  Location: macro-tracker/lib/api/usda.ts (top of file, after imports)
  Pattern: TypeScript const object mapping string to string array

Task 2: Implement expandQuery() function
  Description: Detect single-word queries and expand using mapping
  Location: macro-tracker/lib/api/usda.ts (before searchFoods function)
  Logic: Check if single-word, normalize case, return expanded array or original

Task 3: Implement deduplicateFoods() function
  Description: Remove duplicate foods by USDA FDC ID
  Location: macro-tracker/lib/api/usda.ts (before searchFoods function)
  Logic: Use Map keyed by usda_fdc_id, keep first occurrence

Task 4: Enhance filterAndSortResults() scoring
  Description: Add whole food bonuses and processed food penalties
  Location: macro-tracker/lib/api/usda.ts (modify existing function)
  Changes: Add scoring rules for anatomy words, whole food indicators, processed penalties

Task 5: Modify searchFoods() to use query expansion
  Description: Implement parallel expanded queries with Promise.all()
  Location: macro-tracker/lib/api/usda.ts (modify existing function)
  Changes: Expand query, make parallel API calls, merge and deduplicate results

Task 6: Update cache logic to handle expanded queries
  Description: Check cache for all expanded queries, cache all results
  Location: macro-tracker/lib/api/usda.ts (within searchFoods function)
  Pattern: Query cache with OR conditions for multiple expanded queries

Task 7: Add error handling for partial API failures
  Description: Handle individual query failures gracefully
  Location: macro-tracker/lib/api/usda.ts (within searchFoods function)
  Pattern: Use Promise.allSettled() or try-catch per query
```

### Task 1: COMMON_FOOD_EXPANSIONS Mapping

```typescript
// Add after imports, before searchFoods function
const COMMON_FOOD_EXPANSIONS: Record<string, string[]> = {
  // Chicken variations
  chicken: [
    'chicken',
    'chicken breast',
    'chicken thigh',
    'chicken drumstick',
    'chicken leg',
    'ground chicken'
  ],

  // Beef variations
  beef: [
    'beef',
    'beef chuck',
    'ground beef',
    'beef sirloin',
    'beef brisket',
    'beef tenderloin'
  ],

  // Pork variations
  pork: [
    'pork',
    'pork chop',
    'pork tenderloin',
    'ground pork',
    'pork shoulder',
    'pork loin'
  ],

  // Turkey variations
  turkey: [
    'turkey',
    'turkey breast',
    'ground turkey',
    'turkey thigh',
    'turkey leg'
  ],

  // Fish variations (generic)
  fish: [
    'fish',
    'salmon',
    'tilapia',
    'cod',
    'tuna',
    'mahi'
  ],

  // Specific fish
  salmon: [
    'salmon',
    'salmon fillet',
    'salmon steak'
  ],

  tuna: [
    'tuna',
    'tuna steak',
    'tuna fillet'
  ]
};
```

### Task 2: expandQuery() Function

```typescript
/**
 * Expands single-word protein queries into specific cut searches
 * Multi-word queries are not expanded (assumed already specific)
 *
 * @example
 * expandQuery("chicken") → ["chicken", "chicken breast", "chicken thigh", ...]
 * expandQuery("chicken breast") → ["chicken breast"] (no expansion)
 * expandQuery("rice") → ["rice"] (not in expansion map)
 */
function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();

  // Don't expand if multi-word (already specific)
  if (normalized.includes(' ')) {
    return [query];
  }

  // Check if we have expansion rules for this query
  if (COMMON_FOOD_EXPANSIONS[normalized]) {
    return COMMON_FOOD_EXPANSIONS[normalized];
  }

  // No expansion needed, return original
  return [query];
}
```

### Task 3: deduplicateFoods() Function

```typescript
/**
 * Removes duplicate foods by USDA FDC ID
 * Keeps first occurrence of each unique FDC ID
 *
 * CRITICAL: USDA FDC ID is the unique identifier, not food name
 * Same food can appear with slight variations across queries
 */
function deduplicateFoods(foods: FoodItem[]): FoodItem[] {
  const seen = new Map<string, FoodItem>();

  for (const food of foods) {
    // Keep first occurrence only
    if (!seen.has(food.usda_fdc_id)) {
      seen.set(food.usda_fdc_id, food);
    }
  }

  return Array.from(seen.values());
}
```

### Task 4: Enhanced Scoring in filterAndSortResults()

```typescript
// MODIFY existing filterAndSortResults function
// ADD these scoring rules AFTER existing score calculations (around line 115)

function filterAndSortResults(foods: any[], query: string): FoodItem[] {
  const queryLower = query.toLowerCase().trim();

  // Existing exclude words - ADD these processed penalties
  const excludeWords = [
    'snack', 'cracker', 'chip', 'cookie', 'cake', 'candy', 'cereal',
    'bar', 'mix', 'prepared', 'frozen meal', 'instant', 'canned',
    'with sauce', 'flavored', 'seasoned', 'enriched', 'fortified',
    // NEW: Stronger processed food indicators
    'breaded', 'nugget', 'patty', 'battered', 'fried with coating',
    'processed', 'formed', 'restructured'
  ];

  // ... existing filter logic ...

  const scored = filtered.map(food => {
    const nameLower = food.name.toLowerCase();
    let score = 0;

    // ... existing scoring logic (exact match, starts with, word matches, comma penalty) ...

    // NEW: Whole food indicators (strong positive signals)
    if (nameLower.includes('raw') || nameLower.includes('cooked') ||
        nameLower.includes('roasted') || nameLower.includes('broiled') ||
        nameLower.includes('grilled') || nameLower.includes('baked')) {
      score += 200;
    }

    // NEW: Anatomy words (specific cuts = whole food)
    const anatomyWords = [
      'breast', 'thigh', 'leg', 'drumstick', 'wing',
      'chuck', 'sirloin', 'tenderloin', 'brisket', 'round',
      'chop', 'loin', 'shoulder', 'shank',
      'fillet', 'steak'
    ];
    if (anatomyWords.some(word => nameLower.includes(word))) {
      score += 150;
    }

    // NEW: Ground meat bonus (whole food)
    if (nameLower.includes('ground')) {
      score += 150;
    }

    // NEW: Common meat types
    if (nameLower.includes('broilers or fryers')) { // Most common chicken type
      score += 100;
    }

    // NEW: Simpler preparation bonus
    if (nameLower.includes('meat only')) {
      score += 75;
    }

    // NEW: Processed food penalties (strong negative signals)
    if (nameLower.includes('breaded') || nameLower.includes('nugget') ||
        nameLower.includes('patty') || nameLower.includes('battered') ||
        nameLower.includes('processed') || nameLower.includes('formed')) {
      score -= 500;
    }

    return { food, score };
  });

  // ... existing sort and slice logic ...
}
```

### Task 5: Modify searchFoods() for Query Expansion

```typescript
// MODIFY existing searchFoods function
export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  // NEW: Expand query into multiple specific searches
  const expandedQueries = expandQuery(query);

  const supabase = createClient();

  // MODIFIED: Check cache for ALL expanded queries
  const cacheChecks = expandedQueries.map(async (q) => {
    const { data } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(10);
    return data || [];
  });

  const cachedResults = (await Promise.all(cacheChecks)).flat();

  if (cachedResults.length > 0) {
    // Deduplicate and return cached results
    const deduplicated = deduplicateFoods(cachedResults);
    return filterAndSortResults(deduplicated, query);
  }

  // NEW: Make parallel API calls for all expanded queries
  const apiCalls = expandedQueries.map(async (q) => {
    try {
      const url = new URL(`${USDA_API_BASE}/foods/search`);
      url.searchParams.set('query', q);
      url.searchParams.set('dataType', 'SR Legacy');
      url.searchParams.set('pageSize', '50');
      if (USDA_API_KEY) {
        url.searchParams.set('api_key', USDA_API_KEY);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.warn(`USDA API error for query "${q}": ${response.status}`);
        return []; // Return empty array on failure, don't fail entire request
      }

      const data: USDASearchResponse = await response.json();
      return data.foods.map(normalizeUSDAFood);
    } catch (error) {
      console.warn(`Failed to fetch USDA data for query "${q}":`, error);
      return []; // Graceful degradation
    }
  });

  // Wait for all API calls to complete
  const allResults = (await Promise.all(apiCalls)).flat();

  // NEW: Deduplicate by FDC ID before filtering
  const deduplicated = deduplicateFoods(allResults);

  // Filter and sort
  const filtered = filterAndSortResults(deduplicated, query);

  // Cache all results (not just filtered top 10)
  if (deduplicated.length > 0) {
    await supabase.from('food_items').upsert(deduplicated as any, {
      onConflict: 'usda_fdc_id',
      ignoreDuplicates: false
    });
  }

  return filtered;
}
```

### Integration Points

```yaml
NO CHANGES REQUIRED:
  - Frontend components (QuickAddFood.tsx, FoodSearch.tsx) - Already use correct API
  - API route (route.ts) - Already calls searchFoods() correctly
  - Database schema - Already has unique constraint on usda_fdc_id
  - Type definitions - Already support all required fields

ENVIRONMENT VARIABLES:
  - USDA_API_KEY: Optional but recommended to avoid rate limit issues
  - Already used in current implementation
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# Run these FIRST before any testing
cd macro-tracker

# TypeScript compilation check
npx tsc --noEmit

# Expected: No errors
# If errors: Read carefully, fix type issues, re-run

# Linting check
npm run lint

# Expected: No errors or warnings
# If errors: Fix linting issues (usually formatting/unused vars)
```

### Level 2: Manual Testing (No automated tests exist)

Since the project doesn't have a test suite (no jest/vitest in package.json), we'll do manual validation:

```bash
# Terminal 1: Start dev server
cd macro-tracker
npm run dev

# Terminal 2: Test queries with curl (once server is running)

# Test 1: Single-word protein query (should expand)
curl "http://localhost:3000/api/usda?query=chicken"
# Expected: { "success": true, "foods": [...] }
# Verify: Top results should be chicken breast, chicken thigh, chicken drumstick
# Verify: NO chicken nuggets, chicken patties, breaded chicken in top 10

# Test 2: Multi-word query (should NOT expand)
curl "http://localhost:3000/api/usda?query=chicken%20breast"
# Expected: { "success": true, "foods": [...] }
# Verify: Results are specifically about chicken breast
# Verify: Behavior identical to before implementation

# Test 3: Beef query expansion
curl "http://localhost:3000/api/usda?query=beef"
# Expected: Top results are beef chuck, ground beef, beef sirloin
# Verify: NO beef patties, beef jerky, processed beef products

# Test 4: Non-expanded query (not in mapping)
curl "http://localhost:3000/api/usda?query=rice"
# Expected: Regular rice results, no expansion
# Verify: Behavior identical to before implementation

# Test 5: Empty query
curl "http://localhost:3000/api/usda?query="
# Expected: { "success": false, "error": "Query parameter required" }

# Test 6: Performance check (should complete in <2 seconds)
time curl "http://localhost:3000/api/usda?query=chicken"
# Expected: real time < 2s for cold search

# Test 7: Cache check (second request should be instant)
time curl "http://localhost:3000/api/usda?query=chicken"
# Expected: real time < 0.5s (cached)
```

### Level 3: Data Validation

```bash
# Verify no duplicate FDC IDs in results
curl "http://localhost:3000/api/usda?query=chicken" | \
  jq '.foods | group_by(.usda_fdc_id) | map(select(length > 1))'
# Expected: [] (empty array, no duplicates)

# Verify all results have required fields
curl "http://localhost:3000/api/usda?query=chicken" | \
  jq '.foods[] | {usda_fdc_id, name, calories: .calories_per_100g}'
# Expected: All entries have non-null values

# Verify scoring works (whole foods ranked higher)
curl "http://localhost:3000/api/usda?query=chicken" | \
  jq '.foods[0:3] | .[].name'
# Expected: Names should contain anatomy words (breast, thigh, drumstick)
# Should NOT see: nugget, patty, breaded, formed
```

### Level 4: Frontend Integration Test

```bash
# Start dev server if not already running
npm run dev

# Open browser to: http://localhost:3000
# Navigate to the macro tracker food search component
# Test these scenarios:

1. Search "chicken" in food search
   ✓ Results show chicken breast, thigh, drumstick
   ✓ No processed foods in top results
   ✓ Can click and add to meal

2. Search "chicken breast" in food search
   ✓ Results are specific to chicken breast
   ✓ Behavior same as before

3. Search "salmon" in food search
   ✓ Results show salmon fillet, salmon steak
   ✓ Whole fish options appear

4. Search "broccoli" in food search
   ✓ Still works (not affected by expansion)
```

## Final Validation Checklist

- [ ] TypeScript compiles with no errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Single-word protein queries expand correctly (chicken, beef, pork, turkey, fish, salmon, tuna)
- [ ] Multi-word queries do NOT expand (chicken breast, ground beef)
- [ ] No duplicate FDC IDs in results
- [ ] Whole foods ranked higher than processed foods
- [ ] API response time <2s for cold search
- [ ] Cache works (second search <500ms)
- [ ] Empty query returns error
- [ ] Frontend integration works (can search and add foods)
- [ ] Backward compatibility maintained (existing searches work)
- [ ] File stays under 500 lines (target: 250-295 lines)
- [ ] Error handling works (one failed query doesn't break entire search)

---

## Anti-Patterns to Avoid

- ❌ Don't expand multi-word queries - they're already specific
- ❌ Don't use sequential `await` in loop - use `Promise.all()` for parallel calls
- ❌ Don't cache raw USDA responses - cache filtered and sorted results
- ❌ Don't deduplicate by name - use USDA FDC ID as unique key
- ❌ Don't fail entire request if one expanded query fails - graceful degradation
- ❌ Don't modify frontend components - only touch usda.ts
- ❌ Don't change API contract - keep GET /api/usda?query={query} → { success, foods }
- ❌ Don't add new dependencies - use existing libraries only
- ❌ Don't add new types - use existing FoodItem and USDA types
- ❌ Don't skip error handling - log warnings and continue with partial results

---

## Expected File Changes Summary

**Files Modified: 1**
- [macro-tracker/lib/api/usda.ts](macro-tracker/lib/api/usda.ts) (145 → ~250-295 lines)

**Files Created: 0**

**Files Deleted: 0**

**Database Changes: 0**

**API Contract Changes: 0**

**Breaking Changes: 0**

---

## PRP Quality Score: 9/10

**Confidence Level: Very High** - One-pass implementation success expected

**Why 9/10:**
- ✅ Comprehensive context provided (existing code, types, API patterns)
- ✅ Clear implementation path with pseudocode and real patterns
- ✅ Executable validation gates (TypeScript, linting, manual tests)
- ✅ Error handling documented with graceful degradation patterns
- ✅ Gotchas explicitly called out with examples
- ✅ Backward compatibility explicitly preserved
- ✅ Performance considerations documented
- ✅ Real examples from codebase referenced with line numbers
- ⚠️  -1 point: No automated test suite exists (manual testing required)

**Risk Factors:**
- Low: No automated tests, but manual validation is thorough
- Low: USDA API rate limits (mitigated by caching strategy)
- Very Low: Breaking changes (explicitly preserved backward compatibility)

**Time Estimate:** 30-45 minutes for experienced developer

---

## Quick Reference

**Key Functions to Add:**
1. `COMMON_FOOD_EXPANSIONS` - Mapping object
2. `expandQuery(query: string): string[]`
3. `deduplicateFoods(foods: FoodItem[]): FoodItem[]`

**Key Functions to Modify:**
1. `searchFoods(query: string)` - Add expansion logic and parallel calls
2. `filterAndSortResults(foods, query)` - Add enhanced scoring rules

**Key Patterns to Follow:**
- Use `Promise.all()` for parallel API calls
- Use `Map<string, FoodItem>` for deduplication by FDC ID
- Use `console.warn()` for non-critical errors (graceful degradation)
- Preserve original query in expansion array for backward compatibility

**Key Files to Reference:**
- [macro-tracker/lib/api/usda.ts](macro-tracker/lib/api/usda.ts) - Main implementation
- [macro-tracker/types/macros.ts](macro-tracker/types/macros.ts:14-25) - FoodItem interface
- [macro-tracker/types/usda.ts](macro-tracker/types/usda.ts:16-21) - USDA response types
