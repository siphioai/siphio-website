# 🚀 Food Search System - Deployment Checklist

Use this checklist to deploy the new hybrid food search system to production.

## Pre-Deployment (Development Environment)

### ✅ 1. Environment Setup
- [ ] Create `.env.local` with all required variables:
  - [ ] `ANTHROPIC_API_KEY` (for AI curation)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_USDA_API_KEY`

### ✅ 2. Install Dependencies
```bash
cd macro-tracker
npm install
```
- [ ] Verify `@anthropic-ai/sdk` is installed
- [ ] Verify `tsx` is installed
- [ ] All dependencies installed without errors

### ✅ 3. Database Migration
```bash
npx supabase db reset
```
- [ ] Migration `014_curated_foods_system.sql` applied successfully
- [ ] Tables created: `curated_foods`, `food_search_analytics`, `curated_food_feedback`
- [ ] Indexes created and verified
- [ ] RLS policies enabled
- [ ] Sample data inserted

### ✅ 4. Generate Curated Foods

**Option A: Quick Test**
```bash
npm run curate-foods -- --category=chicken
```
- [ ] 25 chicken variations generated
- [ ] Exported to `data/curated-foods/chicken-YYYY-MM-DD.json`
- [ ] Imported to database successfully

**Option B: Essential Categories**
```bash
npm run curate-foods -- --category=chicken
npm run curate-foods -- --category=salmon
npm run curate-foods -- --category=beef
npm run curate-foods -- --category=eggs
npm run curate-foods -- --category=vegetables
npm run curate-foods -- --category=fruits
npm run curate-foods -- --category=grains
```
- [ ] ~150 foods generated across categories
- [ ] All exports created
- [ ] All imported to database

**Option C: Full Database (Recommended for Production)**
```bash
npm run curate-foods -- --all
```
- [ ] ~500 foods generated
- [ ] All categories covered
- [ ] Exported to JSON
- [ ] Imported to database
- [ ] Verification: Query database shows 500+ foods

### ✅ 5. Run Tests
```bash
npm run test-search
```
- [ ] Parser tests: PASSED
- [ ] Search tests: PASSED
- [ ] Performance tests: PASSED (<1000ms average)
- [ ] All tests green

### ✅ 6. Local Testing
```bash
npm run dev
```
- [ ] Dev server starts without errors
- [ ] Navigate to food search page
- [ ] Search for "chicken" returns distinct results
- [ ] Search for "salmon" returns distinct results
- [ ] Search speed <200ms
- [ ] Select and add food works correctly
- [ ] Serving size selector works
- [ ] Analytics tracking (check `food_search_analytics` table)

## Production Deployment

### ✅ 7. Production Database Setup

**Supabase Dashboard**:
- [ ] Navigate to SQL Editor
- [ ] Run migration `014_curated_foods_system.sql`
- [ ] Verify tables created
- [ ] Verify indexes exist
- [ ] Check RLS policies enabled

**Verify Migration**:
```sql
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE tablename IN ('curated_foods', 'food_search_analytics', 'curated_food_feedback');

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'curated_foods';

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'curated_foods';
```
- [ ] All checks pass

### ✅ 8. Generate Production Food Data

**Connect to Production**:
```bash
# Update .env.local to point to production Supabase
# Or use Supabase CLI link

