#!/usr/bin/env python3
"""Test script to debug meal plan generation validation errors."""

import asyncio
import sys
import os

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from agent.meal_plan_generator import generate_meal_plan_structured
from datetime import datetime, timedelta

async def test_meal_plan_generation():
    """Test meal plan generation with sample data."""

    # Sample user targets
    user_targets = {
        'calories': 2000,
        'protein': 150,
        'carbs': 200,
        'fat': 67
    }

    # Sample favorite foods (simplified)
    favorite_foods = [
        {
            'name': 'Greek Yogurt 0% Fat',
            'calories_per_100g': 59,
            'protein_per_100g': 10.2,
            'carbs_per_100g': 3.6,
            'fat_per_100g': 0.4
        },
        {
            'name': 'Chicken Breast Grilled',
            'calories_per_100g': 165,
            'protein_per_100g': 31,
            'carbs_per_100g': 0,
            'fat_per_100g': 3.6
        },
        {
            'name': 'Brown Rice Cooked',
            'calories_per_100g': 111,
            'protein_per_100g': 2.6,
            'carbs_per_100g': 23,
            'fat_per_100g': 0.9
        }
    ]

    # Get next Monday's date
    today = datetime.now()
    days_until_monday = (7 - today.weekday()) % 7
    next_monday = today + timedelta(days=days_until_monday if days_until_monday > 0 else 7)
    week_start = next_monday.strftime('%Y-%m-%d')

    print(f"\n{'='*60}")
    print(f"Testing Meal Plan Generation")
    print(f"{'='*60}")
    print(f"Week Start: {week_start}")
    print(f"User Targets: {user_targets}")
    print(f"Favorite Foods: {len(favorite_foods)} items")
    print(f"{'='*60}\n")

    try:
        meal_plan = await generate_meal_plan_structured(
            user_targets=user_targets,
            favorite_foods=favorite_foods,
            week_start=week_start
        )

        print(f"\n{'='*60}")
        print("✅ SUCCESS - Meal Plan Generated!")
        print(f"{'='*60}")
        print(f"Days: {len(meal_plan.days)}")
        print(f"Week Start: {meal_plan.week_start}")
        for day in meal_plan.days:
            print(f"  {day.day_name} ({day.date}): {len(day.meals)} meals")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"\n{'='*60}")
        print("❌ ERROR - Meal Plan Generation Failed")
        print(f"{'='*60}")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print(f"{'='*60}\n")
        print("\nCheck backend logs for detailed validation errors:")
        print("tail -f /tmp/backend.log\n")

if __name__ == "__main__":
    asyncio.run(test_meal_plan_generation())
