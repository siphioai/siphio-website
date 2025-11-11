# Complete Application Functionality Audit & Bug Fixes

## FEATURE:

Fix all critical database integration bugs and incomplete functionality discovered through comprehensive full-stack analysis.

**Problem:**
- Settings page completely broken - queries use wrong database column names (auth_user_id instead of auth_id)
- Data export/delete functionality references non-existent tables (daily_goals, food_logs)
- Backend API has no authentication validation - security vulnerability
- Privacy and Terms pages linked but don't exist (404 errors)
- CORS configuration has hardcoded placeholder domains
- No proper error handling or user feedback for failed operations

**Solution:**
- Fix all database queries to use correct column name: auth_id (not auth_user_id)
- Update data export to query actual tables: macro_goals, meals, meal_items, daily_summary
- Implement JWT token validation in FastAPI backend
- Create basic Privacy Policy and Terms of Service pages
- Configure CORS using environment variables
- Add comprehensive error handling with user-friendly messages
- Add loading states for long-running operations

**Expected Behavior After Implementation:**
- Settings page loads successfully and displays user profile
- Profile name updates persist to database
- Theme, measurement units, and calendar preferences save correctly
- Data export downloads complete JSON with all user data (goals, meals, items, summaries, favorites)
- Account deletion removes all user data and signs out user
- Backend API rejects requests without valid JWT tokens
- Users cannot access other users' data via API
- Privacy and Terms links navigate to actual pages (not 404)
- All operations show loading indicators and success/error feedback

---

## EXAMPLES:

**Database Schema Reference:**
```sql
-- CORRECT column name (from migration 006)
ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;

-- CORRECT table names (from migration 001)
CREATE TABLE macro_goals (...);  -- NOT daily_goals
CREATE TABLE meals (...);        -- part of food logging
CREATE TABLE meal_items (...);   -- NOT food_logs
CREATE TABLE daily_summary (...);
```

**Current Broken Code:**
```typescript
// ❌ WRONG - ProfileSection.tsx line 35
.eq('auth_user_id', user.id)  // Column doesn't exist!

// ❌ WRONG - DataPrivacySection.tsx line 34
supabase.from('daily_goals').select('*')  // Table doesn't exist!
supabase.from('food_logs').select('*')    // Table doesn't exist!
```

**Correct Fixed Code:**
```typescript
// ✅ CORRECT - Use actual column name
.eq('auth_id', user.id)

// ✅ CORRECT - Use actual table names
supabase.from('macro_goals').select('*')
supabase.from('meals').select('*')
supabase.from('meal_items').select('*')
```

**Backend Auth Implementation Example:**
```python
from fastapi import Header, HTTPException, Depends
from supabase import create_client

async def verify_jwt_token(authorization: str = Header(...)):
    """Validate Supabase JWT and extract user_id"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")
    supabase = get_supabase_client()

    # Verify token with Supabase
    user = await supabase.auth.get_user(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")

    # Look up internal user_id
    result = await supabase.from("users").select("id").eq("auth_id", user.id).single()
    if not result.data:
        raise HTTPException(404, "User not found")

    return result.data["id"]

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(verify_jwt_token)  # ✅ Validated from JWT
):
    # user_id is now secure - no spoofing possible
```

---

## DOCUMENTATION:

**MCP Server Tools (Required):**
- **ARCHON MCP Server** - Use for:
  - Querying Pydantic AI documentation and code examples via RAG
  - Task management and workflow tracking
  - Best practices and pattern extraction
  - Tool: `mcp__archon` (search documentation, get code examples)

- **Supabase MCP Server** - Use for:
  - Reading database table schemas and structure
  - Querying existing data to understand relationships
  - Validating column names and table references
  - Tool: Use Supabase MCP tools for table inspection

**UI/UX Component Requirements:**
- **shadcn/ui Components** - Required for all UI changes:
  - Use existing shadcn components from `macro-tracker/components/ui/`
  - Available components: Button, Card, Input, Select, Dialog, Toast, etc.
  - Install new components with: `npx shadcn@latest add [component-name]`
  - Follow shadcn/ui patterns for consistent design system
  - Documentation: https://ui.shadcn.com/docs

