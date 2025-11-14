# AI-Powered Meal Plan Generator - Conversational 7-Day Meal Planning System

## FEATURE:

- **AI nutrition coach agent tool** that generates personalized 7-day meal plans via natural language
- **Conversational interface** - User types "Create me a meal plan for next week" → Agent generates structured meal plan
- **Smart integration** - Uses existing tools (`fetch_today_status`, `fetch_favorite_foods`) for personalized meal generation
- **In-chat calendar UI** - Beautiful, interactive meal plan calendar rendered above chat messages
- **Claude 3.5 Haiku powered** - Fast (<2s), cost-effective ($0.01/plan), structured output generation
- **Single-day regeneration** - User can regenerate individual days or request modifications in chat
- **Dependency injection pattern** - Clean architecture using Pydantic AI's deps system for meal plan data flow
- **Zero endpoint duplication** - All functionality through existing `/api/chat` endpoint

## ARCHITECTURE OVERVIEW:

### Backend Flow
```
User → Chat Message → AI Agent → generate_meal_plan() tool
                                        ↓
                      Uses: fetch_today_status() (macro targets)
                           fetch_favorite_foods() (preferred foods)
                                        ↓
                      Claude 3.5 Haiku structured output (JSON meal plan)
                                        ↓
                      Save to meal_plans table + Store in deps.generated_meal_plan
                                        ↓
                      Return conversational response + meal_plan in ChatResponse
```

### Frontend Flow
```
Chat Input → API Call → Response with optional meal_plan field
                                    ↓
              meal_plan exists? → Render MealPlanCalendar component above messages
                                    ↓
              User clicks day → Expand with Framer Motion animation
              User clicks regenerate → Send chat message → Agent regenerates day
```

## EXAMPLES:

In the `api/agent/` folder, review existing patterns for Pydantic AI agent development:

- `api/agent/coach_agent.py` - Main agent definition using Claude 3.5 Haiku
- `api/agent/tools.py` - Tool registration pattern with `@nutrition_coach.tool` decorator
- `api/agent/dependencies.py` - Dependency injection using `@dataclass` pattern
- `api/agent/providers.py` - LLM provider configuration with environment-based settings
- `api/main.py` - Chat endpoint implementation with proper auth and response handling

**Frontend component patterns:**
- `macro-tracker/components/AINutritionCoach.tsx` - Chat UI structure and state management
- `macro-tracker/components/graphs/DailyMacroGauges.tsx` - Card-based UI with gradients and animations
- `macro-tracker/components/ui/card.tsx` - Shadcn/ui card component system
- `macro-tracker/app/globals.css` - Design system with color variables and animations

## DOCUMENTATION:

### Backend
- **Pydantic AI**: https://ai.pydantic.dev/
- **Pydantic AI Tools**: https://ai.pydantic.dev/tools/
- **Pydantic AI Structured Outputs**: https://ai.pydantic.dev/results/#structured-result-validation
- **Claude 3.5 Haiku**: https://docs.anthropic.com/en/docs/about-claude/models#model-comparison-table
- **FastAPI**: https://fastapi.tiangolo.com/
- **Supabase Python**: https://supabase.com/docs/reference/python/

### Frontend
- **Next.js App Router**: https://nextjs.org/docs/app
- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com/docs
- **React Hooks**: https://react.dev/reference/react

## CURRENT STATE ANALYSIS:

### Existing Backend Components
- **AI Agent**: Claude 3.5 Haiku-powered nutrition coach (`api/agent/coach_agent.py`)
- **Tools**: 4 existing tools - `fetch_today_status`, `fetch_weekly_progress`, `fetch_pattern_analysis`, `fetch_favorite_foods`
- **Database**: Supabase with tables: `daily_summary`, `macro_goals`, `user_favorites`, `meal_items`, `meals`
- **API Endpoint**: `POST /api/chat` with JWT authentication
- **Response Format**: `ChatResponse` with `response`, `conversation_history`, `usage` fields

