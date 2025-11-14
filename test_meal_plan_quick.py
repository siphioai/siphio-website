#!/usr/bin/env python3
"""Quick test to verify meal plan generation with correct model."""

import asyncio
import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from agent.meal_plan_generator import generate_meal_plan_structured
from datetime import datetime, timedelta

async def test_meal_plan():
    """Test meal plan generation with correct model."""

    # Get Monday of this week
    today = datetime.now()
    days_since_monday = today.weekday()
    week_start = (today - timedelta(days=days_since_monday)).strftime('%Y-%m-%d')

    # User targets
    user_targets = {
        'calories': 2000,
        'protein': 150,
        'carbs': 200,
        'fat': 67
    }

    # Empty favorites list (to test without favorites)
    favorite_foods = []

    print(f"🧪 Testing Meal Plan Generation")
    print(f"   Week start: {week_start}")
    print(f"   User targets: {user_targets}")
    print(f"   Favorite foods: {len(favorite_foods)}")
    print(f"\n⏱️  Starting generation...\n")

    try:
        start_time = datetime.now()

        meal_plan = await generate_meal_plan_structured(
            user_targets=user_targets,
            favorite_foods=favorite_foods,
            week_start=week_start
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"\n✅ SUCCESS!")
        print(f"   Generation time: {duration:.2f} seconds")
        print(f"   Days generated: {len(meal_plan.days)}")
        print(f"   Week start: {meal_plan.week_start}")
        print(f"\n📊 Sample Day (Monday):")
        monday = meal_plan.days[0]
        print(f"   Date: {monday.date}")
        print(f"   Day: {monday.day_name}")
        print(f"   Meals: {len(monday.meals)}")
        print(f"   Daily totals:")
        print(f"     - Calories: {monday.daily_totals.calories}")
        print(f"     - Protein: {monday.daily_totals.protein}g")
        print(f"     - Carbs: {monday.daily_totals.carbs}g")
        print(f"     - Fat: {monday.daily_totals.fat}g")

        # Verify within tolerance
        tolerance = 0.05
        cal_diff = abs(monday.daily_totals.calories - user_targets['calories']) / user_targets['calories']
        if cal_diff <= tolerance:
            print(f"\n✅ Macro accuracy: Within ±5% tolerance")
        else:
            print(f"\n⚠️  Macro accuracy: {cal_diff*100:.1f}% deviation (target ±5%)")

        return True

    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_meal_plan())
    sys.exit(0 if success else 1)
