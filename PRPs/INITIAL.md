name: "Macro Tracking Web App"
description: |

## Purpose
Build a single-user macro tracking web application that enables real-time food logging with immediate visual feedback through 4 core graphs. Uses Next.js, Supabase, USDA FoodData Central API, and Recharts for a streamlined whole-foods tracking experience.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Real-time Updates**: Charts update immediately as food is logged
3. **Simplicity First**: 4 focused graphs, whole foods only, no brand tracking
4. **Multi-user Ready**: Single-user now, architected for multi-user expansion
5. **Progressive Success**: Start simple, validate, then enhance

---

## Goal
Create a production-ready macro tracking web application where users can search whole foods via USDA API, log them to specific meals, track against daily macro goals, and visualize progress through 4 real-time graphs.

## Why
- **Personal health**: Track daily macro intake (protein, carbs, fat, calories) accurately
- **Consistency tracking**: Visual streak calendar to maintain daily logging habits
- **Data-driven insights**: Historical trends show macro adherence patterns
- **Problems solved**: Eliminates need for complex apps with brand databases; focuses on whole foods only

## What
A web application where:
- Users search whole foods (steak, basmati rice, pomegranate, eggs, etc.) via USDA API
- Foods are logged to specific meals (breakfast, lunch, dinner, snack)
- Individual food items tracked separately within meals
- Daily macro goals set (calories, protein, carbs, fat targets)
- 4 real-time graphs provide instant visual feedback
- Historical data shows trends and consistency

### Success Criteria
- [ ] USDA API integration returns accurate whole food data
- [ ] Food logging works with quantity input (grams)
- [ ] Meals contain multiple food items tracked separately
- [ ] Daily macro goals can be set and edited
- [ ] Graph #1: Streak calendar shows logging consistency
- [ ] Graph #2: Daily macro gauges show real-time progress (Cal, P, C, F)
- [ ] Graph #3: 7-day trend line chart shows macro fluctuations vs targets
- [ ] Graph #4: 30-day stacked area chart shows macro composition over time
- [ ] All charts update immediately when food is logged
- [ ] Database schema supports future multi-user expansion

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window

# Next.js & React
- url: https://nextjs.org/docs/app
  why: Next.js 14 App Router patterns, routing, server components

- url: https://ui.shadcn.com/docs
  why: SHAD CN component installation and usage patterns

# Database & Real-time
- url: https://supabase.com/docs/guides/database/tables
  why: Creating tables, relationships, and indexes in Supabase

- url: https://supabase.com/docs/guides/realtime
  why: Real-time subscriptions for live chart updates

- url: https://supabase.com/docs/reference/javascript/select
  why: Supabase JavaScript client query patterns

# Food Data API
- url: https://fdc.nal.usda.gov/api-guide.html
  why: USDA FoodData Central API documentation

- url: https://fdc.nal.usda.gov/
  why: USDA database search interface to test queries

- url: https://app.quicktype.io/
  why: Generate TypeScript types from USDA API responses

# Charts
- url: https://recharts.org/en-US/guide
  why: Recharts core concepts and patterns