### Existing Frontend Components
- **Chat UI**: `AINutritionCoach.tsx` - Slide-in panel (500-600px width) with gradient header
- **Design System**:
  - Primary Blue (#0170B9), Green (#10B981), Amber (#F59E0B), Purple (#8B5CF6)
  - Gradient backgrounds: `from-primary/5 to-chart-2/5` patterns
  - Rounded corners: `rounded-2xl` (20px)
  - Hover effects: `hover:scale-105 hover:shadow-lg`
  - Animated elements: Pulsing gradients, fade-in transitions
- **Component Library**: Shadcn/ui with custom styling
- **State Management**: React hooks with sessionStorage persistence

## SOLUTION: AI MEAL PLAN GENERATOR

### Technical Approach

**Backend Strategy:**
1. **New Tool**: `generate_meal_plan(duration_days: int = 7)` using `@nutrition_coach.tool`
2. **Dependency Injection**: Add `generated_meal_plan: Optional[Dict] = None` to `CoachAgentDependencies`
3. **Structured Output**: Use Claude's tool calling for JSON schema enforcement
4. **Data Sources**:
   - User macro targets from `fetch_today_status()`
   - Favorite foods from `fetch_favorite_foods()`
   - Fallback to frequently logged foods if no favorites
5. **Database**: New `meal_plans` table with JSONB plan data
6. **Response Pattern**: Store plan in `deps.generated_meal_plan`, return via `ChatResponse.meal_plan`

**Frontend Strategy:**
1. **Update Interface**: Add optional `meal_plan` field to `ChatResponse` TypeScript interface
2. **New Component**: `MealPlanCalendar.tsx` with Framer Motion animations
3. **Integration Point**: Render calendar above messages in `AINutritionCoach` dialog
4. **UI Pattern**: Match existing design system (gradients, rounded-2xl, chart colors)
5. **Interaction**:
   - Grid layout: 2 cols mobile → 4 cols tablet → 7 cols desktop
   - Click to expand day with smooth animation
   - Regenerate button per day
   - Collapse/expand with layout animation

### Database Schema

#### New Table: `meal_plans`
```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, week_start_date);
```

#### Plan Data Structure (JSONB)
```typescript
{
  "week_start": "2025-01-13",
  "daily_target": {
    "calories": 2000,
    "protein": 160,
    "carbs": 200,
    "fat": 65
  },
  "days": [
    {
      "date": "2025-01-13",
      "day_name": "Monday",
      "meals": [
        {
          "id": "meal_001",
          "name": "Greek Yogurt Protein Bowl",
          "meal_type": "breakfast",
          "foods": [
            {
              "name": "Greek Yogurt 0% Fat",
              "quantity_g": 200,
              "calories": 120,
              "protein": 20,
              "carbs": 9,
              "fat": 0
            }
          ],
          "totals": {
            "calories": 357,
            "protein": 24.7,
            "carbs": 51,
            "fat": 6.3
          }
        }
      ],
      "daily_totals": {
        "calories": 2010,
        "protein": 162,
        "carbs": 205,
        "fat": 63
      }
    }
  ]
}
```

### UI/UX Design Specifications

**Design System Alignment:**
- **Colors**: Use existing chart colors (chart-1: #0170B9, chart-2: #10B981, chart-3: #F59E0B, chart-4: #8B5CF6)
- **Status Colors**:
  - On track (95-105%): Green (chart-2)
  - Over (>105%): Red (destructive)
  - Under (<95%): Amber (chart-3)
- **Typography**: Gradient text-clip on headers matching `DailyMacroGauges`
- **Spacing**: Consistent p-4, gap-3 grid pattern
- **Borders**: `border-border/50` opacity throughout
- **Animations**:
  - Staggered entrance: `delay: index * 0.05`
  - Smooth expand: `duration: 0.3, ease: 'easeInOut'`
  - Hover scale: `hover:scale-105`
- **Icons**: Emoji style (🗓️📊🌅🍽️🌙💪) matching macro gauges

**Component Structure:**
```
MealPlanCalendar
  └─ Card (bg-gradient, border-0, shadow-none)
      ├─ CardHeader
      │   ├─ Calendar icon + title (gradient text)
      │   └─ Daily target badges (rounded-full, chart colors)
      └─ CardContent
          └─ Grid (2/4/7 cols responsive)
              └─ DayCard[] (motion.div with layout prop)
                  ├─ Collapsed: Day name, calories, status dots, percentage
                  └─ Expanded: Full meal breakdown + regenerate button
```

## IMPLEMENTATION PHASES:

### Phase 1: Backend Foundation (Days 1-7)
**Goal**: Core meal plan generation working end-to-end

1. **Database Setup** (Day 1-2)
   - Create `meal_plans` table
   - Add database query functions (`save_meal_plan`, `get_meal_plan`, `update_meal_plan`)
   - Test CRUD operations

2. **Agent Tool Implementation** (Day 3-4)
   - Add `generated_meal_plan` field to `CoachAgentDependencies`
   - Implement `generate_meal_plan()` tool with Claude structured output
   - Create meal generation prompt with strict JSON schema
   - Implement smart food selection (favorites → frequently logged → defaults)

3. **API Integration** (Day 5-6)
   - Update `ChatResponse` model with optional `meal_plan` field
   - Modify `/api/chat` endpoint to return `deps.generated_meal_plan`
   - Test with Postman/curl

4. **Testing & Validation** (Day 7)
   - Test with various user profiles (favorites, no favorites, new users)
   - Validate JSON structure matches schema
   - Test macro accuracy (within ±5%)

### Phase 2: Frontend Integration (Days 8-14)
**Goal**: Beautiful, interactive meal plan calendar in chat UI

1. **Type Definitions** (Day 8)
   - Create TypeScript interfaces (`MealPlan`, `MealPlanDay`, `Meal`, `Food`)
   - Update `ChatResponse` interface
   - Create `MealPlanCalendar.tsx` component skeleton

2. **Component Development** (Day 9-11)
   - Build `MealPlanCalendar` with Framer Motion
   - Build `DayCard` subcomponent with expand/collapse
   - Build `ExpandedDayView` with meal breakdown
   - Add animations (staggered entrance, smooth expand)

3. **Integration** (Day 12-13)
   - Integrate into `AINutritionCoach.tsx` above messages
   - Parse `meal_plan` from response
   - Handle state (expanded day, loading states)
   - Add smooth scroll on meal plan appearance

4. **Polish & Testing** (Day 14)
   - Test responsive grid (mobile, tablet, desktop)
   - Test animations (entrance, expand, collapse)
   - Verify color consistency with design system
   - Cross-browser testing

### Phase 3: Day Regeneration (Days 15-21)
**Goal**: Users can modify individual days conversationally

1. **Backend** (Day 15-17)
   - Implement `regenerate_day(day_index: int, constraints: str)` tool
   - Update database queries for partial plan updates
   - Test day regeneration with constraints ("Make Friday vegetarian")

2. **Frontend** (Day 18-20)
   - Add regenerate button to each day card
   - Implement loading state during regeneration
   - Update UI optimistically
   - Handle errors gracefully

3. **Testing** (Day 21)
   - Test full flow: generate → regenerate → modify
   - Test conversational modifications
   - Performance testing (regeneration speed)

### Phase 4: Polish & Optimization (Days 22-28)
**Goal**: Production-ready with error handling and rate limiting

1. **Error Handling** (Day 22-23)
   - Graceful fallbacks if meal generation fails
   - User-friendly error messages
   - Retry mechanism for failed generations

2. **Rate Limiting** (Day 24-25)
   - Free tier: 1 plan/day, 3 regenerations/day
   - Premium: Unlimited
   - Display limit status in UI

3. **Performance** (Day 26-27)
   - Optimize Claude prompt for faster generation
   - Implement caching for common meal combinations
   - Lazy load meal details on expand

4. **Final Testing** (Day 28)
   - End-to-end testing with real users
   - Load testing (concurrent meal generations)
   - Documentation updates

## OTHER CONSIDERATIONS:

### Environment Variables
- ✅ **Already configured**: `LLM_API_KEY`, `LLM_MODEL`, `LLM_PROVIDER`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- ❌ **No new variables needed**: Uses existing Claude 3.5 Haiku configuration

### Development Setup
- **Virtual environment**: Already exists in `api/venv/` with Pydantic AI dependencies
- **Database migrations**: Use Supabase dashboard or migration scripts
- **Frontend dependencies**: Already has Framer Motion, Tailwind CSS, Shadcn/ui
- **No additional package installations required**

### Code Quality Standards
- **Backend**: Follow Pydantic AI best practices (type hints, async/await, dependency injection)
- **Frontend**: Follow existing component patterns (Shadcn/ui, Framer Motion, TypeScript strict mode)
- **Testing**: Write unit tests for meal generation logic, integration tests for full flow
- **Security**: Use existing JWT auth, validate user permissions, sanitize user inputs

### Performance Targets
- **Meal generation**: <2s for 7-day plan (Claude 3.5 Haiku)
- **UI rendering**: <300ms for calendar appearance
- **Day regeneration**: <1.5s per day
- **Database queries**: <50ms for plan retrieval
- **Total user experience**: <3s from request to rendered calendar

### Cost Management
- **Meal generation**: ~$0.01 per 7-day plan (Claude 3.5 Haiku pricing)
- **Rate limiting**: Prevent abuse with free tier limits
- **Token optimization**: Use concise prompts, cache common patterns
- **Estimated monthly cost**: $20-50 for 2000-5000 plan generations

### Success Metrics
- **User adoption**: 40%+ of users generate at least one meal plan
- **Regeneration usage**: 60%+ of plans have at least one day regenerated
- **User satisfaction**: >85% report meal plans are helpful
- **Macro accuracy**: >90% of plans within ±5% of target macros
- **Performance**: >95% of generations complete within 2s

### Future Enhancements (Post-MVP)
- **Grocery lists**: "Show me the shopping list" → Extract all foods with quantities
- **Meal templates**: "Save this as 'Cutting Plan'" → Store plan as reusable template
- **PDF export**: "Export to PDF" → Generate printable meal plan
- **Auto-refresh**: Regenerate plan weekly automatically
- **Meal photos**: AI-generated food images using DALL-E (optional)
- **Dietary preferences**: Support for vegetarian, vegan, keto, etc.
- **Custom duration**: Support for 3-day, 10-day, or custom durations

## USER EXPERIENCE FLOW:

### Primary Flow - Generate Meal Plan
```
1. User opens AI Coach (clicks Bot icon)
2. User types: "Create me a meal plan for next week"
3. Agent shows typing indicator (3 animated dots)
4. Agent generates plan using Claude 3.5 Haiku (2s)
5. Calendar appears above messages with smooth slide-in animation
6. Agent responds: "✅ I've created your 7-day meal plan based on your macro targets!"
7. User sees 7 day cards in grid layout
8. User taps Monday → Card expands with meal breakdown
9. Total time: ~3-4 seconds from request to interactive calendar
```

### Secondary Flow - Regenerate Day
```
1. User types: "Make Friday vegetarian"
2. Agent recognizes regeneration request
3. Agent regenerates Friday with vegetarian constraint
4. UI updates Friday card with new meals
5. Agent responds: "✅ Updated Friday with vegetarian options!"
6. Total time: ~2 seconds for single-day update
```

### Tertiary Flow - Modify Constraints
```
1. User types: "Can you make the whole week high protein?"
2. Agent regenerates entire plan with protein focus
3. Calendar updates with new plan
4. Agent explains changes made
5. Total time: ~3 seconds for full regeneration
```

## EXPECTED OUTCOMES:

### Quantitative
- **Feature adoption**: 40-60% of AI coach users try meal planning within first week
- **Time saved**: 10-15 minutes per user per week (vs manual meal planning)
- **Engagement**: 3x increase in AI coach usage duration
- **Retention**: 15-20% improvement in 7-day retention

### Qualitative
- **User feedback**: "This is amazing!", "Saves so much time", "Better than other apps"
- **Competitive differentiation**: Unique feature not found in MyFitnessPal, Cronometer, etc.
- **Premium conversion**: Strong feature for premium tier value proposition
- **Word of mouth**: Highly shareable feature that drives referrals

### Technical
- **Clean architecture**: Reusable pattern for future AI tools
- **Scalable**: Can handle 10,000+ meal plans with current infrastructure
- **Maintainable**: Well-documented, type-safe, follows existing patterns
- **Performant**: Sub-3-second user experience with Claude 3.5 Haiku

---

*This feature transforms the AI nutrition coach from a reactive Q&A tool into a proactive meal planning assistant, creating genuine "wow moments" for users while maintaining the clean, conversational interface they already love.*
