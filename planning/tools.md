# Tools for AI Nutrition Coach Agent

## Overview

This specification defines the **3 core tools** needed for the AI Nutrition Coach agent to provide personalized nutrition insights. Each tool queries Supabase PostgreSQL database and pre-aggregates data to minimize token usage while maintaining conversational context.

**Design Philosophy:**
- **Minimal & focused**: Only essential tools for v1
- **Pre-aggregated data**: Return summaries, not raw rows
- **Single responsibility**: Each tool has one clear purpose
- **Simple parameters**: 1-3 parameters maximum per tool

---

## Tool 1: fetch_today_status

**Purpose:** Fetch today's current nutrition progress including totals logged so far and remaining amounts to hit targets.

**When to use:** User asks about current day status: "How am I doing today?", "What's my protein at?", "How many calories left?"

**Parameters:**
- No parameters required (uses `user_id` from context dependencies)

**Database Query:**
```python
# Query daily_summary table for today's date
# If no row exists, check macro_goals to determine if user has goals set
# Return current totals + targets + remaining amounts
```

**Returns:** String formatted summary
```
Today's Status (2025-11-06):
- Calories: 1450 of 2150 (67%)
- Protein: 87g of 160g (54%)
- Carbs: 145g of 200g (73%)
- Fat: 48g of 60g (80%)
- Has logged meals: Yes

Remaining to hit targets:
- Calories: 700 cal
- Protein: 73g
- Carbs: 55g
- Fat: 12g
```

**Error Handling:**
- If no goals set: Return "No nutrition goals set yet. User should set their daily macro targets first."
- If no meals logged: Return "No meals logged yet today. Goals: [targets]"
- If database error: Return "Unable to fetch today's status due to a technical issue. Please try again."

**Data Aggregation Strategy:**
- Single row from `daily_summary` table (already aggregated by database trigger)
- Calculate percentages and remaining amounts in tool
- Total tokens: ~150 tokens (concise summary)

**Implementation Notes:**
```python
@agent.tool
async def fetch_today_status(
    ctx: RunContext[CoachAgentDependencies]
) -> str:
    """
    Fetch today's nutrition status with current totals and remaining targets.

    Use this when user asks about their current day progress.
    """
    try:
        today = get_today_utc()

        # Query daily_summary for today
        response = await ctx.deps.supabase.table('daily_summary') \
            .select('*') \
            .eq('user_id', ctx.deps.user_id) \
            .eq('date', today) \
            .single() \
            .execute()

        # Handle edge cases and format response
        # ...

    except Exception as e:
        logger.error(f"fetch_today_status failed: {e}")
        return "Unable to fetch today's status due to a technical issue."
```

---

## Tool 2: fetch_weekly_progress

**Purpose:** Fetch weekly summary with aggregated statistics including averages, consistency metrics, and target hit rates.

**When to use:** User asks about recent progress: "How's my week?", "Am I consistent?", "How's my protein trend?"

**Parameters:**
- `days` (int, default=7): Number of days to analyze (1-30)

**Database Query:**
```python
# Query daily_summary table for last N days
# Pre-aggregate into summary statistics (averages, hit rates, streaks)
# Return summary object, not raw rows
```

**Returns:** String formatted summary
```
Weekly Summary (Last 7 days):
- Days analyzed: 7
- Days logged: 6 (86% consistency)

Average Daily Macros:
- Calories: 2,150
- Protein: 142.3g
- Carbs: 187.5g
- Fat: 55.2g

Target Hit Rates:
- Protein target hit: 71% of days (5 out of 7)
- Carbs within range: 86% of days (6 out of 7)
- Calories on target: 57% of days (4 out of 7)

Best protein day: 2025-11-03 (175g)
Worst protein day: 2025-11-01 (98g)
```

**Error Handling:**
- If `days` < 1 or > 30: Return "Error: days must be between 1 and 30"
- If no data found: Return "No nutrition data found for the last {days} days. Have you logged any meals?"
- If database timeout (>5s): Return "Database query timed out. Please try again."
- If database error: Return "Unable to fetch weekly progress. Please try again later."