- url: https://recharts.org/en-US/api/LineChart
  why: Multi-line chart for 7-day trends (Graph #3)

- url: https://recharts.org/en-US/api/AreaChart
  why: Stacked area chart for 30-day macro composition (Graph #4)

# TypeScript & Validation
- url: https://zod.dev/
  why: Schema validation for API responses and forms
```

### Current Codebase tree
```bash
c:\Users\marley\siphio-website\
├── PRPs/
│   ├── prp-readme.md
│   ├── EXAMPLE_PRP_multi_agent_prp.md
│   └── INITIAL.md (this file)
└── (other website files)
```

### Desired Codebase tree with files to be added
```bash
macro-tracker/                          # New project directory
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout with providers
│   ├── page.tsx                        # Dashboard (main view)
│   ├── api/
│   │   ├── usda/
│   │   │   └── route.ts                # USDA API proxy endpoint
│   │   └── goals/
│   │       └── route.ts                # Macro goals CRUD
│   └── globals.css                     # Tailwind styles
├── components/
│   ├── ui/                             # SHAD CN components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...                         # Other SHAD CN components
│   ├── FoodSearch.tsx                  # Search interface with USDA integration
│   ├── MealSection.tsx                 # Meal container (breakfast/lunch/dinner/snack)
│   ├── FoodItem.tsx                    # Individual logged food with edit/delete
│   ├── MacroGoalsForm.tsx              # Set daily macro targets
│   ├── graphs/
│   │   ├── StreakCalendar.tsx          # Graph #1: Heatmap calendar
│   │   ├── DailyMacroGauges.tsx        # Graph #2: 4 circular progress indicators
│   │   ├── WeeklyTrendChart.tsx        # Graph #3: 7-day multi-line chart
│   │   └── MonthlyCompositionChart.tsx # Graph #4: 30-day stacked area
│   └── providers/
│       └── SupabaseProvider.tsx        # Supabase client context
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Supabase browser client
│   │   ├── server.ts                   # Supabase server client
│   │   └── types.ts                    # Database TypeScript types
│   ├── api/
│   │   └── usda.ts                     # USDA API client functions
│   ├── utils/
│   │   ├── calculations.ts             # Macro calculations (quantity * per-100g)
│   │   ├── date-helpers.ts             # Date formatting and manipulation
│   │   └── cn.ts                       # Class name utility (SHAD CN)
│   └── hooks/
│       ├── useRealtimeMacros.ts        # Real-time macro totals subscription
│       ├── useDailyGoals.ts            # Fetch and update goals
│       └── useStreakData.ts            # Calculate logging streak
├── types/
│   ├── database.ts                     # Supabase generated types
│   ├── usda.ts                         # USDA API response types
│   └── macros.ts                       # Macro calculation types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Database schema SQL
├── .env.local                          # Environment variables (gitignored)
├── .env.example                        # Environment template
├── next.config.mjs                     # Next.js configuration
├── tailwind.config.ts                  # Tailwind with SHAD CN setup
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies
├── components.json                     # SHAD CN configuration
└── README.md                           # Project documentation
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: USDA API has rate limits - cache responses in Supabase food_items table
// CRITICAL: USDA API returns nutrients in different formats - normalize to per-100g
// CRITICAL: Supabase real-time requires Row Level Security (RLS) policies
// CRITICAL: Next.js App Router - use 'use client' for components with hooks/state
// CRITICAL: Recharts requires 'use client' directive
// CRITICAL: Date handling - always use UTC to avoid timezone issues with daily summaries
// CRITICAL: Macro calculations must round consistently (2 decimal places)
// CRITICAL: Supabase client needs separate browser/server instances
// CRITICAL: SHAD CN components require manual installation per component
// CRITICAL: Food quantities stored in grams, but allow input in grams/oz/servings
// CRITICAL: Daily summaries should be materialized view or trigger-updated for performance
// CRITICAL: Prevent duplicate meal entries for same date/meal_type per user
```

## Implementation Blueprint

### Database Schema

```sql
-- migrations/001_initial_schema.sql

-- Users table (for future multi-user)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Macro goals (allows changing goals over time)
CREATE TABLE macro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calories_target INTEGER NOT NULL CHECK (calories_target > 0),
  protein_target INTEGER NOT NULL CHECK (protein_target >= 0),
  carbs_target INTEGER NOT NULL CHECK (carbs_target >= 0),
  fat_target INTEGER NOT NULL CHECK (fat_target >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Cached USDA food items (avoid repeated API calls)
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usda_fdc_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(10, 2) NOT NULL,
  protein_per_100g DECIMAL(10, 2) NOT NULL,
  carbs_per_100g DECIMAL(10, 2) NOT NULL,
  fat_per_100g DECIMAL(10, 2) NOT NULL,
  serving_size_g DECIMAL(10, 2),
  category TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_items_name ON food_items(name);
CREATE INDEX idx_food_items_usda_id ON food_items(usda_fdc_id);

-- Meals (breakfast, lunch, dinner, snack)
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type meal_type_enum NOT NULL,
  name TEXT, -- Optional custom name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, meal_type)
);

CREATE INDEX idx_meals_user_date ON meals(user_id, date DESC);

-- Individual food entries within meals
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE RESTRICT,
  quantity_g DECIMAL(10, 2) NOT NULL CHECK (quantity_g > 0),
  calories DECIMAL(10, 2) NOT NULL,
  protein DECIMAL(10, 2) NOT NULL,
  carbs DECIMAL(10, 2) NOT NULL,
  fat DECIMAL(10, 2) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);

