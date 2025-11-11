name: "Complete Application Functionality Audit & Bug Fixes"
description: |
  Comprehensive PRP for fixing all critical database integration bugs and incomplete functionality
  discovered through full-stack analysis of the Siphio macro tracking application.

---

## Goal

Fix all critical database integration bugs and incomplete functionality to ensure the Settings page and AI Nutrition Coach backend work correctly with proper security, authentication, and data management.

**Specific end state:**
- Settings page loads without errors and displays user profile correctly
- All data export/delete operations work with correct table names
- Backend API validates JWT tokens and prevents user ID spoofing
- Privacy and Terms pages exist (not 404)
- CORS configuration uses environment variables
- All operations show loading states and user-friendly error messages

## Why

- **Critical Bug Impact**: Settings page completely broken - users cannot manage their profiles
- **Security Vulnerability**: Backend accepts any user_id without validation - users can access others' data
- **Data Integrity**: Export/delete operations reference non-existent tables - data loss risk
- **User Experience**: Missing pages (404s) and no error feedback hurt trust
- **Production Readiness**: Hardcoded CORS domains prevent proper deployment

## What

### Success Criteria
- [x] Settings page loads successfully without console errors
- [x] Profile information displays (name, email, member since date)
- [x] Profile name updates persist to database correctly
- [x] Theme, measurement units, and calendar preferences save
- [x] Data export downloads complete JSON with all user data (goals, meals, items, summaries, favorites)
- [x] Account deletion removes all user data and signs out user
- [x] Backend rejects requests without valid JWT tokens (401)
- [x] Backend rejects requests with invalid/expired JWT tokens (401)
- [x] Users cannot access other users' data via API
- [x] Privacy Policy page accessible at /privacy
- [x] Terms of Service page accessible at /terms
- [x] All operations show loading indicators during execution
- [x] All operations show success/error toasts with user-friendly messages

---

## All Needed Context

### Documentation & References

```yaml
# CRITICAL - Database Schema Documentation
- file: macro-tracker/supabase/migrations/006_enable_multi_user_auth.sql
  why: Defines CORRECT column name (auth_id, NOT auth_user_id) and table structure
  critical: Line 6 shows "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE"

- file: macro-tracker/supabase/migrations/001_initial_schema.sql
  why: Shows CORRECT table names (macro_goals, meals, meal_items, daily_summary)
  critical: No tables named 'daily_goals' or 'food_logs' exist in schema

# FastAPI Security Best Practices
- url: https://fastapi.tiangolo.com/tutorial/security/
  section: Dependencies with OAuth2
  why: Standard pattern for JWT validation via dependency injection

- url: https://fastapi.tiangolo.com/tutorial/dependencies/
  section: Using dependencies in path operations
  why: How to use Depends() for authentication

- url: https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf
  why: Specific implementation of Supabase JWT validation in FastAPI
  critical: Shows how to use supabase.auth.get_user(token) for validation

# Supabase Client Documentation
- url: https://supabase.com/docs/reference/python/auth-getuser
  section: auth.get_user()
  why: Python method to validate JWT and extract user info

- url: https://supabase.com/docs/reference/javascript/select
  section: Filtering and querying
  why: Correct syntax for querying tables with proper column names

# Next.js and TypeScript Patterns
- url: https://nextjs.org/docs/app/api-reference/file-conventions/route
  section: Route Handlers
  why: How Next.js API routes work and handle requests

# Existing Codebase Files
- file: macro-tracker/components/settings/ProfileSection.tsx
  why: BROKEN - uses auth_user_id (lines 35, 58) instead of auth_id
  action: Find and replace with correct column name

- file: macro-tracker/components/settings/DataPrivacySection.tsx
  why: BROKEN - queries non-existent tables daily_goals and food_logs (lines 34-36)
  action: Replace with correct tables and add meal_items query logic

- file: macro-tracker/components/settings/DangerZoneSection.tsx
  why: BROKEN - same issues as DataPrivacySection (lines 48, 54-56, 89)
  action: Fix column name and table names

- file: macro-tracker/app/api/ai/chat/route.ts
  why: Currently validates auth but sends user_id in body (insecure pattern)
  action: Add JWT token to Authorization header for backend

- file: api/main.py
  why: No authentication - accepts user_id from request body (security hole)
  action: Add JWT validation dependency and remove user_id from request model

- file: api/agent/dependencies.py
  why: Current dependency structure - will add auth dependency here
  action: Create get_current_user_id dependency function

- file: api/agent/settings.py
  why: Settings pattern using pydantic-settings and dotenv
  action: Add frontend_url field for CORS configuration
```

### Current Codebase Structure

```bash
siphio-website/
├── macro-tracker/                    # Next.js frontend
│   ├── app/
│   │   ├── api/ai/chat/route.ts     # API route (validates auth, proxies to backend)
│   │   ├── settings/page.tsx        # Settings page container
│   │   └── (pages to create)
│   │       ├── privacy/page.tsx     # NEW - Privacy policy
│   │       └── terms/page.tsx       # NEW - Terms of service
│   ├── components/
│   │   ├── settings/
│   │   │   ├── ProfileSection.tsx          # BROKEN - wrong column name
│   │   │   ├── DataPrivacySection.tsx      # BROKEN - wrong table names
│   │   │   └── DangerZoneSection.tsx       # BROKEN - both issues
│   │   └── ui/                             # shadcn/ui components (existing)
│   │       ├── button.tsx, card.tsx, input.tsx, dialog.tsx, etc.
│   └── supabase/migrations/
│       ├── 001_initial_schema.sql          # Defines correct table names
│       └── 006_enable_multi_user_auth.sql  # Defines auth_id column
│
├── api/                              # FastAPI backend
│   ├── main.py                      # INSECURE - no JWT validation
│   ├── agent/
│   │   ├── dependencies.py          # Current deps - will add auth here
│   │   └── settings.py              # Pydantic settings with dotenv
│   └── (new file)
│       └── dependencies/
│           └── auth.py              # NEW - JWT validation dependency
```