**Supabase Documentation:**
- Auth API: https://supabase.com/docs/reference/javascript/auth-getuser
- Database queries: https://supabase.com/docs/reference/javascript/select
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

**FastAPI Documentation:**
- Security: https://fastapi.tiangolo.com/tutorial/security/
- Dependencies: https://fastapi.tiangolo.com/tutorial/dependencies/
- CORS: https://fastapi.tiangolo.com/tutorial/cors/

**Existing Codebase Files:**
- `macro-tracker/components/settings/ProfileSection.tsx` - Needs auth_id fix
- `macro-tracker/components/settings/DataPrivacySection.tsx` - Needs table name fixes
- `macro-tracker/components/settings/DangerZoneSection.tsx` - Needs both fixes
- `macro-tracker/supabase/migrations/006_enable_multi_user_auth.sql` - Shows correct schema
- `api/main.py` - Needs JWT validation
- `api/agent/dependencies.py` - Can add auth dependency here

---

## OTHER CONSIDERATIONS:

**MCP Tool Usage During Implementation:**

Before starting any implementation work:
1. **Use ARCHON MCP Server** to:
   - Query FastAPI security best practices from Pydantic AI documentation
   - Search for JWT validation patterns and examples
   - Look up dependency injection patterns for authentication
   - Find examples of proper error handling in FastAPI

2. **Use Supabase MCP Server** to:
   - Verify the actual column names in the `users` table (confirm `auth_id` exists)
   - Check the schema of `macro_goals`, `meals`, `meal_items`, `daily_summary` tables
   - Validate relationships between tables (meal_items → meals → users)
   - Confirm which tables have `user_id` foreign keys

3. **Use shadcn/ui Components** for:
   - Privacy/Terms pages: Use existing Card, Button components
   - Loading states: Use shadcn Loader2 icon from lucide-react
   - Error messages: Ensure toast notifications use existing Toast component
   - All UI changes must match the existing design system

**Priority 1: Critical Database Fixes (Must Do First)**

1. **Fix auth_id Column Mismatch**
   - Files to update:
     - `macro-tracker/components/settings/ProfileSection.tsx` (lines 35, 58)
     - `macro-tracker/components/settings/DangerZoneSection.tsx` (lines 48, 89)
     - `macro-tracker/components/settings/DataPrivacySection.tsx` (line 21)
   - Find & Replace: `.eq('auth_user_id', user.id)` → `.eq('auth_id', user.id)`
   - Test: Settings page should load without errors

2. **Fix Table Names in Export/Delete**
   - Files to update:
     - `macro-tracker/components/settings/DataPrivacySection.tsx` (lines 34-36)
     - `macro-tracker/components/settings/DangerZoneSection.tsx` (lines 54-56)
   - Replace query logic:
   ```typescript
   // BEFORE (broken)
   const [{ data: goals }, { data: logs }] = await Promise.all([
     supabase.from('daily_goals').select('*').eq('user_id', userId),
     supabase.from('food_logs').select('*').eq('user_id', userId),
   ]);

   // AFTER (working)
   const [
     { data: goals },
     { data: meals },
     { data: summary },
     { data: favorites },
     { data: settings }
   ] = await Promise.all([
     supabase.from('macro_goals').select('*').eq('user_id', userId),
     supabase.from('meals').select('*').eq('user_id', userId),
     supabase.from('daily_summary').select('*').eq('user_id', userId),
     supabase.from('user_favorites').select('*').eq('user_id', userId),
     supabase.from('user_settings').select('*').eq('user_id', userId),
   ]);

   // For meal_items - need to query via meals relationship
   const mealIds = meals?.map(m => m.id) || [];
   const { data: mealItems } = await supabase
     .from('meal_items')
     .select('*')
     .in('meal_id', mealIds);
   ```
   - Update export JSON structure to include all data
   - Test: Export should download complete valid JSON

**Priority 2: Security Fixes (High Priority)**