**Data Aggregation Strategy:**
- Fetch N rows from `daily_summary` (N = days parameter)
- Calculate in Python:
  - Average macros (calories, protein, carbs, fat)
  - Consistency rate (days logged / total days)
  - Target hit rates (percentage of days hitting each macro target)
  - Best/worst days for each macro
- Return summary object (~200 tokens vs. ~1000+ tokens for raw rows)

**Implementation Notes:**
```python
@agent.tool
async def fetch_weekly_progress(
    ctx: RunContext[CoachAgentDependencies],
    days: int = 7
) -> str:
    """
    Fetch weekly progress summary with averages and consistency metrics.

    Use this when user asks about recent trends or weekly performance.

    Args:
        days: Number of days to analyze (1-30, default 7)
    """
    try:
        # Validate input
        if days < 1 or days > 30:
            return "Error: days must be between 1 and 30"

        start_date = get_date_n_days_ago(days)

        # Query with timeout
        response = await asyncio.wait_for(
            ctx.deps.supabase.table('daily_summary')
                .select('*')
                .eq('user_id', ctx.deps.user_id)
                .gte('date', start_date)
                .order('date', desc=True)
                .execute(),
            timeout=5.0
        )

        # Pre-aggregate statistics
        # ...

    except asyncio.TimeoutError:
        return "Database query timed out. Please try again."
    except Exception as e:
        logger.error(f"fetch_weekly_progress failed: {e}")
        return "Unable to fetch weekly progress."
```

---

## Tool 3: fetch_pattern_analysis

**Purpose:** Analyze eating patterns over longer periods (30+ days) to identify trends, consistency issues, and behavioral patterns.

**When to use:** User asks about long-term trends: "Why can't I stick to my carbs on weekends?", "What's my pattern with protein?", "How do I do on weekdays vs weekends?"

**Parameters:**
- `days` (int, default=30): Number of days to analyze (7-90)
- `pattern_type` (str, default="weekday_weekend"): Type of pattern analysis
  - "weekday_weekend": Compare weekdays vs weekends
  - "weekly_trend": Week-over-week trend analysis
  - "macro_consistency": Identify most/least consistent macro

**Database Query:**
```python
# Query daily_summary table for last N days
# Group data by pattern_type (e.g., weekday vs weekend)
# Calculate comparative statistics and identify patterns
```

**Returns:** String formatted analysis
```
Pattern Analysis - Weekday vs Weekend (Last 30 days):

Weekdays (Mon-Fri):
- Average calories: 2,100
- Average protein: 155g (97% of target)
- Average carbs: 180g (within target)
- Days logged: 21 out of 21 (100%)

Weekends (Sat-Sun):
- Average calories: 2,450 (+17% higher)
- Average protein: 125g (78% of target)
- Average carbs: 240g (+33% higher)
- Days logged: 7 out of 9 (78%)

Key Pattern:
Weekend carbs consistently exceed target by 30-40g, primarily from Saturday dinners (averaging 95g carbs vs weekday 50g). Consider adjusting weekend targets or planning higher-protein breakfast to balance.
```

**Error Handling:**
- If `days` < 7 or > 90: Return "Error: days must be between 7 and 90"
- If invalid `pattern_type`: Return "Error: pattern_type must be 'weekday_weekend', 'weekly_trend', or 'macro_consistency'"
- If insufficient data: Return "Need at least 7 days of logged data for pattern analysis"
- If database error: Return "Unable to perform pattern analysis. Please try again later."

**Data Aggregation Strategy:**
- Fetch N rows from `daily_summary` (N = days parameter, typically 30-90)
- Group by pattern type:
  - **weekday_weekend**: Split into Mon-Fri vs Sat-Sun, compare averages
  - **weekly_trend**: Group by week, show week-over-week changes
  - **macro_consistency**: Calculate standard deviation for each macro, identify which is most consistent
- Return insights with specific numbers and actionable patterns
- Total tokens: ~300-400 tokens (narrative summary with key stats)