### Desired Codebase After Implementation

```bash
siphio-website/
├── macro-tracker/
│   ├── app/
│   │   ├── api/ai/chat/route.ts     # FIXED - sends JWT in Authorization header
│   │   ├── privacy/page.tsx         # NEW - Privacy policy page
│   │   └── terms/page.tsx           # NEW - Terms of service page
│   ├── components/
│   │   └── settings/
│   │       ├── ProfileSection.tsx          # FIXED - uses auth_id
│   │       ├── DataPrivacySection.tsx      # FIXED - correct tables, loading states
│   │       └── DangerZoneSection.tsx       # FIXED - both column and table names
│
├── api/
│   ├── main.py                      # FIXED - uses auth dependency, env-based CORS
│   ├── agent/
│   │   └── settings.py              # UPDATED - added frontend_url field
│   └── dependencies/
│       └── auth.py                  # NEW - get_current_user_id() dependency
```

### Known Gotchas & Library Quirks

```python
# CRITICAL: Supabase Python Client Auth Method
# The supabase-py library uses async methods for auth
# Correct: await supabase.auth.get_user(token)
# Wrong: supabase.auth.get_user(token) without await

# CRITICAL: Database Column Name Mismatch
# Migration 006 added column named 'auth_id' (NOT 'auth_user_id')
# All queries must use .eq('auth_id', user.id)
# Wrong column name causes silent failures (no results returned)

# CRITICAL: Table Names in Schema
# Actual tables: macro_goals, meals, meal_items, daily_summary
# NEVER use: daily_goals, food_logs (these don't exist)

# CRITICAL: meal_items Query Pattern
# meal_items table has NO direct user_id column
# Must query via meals relationship:
#   1. Get all meal IDs for user
#   2. Query meal_items where meal_id IN (meal_ids)

# CRITICAL: FastAPI CORS with Wildcards
# CORS middleware doesn't support wildcard subdomains in allow_origins
# Wrong: "https://*.vercel.app"
# Right: Use environment variable with specific domain

# CRITICAL: Supabase JWT Validation
# Must use service_key client for auth.get_user(token)
# Anon key client won't have permission to validate JWTs
# Pattern: Use AsyncClient with service_key from settings

# CRITICAL: FastAPI Dependency Injection Caching
# Dependencies are cached per request by default
# get_current_user_id will only execute once per request
# Safe to use multiple times in same endpoint

# CRITICAL: TypeScript Type Casting
# Supabase returns 'any' types in TypeScript
# Must cast to access properties: (userData as any).id
# Use type assertions for all database responses
```

---

## Implementation Blueprint

### Data Models and Structure

```python
# api/main.py - Updated request model (REMOVE user_id field)
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    """Request model - user_id extracted from JWT, not body"""
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default=[])
    # REMOVED: user_id field (security fix)

class ChatResponse(BaseModel):
    """Response model - unchanged"""
    response: str
    conversation_history: List[Dict[str, Any]]
    usage: Dict[str, Any]
```

```python
# api/dependencies/auth.py - NEW authentication dependency
from fastapi import Header, HTTPException, Depends
from api.database.supabase import get_supabase_client
from supabase import AsyncClient

async def get_current_user_id(
    authorization: str = Header(..., description="Bearer {jwt_token}")
) -> str:
    """
    Extract and validate user_id from Supabase JWT token.

    This dependency:
    1. Validates JWT token with Supabase auth
    2. Extracts auth_id from token
    3. Looks up internal user_id from users table
    4. Returns validated user_id for use in agent

    Raises:
        HTTPException 401: Invalid/missing token
        HTTPException 404: User profile not found
    """
    # Validate Authorization header format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Use 'Bearer {token}'"
        )

    # Extract JWT token
    token = authorization.replace("Bearer ", "")

    # Get Supabase client with service key (required for auth validation)
    supabase: AsyncClient = await get_supabase_client()

    try:
        # Validate JWT with Supabase and get user info
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        auth_id = user_response.user.id

        # Look up internal user_id from users table using auth_id
        user_data = await supabase.from("users") \
            .select("id") \
            .eq("auth_id", auth_id) \
            .single()

        if not user_data.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Please contact support."
            )

        return user_data.data["id"]

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other errors (network, parsing, etc.)
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )
```

```python
# api/agent/settings.py - Add frontend_url field
class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # ... existing fields ...

    # CORS Configuration
    frontend_url: str = Field(
        default="http://localhost:3000",
        description="Frontend application URL for CORS (production domain)"
    )
```

### Tasks to Complete (In Order)