-- Daily summary (materialized/trigger-updated for performance)
CREATE TABLE daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(10, 2) DEFAULT 0,
  total_carbs DECIMAL(10, 2) DEFAULT 0,
  total_fat DECIMAL(10, 2) DEFAULT 0,
  calories_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  has_logged BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summary_user_date ON daily_summary(user_id, date DESC);

-- Function to update daily summary when meal_items change
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  meal_user_id UUID;
BEGIN
  -- Get meal date and user_id
  SELECT m.date, m.user_id INTO meal_date, meal_user_id
  FROM meals m
  WHERE m.id = COALESCE(NEW.meal_id, OLD.meal_id);

  -- Recalculate daily totals
  INSERT INTO daily_summary (user_id, date, total_calories, total_protein, total_carbs, total_fat, has_logged, updated_at)
  SELECT
    meal_user_id,
    meal_date,
    COALESCE(SUM(mi.calories), 0)::INTEGER,
    COALESCE(SUM(mi.protein), 0),
    COALESCE(SUM(mi.carbs), 0),
    COALESCE(SUM(mi.fat), 0),
    COUNT(*) > 0,
    NOW()
  FROM meals m
  LEFT JOIN meal_items mi ON m.id = mi.meal_id
  WHERE m.user_id = meal_user_id AND m.date = meal_date
  GROUP BY m.user_id, m.date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    has_logged = EXCLUDED.has_logged,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on meal_items insert/update/delete
CREATE TRIGGER trigger_update_daily_summary
AFTER INSERT OR UPDATE OR DELETE ON meal_items
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;

-- Policies (single-user for now, ready for auth expansion)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true); -- Adjust when auth is added

CREATE POLICY "Users can manage their goals" ON macro_goals
  FOR ALL USING (true); -- Adjust when auth is added

CREATE POLICY "Users can manage their meals" ON meals
  FOR ALL USING (true); -- Adjust when auth is added

CREATE POLICY "Users can manage their meal items" ON meal_items
  FOR ALL USING (true); -- Adjust when auth is added

CREATE POLICY "Users can view their daily summary" ON daily_summary
  FOR SELECT USING (true); -- Adjust when auth is added

-- Food items are public (read-only for users)
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Food items are viewable by all" ON food_items
  FOR SELECT USING (true);
```

### Data Models and Structure

```typescript
// types/macros.ts
export interface MacroGoal {
  id: string;
  user_id: string;
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  date: string; // ISO date string
  created_at: string;
}