**Implementation Notes:**
```python
@agent.tool
async def fetch_pattern_analysis(
    ctx: RunContext[CoachAgentDependencies],
    days: int = 30,
    pattern_type: str = "weekday_weekend"
) -> str:
    """
    Analyze eating patterns over time to identify trends and behavioral patterns.

    Use this when user asks about long-term trends, consistency issues, or
    wants to understand their eating patterns (e.g., weekday vs weekend).

    Args:
        days: Number of days to analyze (7-90, default 30)
        pattern_type: Type of analysis - "weekday_weekend", "weekly_trend", or "macro_consistency"
    """
    try:
        # Validate inputs
        if days < 7 or days > 90:
            return "Error: days must be between 7 and 90"

        valid_patterns = ["weekday_weekend", "weekly_trend", "macro_consistency"]
        if pattern_type not in valid_patterns:
            return f"Error: pattern_type must be one of {valid_patterns}"

        # Fetch data
        start_date = get_date_n_days_ago(days)
        response = await ctx.deps.supabase.table('daily_summary') \
            .select('*') \
            .eq('user_id', ctx.deps.user_id) \
            .gte('date', start_date) \
            .execute()

        # Perform pattern analysis based on type
        # ...

    except Exception as e:
        logger.error(f"fetch_pattern_analysis failed: {e}")
        return "Unable to perform pattern analysis."
```

---

## Tool Design Notes

### Rationale for Tool Selection

**Why these 3 tools?**

1. **fetch_today_status**: Core functionality - users need instant access to current day progress. This is the most frequent use case.

2. **fetch_weekly_progress**: Recent trends - users want to know if they're making progress over the last week. Provides accountability and motivation.

3. **fetch_pattern_analysis**: Deep insights - helps users understand WHY they struggle with certain macros or days. This is where AI coaching adds unique value.

**What's NOT included (and why):**
- ❌ **fetch_meal_breakdown**: Deferred to v2. Users can see meal details in the UI; agent should focus on insights, not raw data display.
- ❌ **fetch_frequent_foods**: Deferred to v2. Requires complex food_items joins; optimize data fetching first.
- ❌ **suggest_foods**: Out of scope. Agent should coach on patterns, not recommend specific foods (requires USDA API integration).

### Data Aggregation Strategy

**Token Optimization:**
- Daily summary: ~150 tokens (already aggregated by database)
- Weekly summary: ~200 tokens (7-30 rows → single summary object)
- Pattern analysis: ~300-400 tokens (30-90 rows → grouped insights)

**Total per conversation:** ~500-800 tokens for data (vs 2000+ tokens for raw database rows)

**Database Performance:**
- All queries use indexed columns (`user_id`, `date`)
- RLS automatically filters by `user_id`
- Queries limited to 90 days max (prevents runaway costs)
- Timeout after 5 seconds (prevents slow query issues)

### Error Handling Approach

**Graceful Degradation:**
All tools follow the same error handling pattern:
1. **Validate inputs** - Check parameter ranges, return user-friendly errors
2. **Set timeout** - Use `asyncio.wait_for(query, timeout=5.0)` to prevent hangs
3. **Handle edge cases** - No data, no goals, etc. → informative messages
4. **Catch all exceptions** - Log error, return generic message (never expose stack traces)

**Error Response Format:**
```python
try:
    # Tool logic
    return formatted_summary
except asyncio.TimeoutError:
    return "Database query timed out. Please try again."
except Exception as e:
    logger.error(f"tool_name failed: {e}")
    return "Unable to fetch data. Please try again later."
```

### Security Considerations

**RLS Enforcement:**
- All queries filter by `ctx.deps.user_id` from authenticated context
- Supabase RLS policies enforce data isolation at database level
- Service role key used in Python, but RLS still active

**Input Validation:**
- All parameters validated before database query
- Date strings must match YYYY-MM-DD format (validated by date helpers)
- Numeric parameters have range limits (1-90 days)
- No raw SQL (use Supabase client parameterized queries)

### Testing Strategy

**Unit Tests (with mocks):**
```python
@pytest.mark.asyncio
async def test_fetch_today_status_no_data():
    mock_supabase = AsyncMock()
    mock_supabase.table().select().eq().eq().single().execute.return_value.data = None

    deps = CoachAgentDependencies(supabase=mock_supabase, user_id="test")
    # Test tool returns appropriate message
```