```yaml
Task 1: Fix Database Column Name - ProfileSection.tsx
  Priority: P0 (Critical - page completely broken)
  File: macro-tracker/components/settings/ProfileSection.tsx
  Changes:
    - FIND: .eq('auth_user_id', user.id)  (appears 2x: lines 35, 58)
    - REPLACE: .eq('auth_id', user.id)
  Test: Settings page loads without errors

Task 2: Fix Database Column Name - DataPrivacySection.tsx
  Priority: P0 (Critical - export/delete broken)
  File: macro-tracker/components/settings/DataPrivacySection.tsx
  Changes:
    - FIND: .eq('auth_user_id', user.id)  (line 21)
    - REPLACE: .eq('auth_id', user.id)
  Test: Export data doesn't crash immediately

Task 3: Fix Database Column Name - DangerZoneSection.tsx
  Priority: P0 (Critical - account deletion broken)
  File: macro-tracker/components/settings/DangerZoneSection.tsx
  Changes:
    - FIND: .eq('auth_user_id', user.id)  (appears 2x: lines 48, 89)
    - REPLACE: .eq('auth_id', user.id)
  Test: Delete account dialog opens without errors

Task 4: Fix Table Names - DataPrivacySection.tsx Export Logic
  Priority: P0 (Critical - queries non-existent tables)
  File: macro-tracker/components/settings/DataPrivacySection.tsx
  Changes:
    - FIND: Lines 29-36 (entire export query section)
    - REPLACE: With correct table queries including meal_items via relationship
  See: Pseudocode in Task 4 section below
  Test: Export downloads valid JSON with all data

Task 5: Fix Table Names - DangerZoneSection.tsx Export Logic
  Priority: P0 (Critical - duplicate broken export code)
  File: macro-tracker/components/settings/DangerZoneSection.tsx
  Changes:
    - FIND: Lines 53-56 (export before delete queries)
    - REPLACE: Same logic as Task 4
  Test: Export-before-delete downloads complete data

Task 6: Create Backend Authentication Dependency
  Priority: P1 (Security critical)
  File: api/dependencies/auth.py (NEW FILE)
  Changes:
    - CREATE: get_current_user_id() async function
    - IMPLEMENT: JWT validation using supabase.auth.get_user()
    - IMPLEMENT: User lookup via auth_id -> internal user_id
  See: Data Models section for complete implementation
  Test: Function returns user_id for valid token, raises 401 for invalid

Task 7: Update Backend Main App - Add Auth Dependency
  Priority: P1 (Security critical)
  File: api/main.py
  Changes:
    - IMPORT: from dependencies.auth import get_current_user_id
    - UPDATE: ChatRequest model (remove user_id field)
    - UPDATE: /api/chat endpoint (add Depends(get_current_user_id))
  See: Pseudocode in Task 7 section below
  Test: Endpoint rejects requests without Authorization header

Task 8: Update Backend Settings - Add Frontend URL
  Priority: P1 (CORS configuration)
  File: api/agent/settings.py
  Changes:
    - ADD: frontend_url field to Settings class
  See: Data Models section for field definition
  Test: Settings loads from .env correctly

Task 9: Update Backend CORS Configuration
  Priority: P1 (Security and deployment)
  File: api/main.py
  Changes:
    - REPLACE: Hardcoded CORS origins with environment-based logic
    - USE: settings.frontend_url for production domain
  See: Pseudocode in Task 9 section below
  Test: CORS allows localhost in dev, production domain in prod

Task 10: Update Frontend API Route - Send JWT Token
  Priority: P1 (Required for backend auth)
  File: macro-tracker/app/api/ai/chat/route.ts
  Changes:
    - GET: session.access_token from Supabase
    - ADD: Authorization header to backend request
    - REMOVE: user_id from request body
  See: Pseudocode in Task 10 section below
  Test: Backend receives and validates JWT token

Task 11: Add Loading States - DataPrivacySection
  Priority: P2 (UX improvement)
  File: macro-tracker/components/settings/DataPrivacySection.tsx
  Changes:
    - ADD: useState for exporting flag
    - WRAP: Export logic in try/finally to manage loading state
    - UPDATE: Button to show Loader2 icon when loading
  See: Pseudocode in Task 11 section below
  Test: Export button shows spinner during export

Task 12: Add Loading States - DangerZoneSection
  Priority: P2 (UX improvement - already has deleting state)
  File: macro-tracker/components/settings/DangerZoneSection.tsx
  Changes:
    - VERIFY: deleting state already implemented (lines 28, 39, 108, 182, 188)
    - NO CHANGES: Loading states already complete
  Test: Delete shows spinner correctly

Task 13: Improve Error Messages - Create Error Utility
  Priority: P2 (UX improvement)
  File: macro-tracker/lib/errors.ts (NEW FILE)
  Changes:
    - CREATE: getUserFriendlyError() function
    - MAP: Common error types to friendly messages
  See: Pseudocode in Task 13 section below
  Test: Error function returns user-friendly messages

Task 14: Apply Error Utility to Settings Components
  Priority: P2 (UX improvement)
  Files: ProfileSection, DataPrivacySection, DangerZoneSection
  Changes:
    - IMPORT: getUserFriendlyError from lib/errors
    - UPDATE: All catch blocks to use utility function
  Test: All errors show friendly messages in toasts

Task 15: Create Privacy Policy Page
  Priority: P2 (Functional requirement)
  File: macro-tracker/app/privacy/page.tsx (NEW FILE)
  Changes:
    - CREATE: Basic privacy policy page using shadcn Card components
    - ADD: Back button to settings using existing Button component
  See: Pseudocode in Task 15 section below
  Test: /privacy loads without 404, shows basic content

Task 16: Create Terms of Service Page
  Priority: P2 (Functional requirement)
  File: macro-tracker/app/terms/page.tsx (NEW FILE)
  Changes:
    - CREATE: Similar structure to privacy page
    - ADD: Basic terms content
  See: Pseudocode in Task 16 section below
  Test: /terms loads without 404, shows basic content

Task 17: Update API .env.example
  Priority: P3 (Documentation)
  File: api/.env.example
  Changes:
    - ADD: FRONTEND_URL variable with example
  Test: Example file has all required variables documented
```