3. **Implement Backend JWT Validation**
   - Create new file: `api/dependencies/auth.py`
   ```python
   from fastapi import Header, HTTPException
   from api.database.supabase import get_supabase_client

   async def get_current_user_id(authorization: str = Header(...)) -> str:
       """Extract and validate user_id from Supabase JWT token"""
       if not authorization.startswith("Bearer "):
           raise HTTPException(
               status_code=401,
               detail="Invalid authorization header format"
           )

       token = authorization.replace("Bearer ", "")
       supabase = await get_supabase_client()

       try:
           # Verify JWT with Supabase
           user_response = await supabase.auth.get_user(token)
           if not user_response or not user_response.user:
               raise HTTPException(401, "Invalid or expired token")

           auth_id = user_response.user.id

           # Get internal user_id from users table
           user_data = await supabase.from("users") \
               .select("id") \
               .eq("auth_id", auth_id) \
               .single()

           if not user_data.data:
               raise HTTPException(404, "User profile not found")

           return user_data.data["id"]

       except Exception as e:
           raise HTTPException(401, f"Authentication failed: {str(e)}")
   ```

   - Update `api/main.py`:
   ```python
   from api.dependencies.auth import get_current_user_id
   from fastapi import Depends

   # Remove user_id from request body
   class ChatRequest(BaseModel):
       message: str = Field(..., min_length=1, max_length=1000)
       conversation_history: Optional[List[Dict[str, Any]]] = Field(default=[])

   @app.post("/api/chat", response_model=ChatResponse)
   async def chat(
       request: ChatRequest,
       user_id: str = Depends(get_current_user_id)  # ✅ Validated from JWT
   ):
       # user_id is now secure and validated
   ```

   - Update frontend API call in `macro-tracker/app/api/ai/chat/route.ts`:
   ```typescript
   // Get auth token
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   // Call backend with token (no user_id in body)
   const response = await fetch(`${BACKEND_URL}/api/chat`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${session.access_token}`,  // ✅ Send JWT
     },
     body: JSON.stringify({
       message: body.message,
       conversation_history: body.conversation_history,
       // user_id removed - extracted from token in backend
     }),
   });
   ```

4. **Fix CORS Configuration**
   - Update `api/agent/settings.py` to include frontend URL:
   ```python
   class Settings(BaseSettings):
       # ... existing fields ...
       frontend_url: str = Field(
           default="http://localhost:3000",
           description="Frontend application URL"
       )
   ```

   - Update `api/main.py`:
   ```python
   from api.agent.settings import load_settings

   settings = load_settings()

   # Determine allowed origins based on environment
   allowed_origins = [
       "http://localhost:3000",  # Always allow localhost for dev
   ]

   if settings.app_env == "production":
       allowed_origins.append(settings.frontend_url)

   app.add_middleware(
       CORSMiddleware,
       allow_origins=allowed_origins,
       allow_credentials=True,
       allow_methods=["POST"],  # Only POST needed for /api/chat
       allow_headers=["Content-Type", "Authorization"],
       max_age=3600,
   )
   ```

   - Add to `api/.env.example`:
   ```bash
   FRONTEND_URL=https://your-production-domain.com
   ```

**Priority 3: Missing Pages (Medium Priority)**

5. **Create Privacy Policy Page**
   - Create file: `macro-tracker/app/privacy/page.tsx`
   ```tsx
   import { Button } from '@/components/ui/button';
   import { ArrowLeft } from 'lucide-react';
   import Link from 'next/link';

   export default function PrivacyPage() {
     return (
       <div className="min-h-screen bg-secondary/30">
         <div className="container mx-auto max-w-4xl px-4 py-8">
           <Link href="/settings">
             <Button variant="ghost" size="sm">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Back to Settings
             </Button>
           </Link>

           <h1 className="text-4xl font-bold mt-8 mb-6">Privacy Policy</h1>
           <div className="prose prose-slate dark:prose-invert max-w-none">
             {/* Add privacy policy content */}
             <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
             {/* ... basic privacy content ... */}
           </div>
         </div>
       </div>
     );
   }
   ```

6. **Create Terms of Service Page**
   - Create file: `macro-tracker/app/terms/page.tsx`
   - Similar structure to privacy page

**Priority 4: UX Improvements (Lower Priority)**

7. **Add Loading States**
   - Update `DataPrivacySection.tsx`:
   ```typescript
   const [exporting, setExporting] = useState(false);

   const handleExportData = async () => {
     try {
       setExporting(true);
       // ... export logic ...
     } finally {
       setExporting(false);
     }
   };

   <Button disabled={exporting}>
     {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
     {exporting ? 'Exporting...' : 'Export'}
   </Button>
   ```

8. **Improve Error Messages**
   - Add error mapping utility:
   ```typescript
   function getUserFriendlyError(error: any): string {
     if (error.message?.includes('not found')) {
       return 'Data not found. Please try refreshing the page.';
     }
     if (error.message?.includes('auth')) {
       return 'Authentication error. Please sign out and back in.';
     }
     if (error.code === 'PGRST116') {
       return 'No data available to export.';
     }
     return error.message || 'An unexpected error occurred';
   }

   // Use in catch blocks
   catch (error: any) {
     const userMessage = getUserFriendlyError(error);
     toast.error(userMessage);
     console.error('Full error:', error);
   }
   ```

**Testing Requirements:**

Manual Test Checklist:
- [ ] Settings page loads without console errors
- [ ] Profile section displays user name and email
- [ ] Profile name can be edited and saved
- [ ] Theme toggle updates database and applies immediately
- [ ] Measurement units and calendar preferences save
- [ ] Export data downloads complete JSON file
- [ ] Exported JSON has all tables: user, macro_goals, meals, meal_items, daily_summary, favorites, settings
- [ ] Delete account requires typing "DELETE"
- [ ] Delete account with export downloads data first
- [ ] Delete account removes user from database
- [ ] User is signed out after account deletion
- [ ] Backend rejects requests without Authorization header (401)
- [ ] Backend rejects requests with invalid JWT (401)
- [ ] Backend accepts requests with valid JWT
- [ ] Privacy link goes to /privacy page (not 404)
- [ ] Terms link goes to /terms page (not 404)
- [ ] All operations show loading indicators
- [ ] All operations show success/error toasts

**Edge Cases to Handle:**
- User has no settings row → Auto-created by trigger (already exists in migration 009)
- Network error during save → Show error, don't update UI
- Export with no data → Return empty arrays, not null
- Delete account network failure → Don't sign out user
- Invalid JWT token → Return 401 with clear message
- meal_items query → Must join via meals table (no direct user_id)
- Browser blocks download → Show error message
- SessionStorage full → Handle quota exceeded error

**Performance Considerations:**
- Export queries run in parallel with Promise.all
- Large datasets stream to file, not loaded into memory
- Auth validation caches user lookup (consider adding cache)
- Real-time subscriptions not needed for settings page

**Security Considerations:**
- Never expose Supabase service key to frontend
- JWT tokens validated on every backend request
- RLS policies enforce user isolation at database level
- Export only includes data user owns (enforced by RLS)
- Delete account respects CASCADE relationships
- No user_id spoofing possible with JWT validation

**Rollback Plan:**
If critical issues arise:
1. Database fixes: Revert component files, settings page becomes non-functional
2. Backend auth: Remove middleware temporarily, redeploy without auth
3. Frontend: Temporarily hide settings link if page crashes

**Dependencies:**
No new dependencies required - all fixes use existing libraries.

**Environment Variables:**
Add to `api/.env`:
```bash
FRONTEND_URL=https://your-production-domain.vercel.app
```

**Estimated Effort:**
- Database fixes: 2 hours
- Backend auth: 4 hours
- Privacy/Terms pages: 1 hour
- UX improvements: 2 hours
- Testing: 3 hours
- **Total: 12 hours**

**Files Modified:**
1. `macro-tracker/components/settings/ProfileSection.tsx`
2. `macro-tracker/components/settings/DataPrivacySection.tsx`
3. `macro-tracker/components/settings/DangerZoneSection.tsx`
4. `macro-tracker/app/api/ai/chat/route.ts`
5. `api/main.py`
6. `api/dependencies/auth.py` (new file)
7. `api/agent/settings.py`
8. `macro-tracker/app/privacy/page.tsx` (new file)
9. `macro-tracker/app/terms/page.tsx` (new file)

**Files Created:**
- `api/dependencies/auth.py` - JWT validation logic
- `macro-tracker/app/privacy/page.tsx` - Privacy policy
- `macro-tracker/app/terms/page.tsx` - Terms of service

**No Database Migrations Needed:**
All fixes work with existing schema. No migration files required.
