"""
Claude-powered meal plan generator using chunked structured outputs.

This module creates personalized 7-day meal plans by generating 3-4 days at a time
using Claude 4.5 Haiku with Pydantic AI's structured output capabilities.
Claude 4.5 Haiku provides faster and more reliable structured output generation.
This optimized chunking approach reduces API calls from 4 to 2 for faster generation.
"""

import logging
import os
import asyncio
from datetime import datetime, timedelta
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.settings import ModelSettings
from models.meal_plan import DayChunk, MealPlan, MacroTotals, DayName
from agent.settings import load_settings

logger = logging.getLogger(__name__)

# Load settings and configure Anthropic API key
settings = load_settings()
os.environ['ANTHROPIC_API_KEY'] = settings.llm_api_key

# System prompt for chunked meal plan generation
DAY_CHUNK_SYSTEM_PROMPT = """You are an expert nutritionist creating personalized meal plans.

CRITICAL: Generate 1-2 days of meals with COMPLETE structure for each day.

REQUIRED STRUCTURE:
{
  "daily_target": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 67
  },
  "days": [
    {
      "date": "2025-01-13",
      "day_name": "Monday",
      "meals": [
        {
          "id": "meal_monday_001_breakfast",
          "name": "Protein Breakfast Bowl",
          "meal_type": "breakfast",
          "foods": [
            {
              "name": "Greek Yogurt 0% Fat",
              "quantity_g": 200,
              "calories": 118,
              "protein": 20.4,
              "carbs": 7.2,
              "fat": 0.8
            }
          ],
          "totals": {
            "calories": 118,
            "protein": 20.4,
            "carbs": 7.2,
            "fat": 0.8
          }
        }
      ],
      "daily_totals": {
        "calories": 2000,
        "protein": 150,
        "carbs": 200,
        "fat": 67
      }
    }
  ]
}

ALLOWED VALUES (case-sensitive):
- meal_type: "breakfast", "lunch", "dinner", "snack" (lowercase)
- day_name: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" (exact capitalization)
- date format: "YYYY-MM-DD"

REQUIREMENTS:
1. Each day must have 3-4 meals
2. Each meal must have at least 1 food item
3. **CRITICAL: Daily totals MUST equal the sum of all meal totals for that day**
4. **CRITICAL: Daily totals MUST NEVER EXCEED user's macro targets**
5. **CRITICAL: Daily totals should be as close as possible to targets WITHOUT going over**
6. **YOU MUST adjust portion sizes (quantity_g) to stay UNDER or AT the targets**
7. All numbers >= 0 (quantity_g must be > 0)
8. Ensure variety - don't repeat the same meals

**MANDATORY CALCULATION PROCESS:**
1. First, plan the meals and their base foods
2. Calculate the initial totals for all meals combined
3. Compare to the user's daily targets
4. **IF TOTAL EXCEEDS TARGET**: DECREASE portion sizes until UNDER the target
5. **IF TOTAL IS UNDER TARGET**: INCREASE portion sizes to get closer (but NEVER exceed)
6. Fine-tune each macro by adjusting specific foods
7. **VERIFY: daily_totals MUST BE ≤ targets (never over, get as close as possible)**
8. Final check: Ensure NO macro exceeds its target

**CALCULATION RULES:**
- meal.totals = sum of all foods in that meal
- day.daily_totals = sum of all meal.totals for that day
- **CRITICAL**: daily_totals.calories ≤ target.calories (NEVER exceed)
- **CRITICAL**: daily_totals.protein ≤ target.protein (NEVER exceed)
- **CRITICAL**: daily_totals.carbs ≤ target.carbs (NEVER exceed)
- **CRITICAL**: daily_totals.fat ≤ target.fat (NEVER exceed)
- Aim to get within 1-2% UNDER the target, but NEVER go over

**DO NOT** generate meals that exceed the target. ALWAYS stay under and get as close as possible!

Generate complete, realistic meals with accurate macro calculations that HIT THE TARGET.
"""

# Model settings with increased max_tokens for structured output generation
model_settings = ModelSettings(
    max_tokens=8000,  # Increased from default to allow full meal plan generation
    temperature=0.7   # Slight creativity for meal variety
)

# Create chunk generator agent with Claude 4.5 Haiku for faster, more powerful generation
# Note: Uses Claude 4.5 Haiku for structured output, while chat uses 3.5 Haiku
day_chunk_generator = Agent(
    AnthropicModel("claude-haiku-4-5-20251001"),  # More powerful for meal generation
    output_type=DayChunk,  # Generate 1-2 days at a time
    system_prompt=DAY_CHUNK_SYSTEM_PROMPT,
    retries=5,  # Increased retries for handling temporary API overloads
    output_retries=3,  # Additional retries specifically for output validation
    model_settings=model_settings  # Apply max_tokens and temperature settings
)