### Task-Specific Pseudocode

```typescript
// ========================================
// Task 4: Fix Table Names - DataPrivacySection Export
// ========================================
// File: macro-tracker/components/settings/DataPrivacySection.tsx

const handleExportData = async () => {
  try {
    // Get authenticated user (existing code - no change)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user data with CORRECT column name (already fixed in Task 2)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)  // CORRECT
      .single();

    if (!userData) throw new Error('User data not found');
    const userId = (userData as any).id;

    // Query CORRECT tables in parallel
    const [
      { data: macroGoals },        // CORRECT: macro_goals (not daily_goals)
      { data: meals },              // CORRECT: meals table
      { data: dailySummary },       // CORRECT: daily_summary (not food_logs)
      { data: favorites },          // CORRECT: user_favorites
      { data: settings },           // CORRECT: user_settings
    ] = await Promise.all([
      supabase.from('macro_goals').select('*').eq('user_id', userId),
      supabase.from('meals').select('*').eq('user_id', userId),
      supabase.from('daily_summary').select('*').eq('user_id', userId),
      supabase.from('user_favorites').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId),
    ]);

    // Query meal_items via meals relationship (no direct user_id)
    const mealIds = meals?.map(m => m.id) || [];
    let mealItems = [];

    if (mealIds.length > 0) {
      const { data: items } = await supabase
        .from('meal_items')
        .select('*')
        .in('meal_id', mealIds);
      mealItems = items || [];
    }

    // Build export data with CORRECT structure
    const exportData = {
      user: userData,
      macro_goals: macroGoals || [],      // CORRECT key names
      meals: meals || [],
      meal_items: mealItems || [],
      daily_summary: dailySummary || [],
      favorites: favorites || [],
      settings: settings || [],
      exportedAt: new Date().toISOString(),
    };

    // Create and download (existing code - no change)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siphio-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  } catch (error: any) {
    // Will be enhanced in Task 14 with getUserFriendlyError()
    toast.error(error.message || 'Failed to export data');
  }
};
```

```python
# ========================================
# Task 7: Update Backend Main App
# ========================================
# File: api/main.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from agent.coach_agent import nutrition_coach
from agent.dependencies import CoachAgentDependencies
from database.supabase import get_supabase_client
from dependencies.auth import get_current_user_id  # NEW IMPORT
from pydantic_ai.messages import ModelMessagesTypeAdapter

logger = logging.getLogger(__name__)

# UPDATED: Remove user_id field (extracted from JWT instead)
class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default=[])
    # REMOVED: user_id field

# Response model unchanged
class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    conversation_history: List[Dict[str, Any]]
    usage: Dict[str, Any]

# UPDATED: Add auth dependency
@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id)  # NEW: Validated from JWT
):
    """
    Main chat endpoint with JWT authentication.

    user_id is extracted and validated from Authorization header.
    If token is invalid/missing, returns 401 before reaching this code.
    """
    try:
        # Create Supabase client
        supabase = await get_supabase_client()

        # Create agent dependencies with VALIDATED user_id
        deps = CoachAgentDependencies(
            supabase=supabase,
            user_id=user_id  # Guaranteed valid - came from JWT
        )

        # Deserialize conversation history (existing code - no change)
        message_history = None
        if request.conversation_history:
            try:
                message_history = ModelMessagesTypeAdapter.validate_python(
                    request.conversation_history
                )
            except Exception as e:
                logger.warning(f"Failed to parse conversation history: {e}")
                message_history = None

        # Run agent (existing code - no change)
        result = await nutrition_coach.run(
            request.message,
            message_history=message_history,
            deps=deps
        )

        # Serialize and return (existing code - no change)
        updated_history = ModelMessagesTypeAdapter.dump_python(result.all_messages())

        usage_data = result.usage()
        usage = {
            'input_tokens': usage_data.input_tokens if usage_data else 0,
            'output_tokens': usage_data.output_tokens if usage_data else 0,
            'total_tokens': usage_data.total_tokens if usage_data else 0
        }

        return ChatResponse(
            response=result.output,
            conversation_history=updated_history,
            usage=usage
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to process chat request"
        )
```