npm run curate-foods -- --all
```
- [ ] ~500 foods generated
- [ ] Imported to production database
- [ ] Backup JSON files saved

**Verify Data**:
```sql
SELECT category, COUNT(*) as count
FROM curated_foods
GROUP BY category
ORDER BY category;
```
- [ ] Results show food distribution across categories
- [ ] Total count ~500+

### ✅ 9. Environment Variables (Production)

**Vercel/Deployment Platform**:
- [ ] `ANTHROPIC_API_KEY` set
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (production)
- [ ] `NEXT_PUBLIC_USDA_API_KEY` set

### ✅ 10. Code Deployment

**Update Components**:
- [ ] Replace `FoodSearch` with `FoodSearchHybrid` in all pages
- [ ] Add `userId` prop for analytics (optional)
- [ ] Test component renders correctly

**Build and Deploy**:
```bash
npm run build
```
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Deploy to production (Vercel/etc)
- [ ] Deployment successful

### ✅ 11. Production Smoke Tests

**Test Search Functionality**:
- [ ] Navigate to food search page
- [ ] Search "chicken" → Returns distinct variations
- [ ] Search "salmon" → Returns distinct variations
- [ ] Search "rice" → Returns grain varieties
- [ ] Search "broccoli" → Returns vegetable results

**Test Performance**:
- [ ] Open DevTools Network tab
- [ ] Search for common food
- [ ] API response time <500ms
- [ ] UI responsive, no lag
- [ ] Results display correctly

**Test Analytics**:
```sql
-- Check analytics are being tracked
SELECT COUNT(*) FROM food_search_analytics
WHERE searched_at > NOW() - INTERVAL '1 hour';
```
- [ ] Analytics being recorded
- [ ] Search times logged
- [ ] Selection tracking works

### ✅ 12. User Acceptance Testing

**Real User Flow**:
- [ ] User can search for food
- [ ] Results are clear and distinct
- [ ] User can select correct variation
- [ ] Serving sizes work correctly
- [ ] Food added to meal successfully
- [ ] Macros calculated correctly

**Edge Cases**:
- [ ] Short query (2 characters) works
- [ ] Non-existent food returns empty
- [ ] Special characters handled
- [ ] Very long query handled

### ✅ 13. Monitoring Setup

**Database Monitoring**:
```sql
-- Create view for search analytics
CREATE OR REPLACE VIEW search_performance AS
SELECT
  DATE(searched_at) as date,
  source,
  AVG(search_duration_ms) as avg_duration_ms,
  COUNT(*) as search_count
FROM food_search_analytics
GROUP BY DATE(searched_at), source
ORDER BY date DESC;
```
- [ ] View created
- [ ] Can query performance data

**Alerting** (Optional):
- [ ] Set up alerts for slow searches (>1000ms)
- [ ] Set up alerts for high USDA fallback rate (>30%)
- [ ] Set up alerts for errors

## Post-Deployment

### ✅ 14. Week 1 Review

**Analytics Review**:
```sql
-- Top searches
SELECT query, COUNT(*) as searches
FROM food_search_analytics
WHERE searched_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY searches DESC
LIMIT 20;

-- Curated vs USDA usage
SELECT
  source,
  COUNT(*) as searches,
  AVG(search_duration_ms) as avg_speed_ms
FROM food_search_analytics
WHERE searched_at > NOW() - INTERVAL '7 days'
GROUP BY source;
```
- [ ] Review top searches
- [ ] Check curated hit rate (target >70%)
- [ ] Verify performance (target <300ms average)
- [ ] Identify missing foods

**Action Items**:
- [ ] Add top searched foods to curated DB
- [ ] Address any performance issues
- [ ] Review user feedback (if any)

### ✅ 15. Monthly Maintenance

**Database Growth**:
```sql
-- Check database size
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as indexes_size
FROM pg_catalog.pg_statio_user_tables
WHERE relname IN ('curated_foods', 'food_search_analytics')
ORDER BY pg_total_relation_size(relid) DESC;
```
- [ ] Monitor table sizes
- [ ] Archive old analytics if needed

**Curated Foods Expansion**:
- [ ] Review analytics for missing foods
- [ ] Generate new categories as needed
- [ ] Target: Expand to 1000+ foods

**Quality Control**:
- [ ] Review user feedback
- [ ] Fix incorrect data
- [ ] Update macros if needed

## Rollback Plan (Just in Case)

If something goes wrong:

### ✅ Quick Rollback
```bash
# Revert to old component
git checkout HEAD~1 -- components/FoodSearch.tsx

# Redeploy
npm run build
# Deploy
```

### ✅ Database Rollback
```sql
-- Disable new search (use USDA only)
-- Just stop using hybrid API endpoint
-- Old /api/usda endpoint still works
```

## Success Criteria

### Minimum Requirements (Before Going Live)
- [ ] Database migration successful
- [ ] At least 100 curated foods generated
- [ ] All tests passing
- [ ] Local testing successful
- [ ] Production deployment successful
- [ ] Smoke tests pass

### Optimal Requirements (Recommended)
- [ ] 500+ curated foods generated
- [ ] All major categories covered
- [ ] <200ms average search time
- [ ] >80% curated hit rate
- [ ] Analytics tracking working
- [ ] User testing positive

## Notes

**Date Started**: _________________

**Date Deployed**: _________________

**Team Members**:
- Developer: _________________
- QA: _________________
- Product: _________________

**Production URLs**:
- App: _________________
- Supabase: _________________
- Analytics: _________________

**Issues Found**: (use separate tracking)

**Improvements Needed**: (use separate tracking)

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Overall Progress**: _____ / 15 Sections Complete