# Day name mapping
DAY_NAMES = [
    DayName.MONDAY,
    DayName.TUESDAY,
    DayName.WEDNESDAY,
    DayName.THURSDAY,
    DayName.FRIDAY,
    DayName.SATURDAY,
    DayName.SUNDAY
]


async def generate_day_chunk(
    user_targets: dict,
    favorite_foods: list,
    start_date: str,
    day_indices: list[int],
    food_preferences: str = ""
) -> DayChunk:
    """
    Generate a chunk of 1-2 days of meals using Claude 4.5 Haiku.

    Args:
        user_targets: Daily macro targets
        favorite_foods: User's favorite foods with macro info
        start_date: Starting date for the chunk (YYYY-MM-DD)
        day_indices: Which day indices to generate (0-6 for Mon-Sun)

    Returns:
        DayChunk with 1-2 days of validated meals

    Note:
        Uses Claude 4.5 Haiku with max_tokens=8000 and output_retries=3
        for reliable structured output generation.
    """
    # Calculate actual dates
    base_date = datetime.strptime(start_date, '%Y-%m-%d')
    dates_and_days = []
    for idx in day_indices:
        date = base_date + timedelta(days=idx)
        dates_and_days.append({
            'date': date.strftime('%Y-%m-%d'),
            'day_name': DAY_NAMES[idx].value
        })

    # Build prompt
    prompt = f"""Create meals for the following day(s):

**Daily Macro Targets:**
- Calories: {user_targets['calories']}
- Protein: {user_targets['protein']}g
- Carbohydrates: {user_targets['carbs']}g
- Fat: {user_targets['fat']}g

**Days to generate:**
"""
    for info in dates_and_days:
        prompt += f"- {info['day_name']} ({info['date']})\n"

    prompt += "\n"

    # Add user's specific food preferences (HIGHEST PRIORITY)
    if food_preferences:
        prompt += f"""**🔴 CRITICAL USER FOOD PREFERENCES (MUST FOLLOW):**
{food_preferences}

**YOU MUST incorporate these preferences into the meal plan. This is a strict requirement!**

"""

    # Add favorite foods if available
    if favorite_foods and len(favorite_foods) > 0:
        prompt += "**User's Favorite Foods (use these when possible):**\n"
        for food in favorite_foods[:10]:  # Limit to top 10
            prompt += f"- {food['name']}: "
            prompt += f"{food['calories_per_100g']} cal/100g, "
            prompt += f"P: {food['protein_per_100g']}g, "
            prompt += f"C: {food['carbs_per_100g']}g, "
            prompt += f"F: {food['fat_per_100g']}g\n"
        prompt += "\n"
    else:
        prompt += "**Note:** No favorite foods provided. Use common healthy whole foods.\n\n"

    prompt += f"""**🔴 CRITICAL INSTRUCTIONS - STRICT UPPER LIMITS:**

YOUR PRIMARY GOAL: Generate meals where daily_totals are AS CLOSE AS POSSIBLE to targets WITHOUT EXCEEDING:

**ABSOLUTE MAXIMUM LIMITS (NEVER EXCEED):**
- Calories: ≤ {user_targets['calories']} cal (aim for {int(user_targets['calories'] * 0.98)}-{user_targets['calories']} cal)
- Protein: ≤ {user_targets['protein']}g (aim for {user_targets['protein'] * 0.98:.1f}-{user_targets['protein']}g)
- Carbs: ≤ {user_targets['carbs']}g (aim for {user_targets['carbs'] * 0.98:.1f}-{user_targets['carbs']}g)
- Fat: ≤ {user_targets['fat']}g (aim for {user_targets['fat'] * 0.98:.1f}-{user_targets['fat']}g)

**MANDATORY PROCESS:**
1. Plan the meals with initial portion sizes
2. Calculate total calories from all meals
3. **IF ANY TOTAL EXCEEDS TARGET**: IMMEDIATELY REDUCE portion sizes until ALL are under
4. **IF TOTALS ARE UNDER**: Carefully INCREASE portions to get closer (but NEVER exceed)
5. Fine-tune each macro by adjusting specific foods
6. **FINAL VERIFICATION**: Ensure ALL daily_totals ≤ targets (no exceptions!)

**PORTION SIZE STRATEGY:**
- Start with portions slightly BELOW what you think is needed
- Gradually increase until you're 1-2% under the target
- NEVER let any macro exceed its target
- For 3,100 calorie target: Use LARGE portions, but cap at 3,100 max
- For 2,000 calorie target: Use MODERATE portions, but cap at 2,000 max

**CALCULATION REQUIREMENTS:**
- daily_totals = sum of all meal.totals for that day
- meal.totals = sum of all foods in that meal
- **VERIFY**: daily_totals.calories ≤ {user_targets['calories']} (MANDATORY)
- **VERIFY**: daily_totals.protein ≤ {user_targets['protein']} (MANDATORY)
- **VERIFY**: daily_totals.carbs ≤ {user_targets['carbs']} (MANDATORY)
- **VERIFY**: daily_totals.fat ≤ {user_targets['fat']} (MANDATORY)

**OTHER REQUIREMENTS:**
- Include realistic portion sizes (scaled to target, but NEVER exceeding)
- Prioritize user's favorite foods when available
- Use a variety of foods (don't repeat the same meal)
- Ensure all calculations are accurate

🚨 CRITICAL: If ANY macro exceeds its target, you MUST reduce portions immediately!
✅ GOAL: Get as close as possible to targets while staying UNDER or AT the limit!

Please generate the meals now following the exact structure and hitting the EXACT targets.
"""

    logger.info(f"Generating chunk for days {day_indices}: {[d['day_name'] for d in dates_and_days]}")

    # Retry with exponential backoff for API overload errors (529)
    max_retries = 3
    base_delay = 2  # seconds

    for attempt in range(max_retries):
        try:
            result = await day_chunk_generator.run(prompt)
            chunk = result.output

            logger.info(f"Successfully generated chunk with {len(chunk.days)} day(s)")
            return chunk

        except Exception as e:
            error_str = str(e)
            is_overload = "overloaded" in error_str.lower() or "529" in error_str

            if is_overload and attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)  # Exponential backoff: 2s, 4s, 8s
                logger.warning(f"API overloaded, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(delay)
                continue

            logger.error(f"Failed to generate day chunk: {e}", exc_info=True)
            raise


async def generate_meal_plan_structured(
    user_targets: dict,
    favorite_foods: list,
    week_start: str,
    food_preferences: str = ""
) -> MealPlan:
    """
    Generate a complete 7-day meal plan by creating chunks of 1-2 days at a time.

    Uses Claude 4.5 Haiku with optimized settings (max_tokens=8000, output_retries=3)
    for reliable structured output generation.

    Args:
        user_targets: Daily macro targets (calories, protein, carbs, fat)
        favorite_foods: List of user's favorite foods with macro info
        week_start: Week start date (YYYY-MM-DD)
        food_preferences: User's specific food preferences from conversation
                         (e.g., "include steak and eggs daily", "lots of fruit")

    Returns:
        Validated MealPlan object with exactly 7 days

    Raises:
        Exception: If generation fails or validation errors occur
    """
    try:
        logger.info(f"Generating 7-day meal plan for week {week_start} using Claude 4.5 Haiku")
        logger.debug(f"User targets: {user_targets}")
        logger.debug(f"Favorite foods count: {len(favorite_foods) if favorite_foods else 0}")

        all_days = []

        # Generate in 2-day chunks (4 API calls total for 7 days)
        # Reduced chunk size ensures Claude 4.5 Haiku can generate complete responses
        # Chunks: [0,1], [2,3], [4,5], [6]
        chunks_to_generate = [
            [0, 1],     # Monday-Tuesday (2 days)
            [2, 3],     # Wednesday-Thursday (2 days)
            [4, 5],     # Friday-Saturday (2 days)
            [6]         # Sunday (1 day)
        ]

        for chunk_indices in chunks_to_generate:
            chunk = await generate_day_chunk(
                user_targets=user_targets,
                favorite_foods=favorite_foods,
                start_date=week_start,
                day_indices=chunk_indices,
                food_preferences=food_preferences
            )

            # Add days from this chunk
            all_days.extend(chunk.days)

            logger.debug(f"Total days generated so far: {len(all_days)}")

        # Validate we have exactly 7 days
        if len(all_days) != 7:
            raise ValueError(f"Expected 7 days, got {len(all_days)}")

        # Create MacroTotals object for daily_target
        daily_target = MacroTotals(
            calories=user_targets['calories'],
            protein=user_targets['protein'],
            carbs=user_targets['carbs'],
            fat=user_targets['fat']
        )

        # Create complete MealPlan
        meal_plan = MealPlan(
            week_start=week_start,
            daily_target=daily_target,
            days=all_days
        )

        # Validate that daily totals never exceed targets (strict upper limit)
        if not meal_plan.validate_macro_accuracy(tolerance=0.05):
            logger.warning(f"Generated meal plan for week {week_start} may exceed targets or be too far under (>5%)")
            # This means either: 1) Some values exceeded targets (CRITICAL), or 2) Values are >5% under target

        logger.info(f"Successfully generated complete meal plan for week {week_start} with {len(meal_plan.days)} days")
        return meal_plan

    except Exception as e:
        logger.error(f"Failed to generate complete meal plan: {e}", exc_info=True)
        raise