```python
# ========================================
# Task 9: Update Backend CORS Configuration
# ========================================
# File: api/main.py (CORS section)

from agent.settings import load_settings

# Load settings at module level
settings = load_settings()

# Build allowed origins based on environment
allowed_origins = [
    "http://localhost:3000",  # Always allow localhost for development
]

# Add production domain if in production environment
if settings.app_env == "production":
    allowed_origins.append(settings.frontend_url)

# Configure CORS middleware with environment-aware origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # No wildcards, explicit domains only
    allow_credentials=True,
    allow_methods=["POST"],  # Only POST needed for /api/chat
    allow_headers=["Content-Type", "Authorization"],  # Include Authorization
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

```typescript
// ========================================
// Task 10: Update Frontend API Route - Send JWT
// ========================================
// File: macro-tracker/app/api/ai/chat/route.ts

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client (existing)
    const supabase = await createServerSupabaseClient();

    // Check authentication (existing)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // NEW: Get session for access token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Parse request body (existing)
    const body = await request.json();
    const { message, conversation_history = [] } = body;

    // Validate message (existing)
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Get backend URL (existing)
    const pythonUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:8000'
      : process.env.PYTHON_API_URL;

    if (!pythonUrl) {
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // UPDATED: Send JWT in Authorization header, remove user_id from body
    const pythonResponse = await fetch(`${pythonUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,  // NEW: JWT token
      },
      body: JSON.stringify({
        message: message.trim(),
        conversation_history,
        // REMOVED: user_id (extracted from token in backend)
      }),
    });

    // Handle response (existing code - no change)
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python API error:', errorText);
      return NextResponse.json(
        { error: 'Backend error' },
        { status: pythonResponse.status }
      );
    }

    const data = await pythonResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

```typescript
// ========================================
// Task 11: Add Loading States - DataPrivacySection
// ========================================
// File: macro-tracker/components/settings/DataPrivacySection.tsx

export function DataPrivacySection() {
  const supabase = createClient();
  const [exporting, setExporting] = useState(false);  // NEW: Loading state

  const handleExportData = async () => {
    try {
      setExporting(true);  // NEW: Start loading

      // ... existing export logic from Task 4 ...

      toast.success('Data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(false);  // NEW: Stop loading (always runs)
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & Privacy</CardTitle>
        <CardDescription>Manage your data and privacy settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Export Your Data</p>
            <p className="text-xs text-muted-foreground">
              Download all your data in JSON format
            </p>
          </div>
          {/* UPDATED: Add loading state */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
        {/* ... rest of component ... */}
      </CardContent>
    </Card>
  );
}
```

```typescript
// ========================================
// Task 13: Create Error Utility
// ========================================
// File: macro-tracker/lib/errors.ts (NEW FILE)

/**
 * Convert technical error messages to user-friendly messages.
 * Maintains technical details in console for debugging.
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || error?.toString() || '';
  const code = error?.code || '';

  // Supabase error codes
  if (code === 'PGRST116') {
    return 'No data found. Your account may be empty.';
  }

  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'Authentication error. Please sign out and back in.';
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Not found errors
  if (message.includes('not found') || code === '404') {
    return 'Data not found. Please try refreshing the page.';
  }

  // Database errors
  if (message.includes('column') || message.includes('table')) {
    return 'Database error. Please contact support if this persists.';
  }

  // Permission errors
  if (message.includes('permission') || message.includes('denied')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
}
```

```tsx
// ========================================
// Task 15: Create Privacy Policy Page
// ========================================
// File: macro-tracker/app/privacy/page.tsx (NEW FILE)

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>

        {/* Page title */}
        <h1 className="text-4xl font-bold mt-8 mb-6">Privacy Policy</h1>

        {/* Content card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              Siphio ("we", "our", or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our macro tracking application.
            </p>

            <h2>Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account information (email, name)</li>
              <li>Nutrition data (meals, macros, goals)</li>
              <li>Usage data (app interactions, preferences)</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience</li>
              <li>Send you updates and notifications</li>
              <li>Protect against fraud and abuse</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data,
              including encryption, secure authentication, and regular security audits.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Export your data (via Settings)</li>
              <li>Delete your account and data</li>
              <li>Opt-out of communications</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at
              privacy@siphio.app
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

```tsx
// ========================================
// Task 16: Create Terms of Service Page
// ========================================
// File: macro-tracker/app/terms/page.tsx (NEW FILE)

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>

        {/* Page title */}
        <h1 className="text-4xl font-bold mt-8 mb-6">Terms of Service</h1>

        {/* Content card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using Siphio, you accept and agree to be bound by
              the terms and provisions of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to use Siphio for personal, non-commercial
              nutrition tracking purposes. This license shall automatically terminate
              if you violate any of these restrictions.
            </p>

            <h2>Account Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Complying with applicable laws and regulations</li>
            </ul>

            <h2>Prohibited Uses</h2>
            <p>You may not use Siphio to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe upon others' intellectual property rights</li>
              <li>Transmit harmful code or malware</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2>Disclaimer</h2>
            <p>
              Siphio is provided "as is" without warranty of any kind. We do not
              guarantee that the service will be uninterrupted, secure, or error-free.
              Nutrition information is for informational purposes only and should not
              replace professional medical advice.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              Siphio shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of or
              inability to use the service.
            </p>

            <h2>Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at our
              discretion, without notice, for conduct that we believe violates
              these Terms of Service or is harmful to other users.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to support@siphio.app
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Integration Points

```yaml
DATABASE:
  migrations: None required (fixes work with existing schema)
  verification: |
    -- Verify correct column exists
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_id';

    -- Verify correct tables exist
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('macro_goals', 'meals', 'meal_items', 'daily_summary');

CONFIG:
  add_to: api/.env
  variables: |
    FRONTEND_URL=https://your-production-domain.vercel.app
    # Existing variables (no changes)
    SUPABASE_URL=...
    SUPABASE_SERVICE_KEY=...
    LLM_API_KEY=...

  add_to: api/.env.example
  variables: |
    FRONTEND_URL=https://your-production-domain.vercel.app

ROUTES:
  backend: |
    # main.py - /api/chat endpoint
    # Changed: Add Depends(get_current_user_id) parameter
    # Changed: Remove user_id from ChatRequest model

  frontend: |
    # NEW: app/privacy/page.tsx
    # NEW: app/terms/page.tsx
    # MODIFIED: app/api/ai/chat/route.ts (send JWT token)

DEPENDENCIES:
  python: None (all dependencies already installed)
  typescript: None (all dependencies already installed)
  new_imports:
    - "from dependencies.auth import get_current_user_id"
    - "from fastapi import Depends"
```

---

## Validation Loop

### Level 1: TypeScript/Python Syntax Check

```bash
# Frontend - TypeScript compilation
cd macro-tracker
npx tsc --noEmit

# Expected: No errors
# If errors: Read error message, fix syntax, re-run

# Backend - Python syntax check with ruff
cd api
ruff check . --fix

# Expected: No errors
# If errors: Read error message, fix issues, re-run
```

### Level 2: Manual Testing Checklist

```bash
# Start backend server
cd api
./venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000

# Start frontend server (separate terminal)
cd macro-tracker
npm run dev

# Manual test checklist:
```

**Settings Page Tests:**
- [ ] Navigate to /settings page loads without console errors
- [ ] Profile section displays user name and email correctly
- [ ] Edit name field and click "Save Changes" - check success toast
- [ ] Verify name update in database (check Supabase dashboard)
- [ ] Theme toggle saves and applies immediately
- [ ] Measurement units dropdown saves correctly
- [ ] Calendar preferences (start of week) saves correctly

**Data Export Tests:**
- [ ] Click "Export" button - loading spinner appears
- [ ] Export completes and downloads JSON file
- [ ] Open JSON file - verify structure includes all keys:
  - user, macro_goals, meals, meal_items, daily_summary, favorites, settings
- [ ] Verify meal_items array contains items from user's meals
- [ ] Success toast appears after export completes

**Account Deletion Tests:**
- [ ] Click "Delete Account" button - dialog opens
- [ ] Check "Export my data before deletion" checkbox
- [ ] Type "DELETE" in confirmation field
- [ ] Click "Delete Account" button
- [ ] If export checked: JSON downloads first
- [ ] Loading spinner shows during deletion
- [ ] User is signed out after deletion
- [ ] Navigate to /settings - redirected to login (user gone)

**Backend Authentication Tests:**
- [ ] Send request to /api/chat without Authorization header
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "test"}'
  # Expected: 401 error with "Invalid authorization header" message
  ```

- [ ] Send request with invalid JWT token
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer invalid_token" \
    -d '{"message": "test"}'
  # Expected: 401 error with "Invalid or expired token" message
  ```

- [ ] Use AI Nutrition Coach in frontend (should work)
  - Open AI coach panel
  - Send message
  - Verify response appears (auth working)

**Privacy/Terms Pages Tests:**
- [ ] Navigate to /privacy - page loads (not 404)
- [ ] Back button returns to /settings
- [ ] Navigate to /terms - page loads (not 404)
- [ ] Back button returns to /settings
- [ ] Links from settings page work correctly

**Error Handling Tests:**
- [ ] Disconnect internet, try to save profile
  - Expected: Friendly error message about network
- [ ] Sign out, try to access /settings
  - Expected: Redirect to login
- [ ] Export data with no meals logged
  - Expected: Export with empty arrays, no crash

### Level 3: Integration Test

```bash
# Full end-to-end user flow test
# Prerequisites: Fresh user account or reset test account

1. Sign up new account
   - Verify user row created in database
   - Verify user_settings row auto-created

2. Navigate to /settings
   - Verify profile loads with correct email
   - Update name to "Test User"
   - Verify save succeeds

3. Use AI Nutrition Coach
   - Send message: "What should I eat for breakfast?"
   - Verify response appears
   - Check backend logs - no errors
   - Verify JWT was validated (check logs for user_id extraction)

4. Add some meals (use main app)
   - Log breakfast with 2-3 food items
   - Log lunch with 2-3 food items

5. Export data from settings
   - Verify JSON contains meals and meal_items
   - Verify meal_items array length > 0
   - Verify all exported data belongs to test user

6. Test account deletion
   - Enable "Export before delete"
   - Type DELETE and confirm
   - Verify export downloads
   - Verify sign out occurs
   - Verify user row deleted from database
   - Verify all related data deleted (meals, meal_items, goals, etc.)

# If all steps pass: Implementation successful
# If any step fails: Check error messages, review relevant code, fix and retry
```

---

## Final Validation Checklist

- [ ] All TypeScript files compile without errors: `npx tsc --noEmit`
- [ ] All Python files pass linting: `ruff check .`
- [ ] Settings page loads without console errors
- [ ] Profile section works (load, edit, save)
- [ ] Data export downloads complete valid JSON
- [ ] Account deletion works (with and without export)
- [ ] Backend rejects requests without JWT (401)
- [ ] Backend rejects requests with invalid JWT (401)
- [ ] Backend accepts valid JWT and extracts user_id
- [ ] Privacy page loads at /privacy
- [ ] Terms page loads at /terms
- [ ] All operations show loading indicators
- [ ] All operations show appropriate error/success messages
- [ ] CORS allows localhost in development
- [ ] Environment variables documented in .env.example

---

## Anti-Patterns to Avoid

- ❌ Don't use auth_user_id column (doesn't exist) - ALWAYS use auth_id
- ❌ Don't query daily_goals or food_logs tables (don't exist)
- ❌ Don't query meal_items with user_id directly (must join via meals)
- ❌ Don't send user_id in request body (extract from JWT instead)
- ❌ Don't use hardcoded CORS origins (use environment variables)
- ❌ Don't use wildcard CORS domains like "*.vercel.app" (not supported)
- ❌ Don't forget to await Supabase async methods (auth.get_user, etc.)
- ❌ Don't use anon key for JWT validation (requires service key)
- ❌ Don't skip loading states (users need feedback during operations)
- ❌ Don't show technical error messages to users (use friendly messages)
- ❌ Don't create new patterns when existing shadcn components exist
- ❌ Don't forget try/finally blocks for loading state management
- ❌ Don't commit .env files (only commit .env.example)

---

## Files Modified Summary

```yaml
Frontend (TypeScript/React):
  modified:
    - macro-tracker/components/settings/ProfileSection.tsx (fix column name)
    - macro-tracker/components/settings/DataPrivacySection.tsx (fix column + tables + loading)
    - macro-tracker/components/settings/DangerZoneSection.tsx (fix column + tables)
    - macro-tracker/app/api/ai/chat/route.ts (send JWT token)
  created:
    - macro-tracker/app/privacy/page.tsx (NEW)
    - macro-tracker/app/terms/page.tsx (NEW)
    - macro-tracker/lib/errors.ts (NEW - error utility)

Backend (Python/FastAPI):
  modified:
    - api/main.py (add auth dependency, update CORS)
    - api/agent/settings.py (add frontend_url field)
  created:
    - api/dependencies/auth.py (NEW - JWT validation)

Configuration:
  modified:
    - api/.env (add FRONTEND_URL - user must set)
    - api/.env.example (document FRONTEND_URL)

Total Files:
  Modified: 7
  Created: 4
  Total: 11 files
```

---

## Edge Cases Handled

```yaml
User has no settings row:
  solution: Auto-created by trigger in migration 009
  test: Settings page should work for new users

Network error during save:
  solution: Show friendly error, don't update UI state
  test: Disconnect internet, try save, verify error message

Export with no data logged:
  solution: Return empty arrays (not null/undefined)
  test: New account export should work with [] arrays

Delete account network failure:
  solution: Don't sign out user if delete fails
  test: Mock delete error, verify user stays signed in

Invalid JWT token:
  solution: Return 401 with clear message before endpoint code runs
  test: Send request with "Bearer invalid", verify 401

Expired JWT token:
  solution: Supabase auth.get_user() detects and returns null
  test: Use old token, verify 401 response

meal_items query with no meals:
  solution: Check mealIds.length > 0 before query
  test: New user export should skip meal_items query

Browser blocks download:
  solution: Catch error, show toast message
  test: Mock blob creation error, verify friendly message

SessionStorage quota exceeded:
  solution: AI coach handles quota errors in existing code
  test: Already handled in AINutritionCoach component

Multiple rapid save clicks:
  solution: Button disabled during save (saving state)
  test: Click save multiple times quickly, verify one request

User deleted in another tab:
  solution: Supabase auth.getUser() returns null
  test: Delete in one tab, use app in another, verify redirect

CORS preflight requests:
  solution: allow_methods includes POST, allow_headers includes Authorization
  test: Browser automatically sends OPTIONS, verify CORS headers
```

---

## Security Considerations

```yaml
API Key Protection:
  - Supabase service key NEVER exposed to frontend
  - Only used in backend for JWT validation
  - Stored in .env file (git-ignored)

JWT Token Validation:
  - Every backend request validates JWT via dependency
  - Token extracted from Authorization header
  - Validated with Supabase auth.get_user()
  - Expired/invalid tokens rejected before endpoint code

User Isolation:
  - RLS policies enforce user data isolation at database level
  - Backend validates user_id from JWT (not trusted from client)
  - Users cannot spoof user_id to access others' data
  - All queries filtered by authenticated user_id

Data Export Security:
  - Export only includes data user owns
  - RLS policies enforce permissions
  - No server-side processing of export (client-side JSON creation)
  - Download via blob URL (no server storage)

Account Deletion Security:
  - Requires typing "DELETE" confirmation
  - CASCADE relationships ensure complete data removal
  - Sign out immediately after deletion
  - No orphaned data left in database

CORS Security:
  - Explicit origin list (no wildcards)
  - Credentials allowed only for trusted domains
  - Only necessary methods/headers permitted
  - Preflight caching for performance

Environment Variables:
  - Never commit .env files to version control
  - .env.example documents required variables
  - Production secrets managed via deployment platform
  - API keys validated on settings load
```

---

## Performance Considerations

```yaml
Parallel Queries:
  - Export queries run with Promise.all (parallel, not sequential)
  - All tables queried simultaneously
  - meal_items query only runs if meals exist
  - Typical export time: <2 seconds for moderate data

Dependency Caching:
  - FastAPI caches get_current_user_id per request
  - Supabase client reused within single request
  - JWT validation happens once per request
  - Database lookups minimized

Loading States:
  - All long operations show spinners immediately
  - Button disabled during operation prevents double-clicks
  - User knows operation is in progress
  - Better perceived performance

Real-time Subscriptions:
  - NOT needed for settings page (static data)
  - Avoid unnecessary WebSocket connections
  - Settings only change when user explicitly saves
  - Reduces database load

CORS Preflight Caching:
  - max_age=3600 (1 hour) for preflight requests
  - Browser caches OPTIONS responses
  - Reduces network overhead for API calls
  - Improves perceived latency

Toast Notifications:
  - Instant feedback without blocking UI
  - User can continue using app while toast shows
  - Auto-dismiss after 3-5 seconds
  - Better UX than blocking modals
```

---

## Rollback Plan

```yaml
If Settings Page Breaks After Deploy:
  1. Check Supabase database - verify auth_id column exists
  2. Check migration 006 ran successfully
  3. Revert frontend components to previous commit
  4. Settings page will be non-functional but won't crash app
  5. Users can still use main macro tracking features

If Backend Auth Breaks:
  1. Remove Depends(get_current_user_id) from /api/chat
  2. Revert ChatRequest to include user_id field
  3. Redeploy backend without auth (temporary)
  4. Frontend will work but less secure (user_id spoofing possible)
  5. Fix auth issues and redeploy with security

If CORS Configuration Breaks:
  1. Set allow_origins=["*"] temporarily (development only)
  2. Fix frontend_url environment variable
  3. Redeploy with correct CORS settings
  4. Never use allow_origins=["*"] in production

If Privacy/Terms Pages Break:
  1. Temporarily remove links from settings page
  2. Users see "Coming Soon" instead of 404
  3. Fix page components and redeploy
  4. Re-enable links after verification

Database Rollback (Not Recommended):
  - Migration 006 changes are backwards compatible
  - Existing data not modified (only schema changes)
  - Rolling back migration will break auth completely
  - Better to fix forward than rollback database
```

---

## Environment Variables

```bash
# api/.env (add this variable)
FRONTEND_URL=https://your-production-domain.vercel.app

# All existing variables (no changes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
LLM_API_KEY=your-llm-key
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-haiku-20241022
APP_ENV=production
LOG_LEVEL=INFO
```

```bash
# api/.env.example (update with new variable)
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# LLM Configuration
LLM_PROVIDER=anthropic
LLM_API_KEY=your-anthropic-api-key-here
LLM_MODEL=claude-3-5-haiku-20241022

# Application Configuration
APP_ENV=development
LOG_LEVEL=INFO
DEBUG=false

# CORS Configuration
FRONTEND_URL=https://your-production-domain.vercel.app
```

---

## Estimated Effort

```yaml
Task Breakdown:
  P0_Critical_Database_Fixes:
    - Tasks 1-5 (column and table name fixes)
    - Estimated: 2-3 hours
    - Risk: Low (simple find-replace)

  P1_Security_Backend_Auth:
    - Tasks 6-10 (JWT validation, CORS)
    - Estimated: 4-5 hours
    - Risk: Medium (new auth dependency)

  P2_UX_Improvements:
    - Tasks 11-14 (loading states, error messages)
    - Estimated: 2-3 hours
    - Risk: Low (UI enhancements)

  P2_Missing_Pages:
    - Tasks 15-16 (privacy, terms pages)
    - Estimated: 1-2 hours
    - Risk: Low (static content pages)

  P3_Documentation:
    - Task 17 (.env.example update)
    - Estimated: 15 minutes
    - Risk: None

  Testing_Validation:
    - Manual testing all features
    - Estimated: 3-4 hours
    - Risk: Medium (comprehensive testing)

Total Estimated Time: 13-18 hours
Recommended Timeline: 2-3 days (with breaks and buffer)
```

---

## Success Metrics

```yaml
Functional Success:
  - Settings page load time < 1 second
  - Zero console errors on settings page
  - 100% of export operations succeed
  - 100% of delete operations succeed
  - Backend auth rejection rate = 100% for invalid tokens
  - Backend auth acceptance rate = 100% for valid tokens

Security Success:
  - Zero user_id spoofing vulnerabilities
  - All API requests require valid JWT
  - No hardcoded secrets in codebase
  - CORS restricted to known domains
  - RLS policies enforced at database level

User Experience Success:
  - All operations show loading feedback
  - Error messages are user-friendly (not technical)
  - Privacy and Terms pages accessible (0% 404 rate)
  - Export file is valid JSON (parseable)
  - Account deletion completes successfully

Code Quality Success:
  - TypeScript compilation 100% success
  - Python linting 100% success
  - No anti-patterns used
  - All edge cases handled
  - Comprehensive error handling
```

---

## PRP Quality Score

**Confidence Level: 9/10**

**Rationale:**
- ✅ Complete context included (migrations, existing code, documentation)
- ✅ All necessary patterns documented (auth, database, CORS)
- ✅ Executable validation steps provided (manual tests, curl commands)
- ✅ Clear task breakdown with pseudocode
- ✅ Security considerations thoroughly documented
- ✅ Edge cases and gotchas explicitly handled
- ✅ Rollback plan provided for production safety
- ✅ Environment variables documented
- ⚠️ Some risk in JWT validation dependency (new pattern for this codebase)
- ⚠️ Manual testing required (no automated tests exist yet)

**Recommendation:**
This PRP should enable one-pass implementation with high confidence. The 9/10 score reflects minor risk in the backend authentication changes, but all context and examples are provided to mitigate this. Follow the task order strictly for best results.