**Integration Tests (with real database):**
```python
@pytest.mark.asyncio
async def test_fetch_weekly_progress_real_db():
    supabase = await get_supabase_client()
    deps = CoachAgentDependencies(supabase=supabase, user_id=TEST_USER_ID)

    # Use TestModel to force tool execution
    test_model = TestModel(call_tools=['fetch_weekly_progress'])
    with nutrition_coach.override(model=test_model):
        result = await nutrition_coach.run("How's my week?", deps=deps)
        assert 'Last 7 days' in result.data
```

---

## Implementation Checklist

### Phase 1: Database Query Functions
- [ ] Create `api/database/queries.py` module
- [ ] Implement `fetch_today_summary(supabase, user_id) -> Dict`
- [ ] Implement `fetch_weekly_summary(supabase, user_id, days) -> Dict`
- [ ] Implement `fetch_pattern_summary(supabase, user_id, days, pattern_type) -> Dict`
- [ ] Test queries independently with Supabase MCP server
- [ ] Add timeout handling and error recovery

### Phase 2: Agent Tool Registration
- [ ] Create `api/agent/tools.py` module
- [ ] Implement `@nutrition_coach.tool` decorated `fetch_today_status()`
- [ ] Implement `@nutrition_coach.tool` decorated `fetch_weekly_progress()`
- [ ] Implement `@nutrition_coach.tool` decorated `fetch_pattern_analysis()`
- [ ] Import tools in `coach_agent.py` to register with agent
- [ ] Verify tools registered: `len(nutrition_coach.tools) == 3`

### Phase 3: Tool Testing
- [ ] Write unit tests for each tool (with mocked Supabase)
- [ ] Write integration tests for each tool (with real Supabase)
- [ ] Test error handling (invalid inputs, timeouts, no data)
- [ ] Test edge cases (no goals, no logs, insufficient data)
- [ ] Run full test suite: `pytest api/tests/test_tools.py -v`

### Phase 4: Validation with TestModel
- [ ] Test agent with TestModel forcing tool calls
- [ ] Verify tool outputs are properly formatted for LLM consumption
- [ ] Test multi-turn conversations with tool usage
- [ ] Measure token usage (should be <800 tokens for data)
- [ ] Optimize tool output format if token usage is high

---

## Future Enhancements (v2)

**Additional Tools to Consider:**
1. **fetch_meal_breakdown**: Get detailed meal-by-meal view for a specific date
2. **fetch_frequent_foods**: Identify user's most-logged foods for suggestions
3. **fetch_macro_correlation**: Analyze which meals/foods help hit protein goals
4. **fetch_time_patterns**: Analyze logging times to identify meal timing patterns

**Tool Improvements:**
1. **Caching**: Add Redis caching for frequently accessed summaries (today's status)
2. **Real-time updates**: Subscribe to Supabase real-time for instant data refresh
3. **Predictive insights**: "Based on your morning meals, you're on track to hit 145g protein"
4. **Comparative analysis**: "This week vs last week" comparisons

---

## Conclusion

These **3 core tools** provide the essential data access layer for the AI Nutrition Coach agent:

1. **fetch_today_status** - Instant current progress (most frequent use case)
2. **fetch_weekly_progress** - Recent trends and consistency (accountability)
3. **fetch_pattern_analysis** - Deep behavioral insights (coaching value)

**Design Highlights:**
- ✅ Simple parameters (0-3 per tool)
- ✅ Pre-aggregated data (minimize tokens)
- ✅ Single responsibility (clear purpose)
- ✅ Robust error handling (graceful degradation)
- ✅ Testable (mocks + integration tests)
- ✅ Secure (RLS + input validation)

**Token Budget:**
- Today status: ~150 tokens
- Weekly progress: ~200 tokens
- Pattern analysis: ~300-400 tokens
- **Total per conversation:** 500-800 tokens (well under 2000 token target)

This minimal tool set enables the agent to provide personalized, data-informed coaching while maintaining cost efficiency and performance.