export interface FoodItem {
  id: string;
  usda_fdc_id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g?: number;
  category?: string;
  last_synced: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name?: string;
  created_at: string;
  meal_items?: MealItem[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_item_id: string;
  food_item?: FoodItem; // Joined data
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  calories_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fat_target?: number;
  has_logged: boolean;
  updated_at: string;
}

export interface MacroProgress {
  current: number;
  target: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
}

export interface DailyProgress {
  date: string;
  calories: MacroProgress;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
}

// types/usda.ts
export interface USDASearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResponse {
  foods: USDASearchResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}
```

### List of Tasks to be Completed

```yaml
Task 1: Project Setup and Configuration
ACTION: Create Next.js project with TypeScript
  - npx create-next-app@latest macro-tracker --typescript --tailwind --app
  - Install dependencies: @supabase/supabase-js, recharts, zod, date-fns
  - Install SHAD CN: npx shadcn-ui@latest init

CREATE .env.example:
  - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  - USDA_API_KEY=your_usda_api_key (optional for higher rate limits)

Task 2: Setup Supabase Database
ACTION: Create Supabase project
  - Sign up at supabase.com
  - Create new project
  - Run migrations/001_initial_schema.sql in SQL Editor
  - Verify tables, indexes, triggers created

CREATE lib/supabase/client.ts:
  - PATTERN: Browser client with createClientComponentClient
  - Export typed client

CREATE lib/supabase/server.ts:
  - PATTERN: Server client with createServerComponentClient
  - For API routes and server components

Task 3: USDA API Integration
CREATE lib/api/usda.ts:
  - PATTERN: Fetch API with error handling
  - searchFoods(query: string): Promise<USDASearchResult[]>
  - getFoodDetails(fdcId: number): Promise<FoodItem>
  - Cache responses in Supabase food_items table
  - Normalize nutrients to per-100g format

CREATE app/api/usda/route.ts:
  - PATTERN: Next.js API route handler
  - Proxy USDA API to avoid CORS
  - Return normalized FoodItem format

Task 4: Install SHAD CN Components
ACTION: Install required components
  - npx shadcn-ui@latest add button card input dialog select
  - npx shadcn-ui@latest add form label progress badge
  - Verify components/ui/ populated

Task 5: Macro Calculation Utilities
CREATE lib/utils/calculations.ts:
  - calculateMacros(food: FoodItem, quantityG: number): MacroValues
  - calculateProgress(current: number, target: number): MacroProgress
  - aggregateMealMacros(mealItems: MealItem[]): MacroValues
  - PATTERN: Pure functions with TypeScript types

Task 6: Build Food Search Component
CREATE components/FoodSearch.tsx:
  - PATTERN: Debounced search input
  - Call /api/usda endpoint
  - Display results with macro info
  - "Add to meal" button with quantity input
  - Use SHAD CN Dialog for quantity selection

Task 7: Build Meal Components
CREATE components/MealSection.tsx:
  - PATTERN: Container for meal type (breakfast/lunch/dinner/snack)
  - Display meal_items with totals
  - "Add food" button opens FoodSearch

CREATE components/FoodItem.tsx:
  - Display individual food with quantity and macros
  - Edit quantity inline
  - Delete button with confirmation

Task 8: Build Macro Goals Form
CREATE components/MacroGoalsForm.tsx:
  - PATTERN: SHAD CN Form with Zod validation
  - Inputs: calories_target, protein_target, carbs_target, fat_target
  - Save to macro_goals table
  - Upsert for current date

Task 9: Build Graph #1 - Streak Calendar
CREATE components/graphs/StreakCalendar.tsx:
  - PATTERN: Custom component with CSS Grid
  - Fetch daily_summary for past 90 days
  - Color cells by has_logged status
  - Calculate current streak
  - Display streak number prominently

Task 10: Build Graph #2 - Daily Macro Gauges
CREATE components/graphs/DailyMacroGauges.tsx:
  - PATTERN: 4 circular progress indicators
  - Use Recharts RadialBarChart
  - Real-time subscription to daily_summary for today
  - Color coding: green (90-110%), yellow (80-120%), red (outside)
  - Display: current/target (percentage)

Task 11: Build Graph #3 - Weekly Trend Chart
CREATE components/graphs/WeeklyTrendChart.tsx:
  - PATTERN: Recharts LineChart with multiple lines
  - Fetch daily_summary for past 7 days
  - 4 lines: calories, protein, carbs, fat
  - Reference lines for targets
  - Dual Y-axis (calories left, grams right)
  - Tooltip shows all values

Task 12: Build Graph #4 - Monthly Composition Chart
CREATE components/graphs/MonthlyCompositionChart.tsx:
  - PATTERN: Recharts AreaChart with stacked areas
  - Fetch daily_summary for past 30 days
  - Convert macros to calorie equivalents (P*4, C*4, F*9)
  - Stack: protein (blue), carbs (green), fat (orange)
  - Overlay: horizontal line for calorie target
  - Tooltip shows breakdown

Task 13: Real-time Subscriptions
CREATE lib/hooks/useRealtimeMacros.ts:
  - PATTERN: Supabase real-time channel subscription
  - Subscribe to daily_summary changes for today
  - Return current totals and goals
  - Trigger re-render when meal_items change

CREATE lib/hooks/useDailyGoals.ts:
  - Fetch macro_goals for current date
  - Provide updateGoals function
  - Cache in React state

CREATE lib/hooks/useStreakData.ts:
  - Fetch daily_summary with has_logged = true
  - Calculate consecutive days streak
  - Return streak count and calendar data

Task 14: Build Main Dashboard
CREATE app/page.tsx:
  - PATTERN: Server component for initial data fetch
  - Client components for interactive elements
  - Layout: 4 graphs + meal sections + goals form
  - Responsive grid layout

Task 15: Testing and Validation
ACTION: Manual testing checklist
  - Search for whole foods (steak, basmati rice, pomegranate)
  - Add food to meal with quantity
  - Verify macros calculate correctly
  - Set macro goals
  - Verify all 4 graphs display correctly
  - Log food and confirm charts update immediately
  - Test edit/delete food items
  - Verify streak calendar updates
  - Test on mobile viewport

Task 16: Documentation
CREATE README.md:
  - PATTERN: Setup instructions, environment variables
  - Database migration steps
  - USDA API key setup (optional)
  - Project structure overview
  - Development commands
  - Deployment guide (Vercel + Supabase)
```

### Per Task Pseudocode

```typescript
// Task 3: USDA API Integration
// lib/api/usda.ts
export async function searchFoods(query: string): Promise<FoodItem[]> {
  // CRITICAL: Cache check first to avoid API calls
  const cached = await supabase
    .from('food_items')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (cached.data && cached.data.length > 0) {
    return cached.data;
  }

  // USDA API call
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR Legacy&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      // API key optional for basic usage
      ...(process.env.USDA_API_KEY && { 'X-Api-Key': process.env.USDA_API_KEY })
    }
  });

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data: USDASearchResponse = await response.json();

  // CRITICAL: Normalize nutrients to per-100g
  const normalized = data.foods.map(food => normalizeUSDAFood(food));

  // Cache in Supabase
  await supabase.from('food_items').upsert(normalized, {
    onConflict: 'usda_fdc_id'
  });

  return normalized;
}

function normalizeUSDAFood(usda: USDASearchResult): FoodItem {
  // GOTCHA: USDA returns nutrients in various formats
  const getNutrient = (id: number) =>
    usda.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0;

  return {
    usda_fdc_id: usda.fdcId.toString(),
    name: usda.description,
    calories_per_100g: getNutrient(1008), // Energy (kcal)
    protein_per_100g: getNutrient(1003),  // Protein
    carbs_per_100g: getNutrient(1005),    // Carbs
    fat_per_100g: getNutrient(1004),      // Total fat
    category: usda.dataType
  };
}

// Task 10: Daily Macro Gauges with Real-time
// components/graphs/DailyMacroGauges.tsx
'use client';

export function DailyMacroGauges() {
  const { current, targets } = useRealtimeMacros(); // Real-time hook

  const macros = [
    {
      name: 'Calories',
      current: current.calories,
      target: targets.calories,
      color: '#ef4444'
    },
    {
      name: 'Protein',
      current: current.protein,
      target: targets.protein,
      color: '#3b82f6'
    },
    // ... carbs, fat
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {macros.map(macro => {
        const percentage = (macro.current / macro.target) * 100;
        const status = getStatus(percentage); // green/yellow/red logic

        return (
          <Card key={macro.name}>
            <RadialBarChart /* Recharts component */>
              {/* Configure radial bar with percentage and color */}
            </RadialBarChart>
            <div>
              <p>{macro.current} / {macro.target}</p>
              <p>{percentage.toFixed(0)}%</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Task 13: Real-time subscription
// lib/hooks/useRealtimeMacros.ts
export function useRealtimeMacros() {
  const [data, setData] = useState<DailySummary | null>(null);
  const supabase = createClientComponentClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const { data } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('date', today)
        .single();

      setData(data);
    };

    fetchData();

    // CRITICAL: Real-time subscription
    const channel = supabase
      .channel('daily_summary_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_summary',
          filter: `date=eq.${today}`
        },
        (payload) => {
          setData(payload.new as DailySummary);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [today]);

  return {
    current: {
      calories: data?.total_calories ?? 0,
      protein: data?.total_protein ?? 0,
      carbs: data?.total_carbs ?? 0,
      fat: data?.total_fat ?? 0
    },
    targets: {
      calories: data?.calories_target ?? 2000,
      protein: data?.protein_target ?? 150,
      carbs: data?.carbs_target ?? 200,
      fat: data?.fat_target ?? 65
    }
  };
}
```

### Integration Points
```yaml
ENVIRONMENT:
  - Create: .env.local
  - Variables:
      NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
      USDA_API_KEY=abc123 (optional - increases rate limit)

SUPABASE SETUP:
  - Create project at supabase.com
  - Copy project URL and anon key to .env.local
  - Run SQL migration in SQL Editor
  - Enable Realtime for daily_summary table
  - Verify RLS policies active

USDA API:
  - No API key required for basic usage
  - Optional: Sign up at https://fdc.nal.usda.gov/api-key-signup.html
  - Rate limit: 1000 requests/hour (no key), 3600/hour (with key)

DEPENDENCIES:
  - Update package.json:
    - @supabase/supabase-js: ^2.39.0
    - recharts: ^2.10.3
    - zod: ^3.22.4
    - date-fns: ^3.0.0
    - @hookform/resolvers: ^3.3.4
    - react-hook-form: ^7.49.3
```

## Validation Loop

### Level 1: TypeScript & Build
```bash
# Run these FIRST - fix any errors before proceeding
npm run build                   # Verify Next.js builds successfully
npm run type-check             # TypeScript type checking (add script if needed)

# Expected: No errors. If errors, READ and fix.
```

### Level 2: Database Verification
```sql
-- Run in Supabase SQL Editor after migration

-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: users, macro_goals, food_items, meals, meal_items, daily_summary

-- Verify trigger works
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');

INSERT INTO meals (user_id, date, meal_type)
VALUES ((SELECT id FROM users WHERE email = 'test@example.com'), CURRENT_DATE, 'breakfast');

INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat)
VALUES (
  (SELECT id FROM meals WHERE meal_type = 'breakfast' LIMIT 1),
  (SELECT id FROM food_items LIMIT 1), -- Assumes at least one food item exists
  200,
  300,
  40,
  30,
  10
);

-- Verify daily_summary updated automatically
SELECT * FROM daily_summary WHERE date = CURRENT_DATE;

-- Expected: Row exists with totals matching meal_items
```

### Level 3: Component Testing
```typescript
// Manual testing checklist

// Test Food Search
// 1. Open app in browser
// 2. Use FoodSearch component
// 3. Search "chicken breast"
// Expected: Results from USDA API appear

// Test Food Logging
// 1. Click "Add to Breakfast"
// 2. Enter quantity: 200g
// 3. Submit
// Expected: Food appears in meal, macros calculated

// Test Real-time Updates
// 1. Log a food item
// 2. Observe Graph #2 (Daily Gauges)
// Expected: Gauges update immediately without page refresh

// Test Graph #3 (Weekly Trends)
// 1. Navigate to past week
// 2. Add food items to different days
// Expected: Line chart updates with data points

// Test Streak Calendar
// 1. Log food for multiple consecutive days
// 2. Check Graph #1
// Expected: Streak count increments, calendar shows colored squares
```

### Level 4: Integration Test
```bash
# Full user flow test

# 1. Set macro goals
# Navigate to goals form
# Set: Calories 2200, Protein 180g, Carbs 220g, Fat 70g
# Expected: Goals saved, visible in gauges

# 2. Log full day of meals
# Breakfast: Eggs (100g), Sourdough (80g)
# Lunch: Chicken breast (200g), Basmati rice (150g)
# Dinner: Steak (250g), Broccoli (100g)
# Snack: Pomegranate (150g)

# 3. Verify all graphs
# Graph #1: Today shows as logged (colored)
# Graph #2: Gauges show totals vs targets
# Graph #3: Today's data point appears on 7-day chart
# Graph #4: Today's stacked area appears on 30-day chart

# 4. Test edit/delete
# Edit breakfast eggs quantity to 150g
# Expected: Macros recalculate, graphs update
# Delete snack pomegranate
# Expected: Totals adjust, graphs update

# 5. Test next day
# Change date to tomorrow
# Expected: Empty meals, new daily_summary row, graphs show 2 days
```

## Final Validation Checklist
- [ ] Next.js app builds without errors
- [ ] All TypeScript types compile
- [ ] Database schema created successfully
- [ ] Trigger updates daily_summary automatically
- [ ] USDA API returns search results
- [ ] Food items cache in Supabase
- [ ] Macros calculate correctly (quantity * per-100g / 100)
- [ ] Food logging works for all meal types
- [ ] Edit/delete food items works
- [ ] Macro goals can be set and updated
- [ ] Graph #1 (Streak Calendar) displays and calculates streak
- [ ] Graph #2 (Daily Gauges) shows real-time progress
- [ ] Graph #3 (Weekly Trends) shows 7-day data with target lines
- [ ] Graph #4 (Monthly Composition) shows 30-day stacked areas
- [ ] Charts update immediately when food logged (real-time)
- [ ] Responsive design works on mobile
- [ ] README.md includes setup instructions
- [ ] .env.example has all required variables

---

## Anti-Patterns to Avoid
- ❌ Don't hardcode user_id - architecture should support multi-user
- ❌ Don't skip caching USDA API responses - rate limits exist
- ❌ Don't ignore date timezone issues - always use UTC for daily boundaries
- ❌ Don't recalculate macros on every render - use daily_summary table
- ❌ Don't forget 'use client' directive for Recharts components
- ❌ Don't skip real-time subscriptions - charts must update immediately
- ❌ Don't hardcode macro goals - allow user customization
- ❌ Don't mix server/client Supabase clients - use correct one per context
- ❌ Don't ignore USDA nutrient ID mapping - nutrient positions vary
- ❌ Don't commit .env.local with real credentials

## MCP Server Usage During Development

### Supabase MCP
**Use for:**
- Generating SQL schema (already included above)
- Creating complex queries for graph data aggregation
- Testing SQL queries before implementing in code
- Viewing table data during development

**Example prompts:**
- "Generate SQL to get 7-day macro totals grouped by date"
- "Show me all meal_items for user X on date Y"
- "Create a view for monthly macro composition"

### Iconify MCP
**Use for:**
- Finding icons for UI elements

**Example prompts:**
- "Find flame icon for calories"
- "Find muscle icon for protein"
- "Find grain/wheat icon for carbs"
- "Find droplet icon for fat"
- "Find icons for breakfast, lunch, dinner, snack"
- "Find calendar icon for streak tracker"
- "Find chart icons for graphs"

### SHAD CN UI MCP
**Use for:**
- Generating component code quickly
- Understanding component API and props
- Finding the right component for a use case

**Example prompts:**
- "Show me how to use Dialog component for quantity input"
- "Generate a Form component with Zod validation"
- "How to use Progress component for macro gauges"
- "Create a Card component for meal sections"

## Confidence Score: 8/10

High confidence due to:
- Clear tech stack with proven libraries
- Well-defined database schema with triggers
- Straightforward USDA API integration
- Recharts has good documentation for all 4 graph types
- Supabase real-time is well-supported

Minor uncertainty on:
- USDA API nutrient ID mapping (may need adjustment per food type)
- Recharts dual Y-axis configuration for Graph #3
- Optimal caching strategy for USDA responses
- Streak calculation edge cases (timezone boundaries)

These uncertainties are resolvable during implementation with testing and API exploration.
