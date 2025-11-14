"""
Database query functions for nutrition data.
"""

from supabase import AsyncClient
from typing import Dict, List, Optional
import logging
from datetime import datetime
from utils.date_helpers import get_today_utc, get_date_n_days_ago

logger = logging.getLogger(__name__)


async def fetch_today_summary(
    supabase: AsyncClient,
    user_id: str
) -> Optional[Dict]:
    """
    Fetch today's daily_summary with current totals and targets.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID

    Returns:
        Dictionary with today's summary or None if no data
    """
    today = get_today_utc()

    try:
        response = await supabase.table('daily_summary') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('date', today) \
            .single() \
            .execute()

        if response.data:
            return response.data
    except Exception as daily_err:
        # No daily summary found, try to get goals instead
        logger.info(f"No daily summary for user {user_id}, checking macro_goals")
        pass

    # Check if user has goals set (either no daily summary or it failed)
    try:
        goals_response = await supabase.table('macro_goals') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('date', today) \
            .single() \
            .execute()

        if goals_response.data:
            # User has goals but hasn't logged yet
            return {
                'date': today,
                'total_calories': 0,
                'total_protein': 0,
                'total_carbs': 0,
                'total_fat': 0,
                'calories_target': goals_response.data['calories_target'],
                'protein_target': goals_response.data['protein_target'],
                'carbs_target': goals_response.data['carbs_target'],
                'fat_target': goals_response.data['fat_target'],
                'has_logged': False
            }
    except Exception as goals_err:
        # No goals found either
        logger.info(f"No macro_goals for user {user_id}")
        pass

    return None  # No goals set yet


async def fetch_weekly_summary(
    supabase: AsyncClient,
    user_id: str,
    days: int = 7
) -> Optional[Dict]:
    """
    Fetch and aggregate last N days of data.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        days: Number of days to analyze (default 7)

    Returns:
        Dictionary with aggregated weekly summary or None if no data
    """
    start_date = get_date_n_days_ago(days)

    try:
        response = await supabase.table('daily_summary') \
            .select('*') \
            .eq('user_id', user_id) \
            .gte('date', start_date) \
            .order('date', desc=True) \
            .execute()

        if not response.data or len(response.data) == 0:
            return None

        rows = response.data

        # Pre-aggregate into summary (minimize tokens)
        summary = {
            'period': f'Last {days} days',
            'days_analyzed': len(rows),
            'avg_calories': sum(r['total_calories'] for r in rows) / len(rows),
            'avg_protein': sum(r['total_protein'] for r in rows) / len(rows),
            'avg_carbs': sum(r['total_carbs'] for r in rows) / len(rows),
            'avg_fat': sum(r['total_fat'] for r in rows) / len(rows),
            'days_logged': sum(1 for r in rows if r['has_logged']),
            'consistency_rate': sum(1 for r in rows if r['has_logged']) / len(rows),
            'protein_target_hit_rate': sum(1 for r in rows if r['total_protein'] >= r['protein_target']) / len(rows),
            'carbs_target_hit_rate': sum(1 for r in rows if r['total_carbs'] <= r['carbs_target'] * 1.1) / len(rows),
            'calories_target_hit_rate': sum(1 for r in rows if abs(r['total_calories'] - r['calories_target']) <= 100) / len(rows),
            'best_protein_day': max(rows, key=lambda r: r['total_protein'])['date'],
            'worst_protein_day': min(rows, key=lambda r: r['total_protein'])['date']
        }

        return summary

    except Exception as e:
        logger.error(f"fetch_weekly_summary failed for user {user_id}: {e}")
        raise


async def fetch_pattern_summary(
    supabase: AsyncClient,
    user_id: str,
    days: int = 30,
    pattern_type: str = "weekday_weekend"
) -> Optional[Dict]:
    """
    Analyze eating patterns over time.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        days: Number of days to analyze (default 30)
        pattern_type: Type of analysis ("weekday_weekend", "weekly_trend", "macro_consistency")

    Returns:
        Dictionary with pattern analysis or None if insufficient data
    """
    start_date = get_date_n_days_ago(days)

    try:
        response = await supabase.table('daily_summary') \
            .select('*') \
            .eq('user_id', user_id) \
            .gte('date', start_date) \
            .execute()

        if not response.data or len(response.data) < 7:
            return None  # Need at least 7 days for pattern analysis

        rows = response.data

        if pattern_type == "weekday_weekend":
            # Split into weekdays vs weekends
            weekdays = []
            weekends = []

            for row in rows:
                date_obj = datetime.fromisoformat(row['date'])
                if date_obj.weekday() < 5:  # Mon-Fri
                    weekdays.append(row)
                else:  # Sat-Sun
                    weekends.append(row)

            if not weekdays or not weekends:
                return None

            return {
                'pattern_type': 'weekday_weekend',
                'weekday_count': len(weekdays),
                'weekend_count': len(weekends),
                'weekday_avg_calories': sum(r['total_calories'] for r in weekdays) / len(weekdays),
                'weekend_avg_calories': sum(r['total_calories'] for r in weekends) / len(weekends),
                'weekday_avg_protein': sum(r['total_protein'] for r in weekdays) / len(weekdays),
                'weekend_avg_protein': sum(r['total_protein'] for r in weekends) / len(weekends),
                'weekday_avg_carbs': sum(r['total_carbs'] for r in weekdays) / len(weekdays),
                'weekend_avg_carbs': sum(r['total_carbs'] for r in weekends) / len(weekends),
                'weekday_logged': sum(1 for r in weekdays if r['has_logged']) / len(weekdays),
                'weekend_logged': sum(1 for r in weekends if r['has_logged']) / len(weekends)
            }

        elif pattern_type == "macro_consistency":
            # Calculate standard deviation for each macro
            import statistics

            protein_values = [r['total_protein'] for r in rows if r['has_logged']]
            carbs_values = [r['total_carbs'] for r in rows if r['has_logged']]
            fat_values = [r['total_fat'] for r in rows if r['has_logged']]

            if len(protein_values) < 3:
                return None

            return {
                'pattern_type': 'macro_consistency',
                'protein_std': statistics.stdev(protein_values),
                'carbs_std': statistics.stdev(carbs_values),
                'fat_std': statistics.stdev(fat_values),
                'protein_avg': statistics.mean(protein_values),
                'carbs_avg': statistics.mean(carbs_values),
                'fat_avg': statistics.mean(fat_values)
            }

        else:
            return None  # Unsupported pattern type

    except Exception as e:
        logger.error(f"fetch_pattern_summary failed for user {user_id}: {e}")
        raise


async def fetch_user_favorites(
    supabase: AsyncClient,
    user_id: str
) -> List[Dict]:
    """
    Fetch user's favorite foods with nutritional information.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID

    Returns:
        List of favorite foods with their macro information
    """
    try:
        response = await supabase.table('user_favorites') \
            .select('*, food_items(*)') \
            .eq('user_id', user_id) \
            .order('favorited_at', desc=True) \
            .limit(20) \
            .execute()

        if not response.data:
            return []

        # Format for agent consumption
        favorites = []
        for fav in response.data:
            food = fav.get('food_items', {})
            if food:
                favorites.append({
                    'name': food.get('name', 'Unknown'),
                    'calories_per_100g': food.get('calories_per_100g', 0),
                    'protein_per_100g': food.get('protein_per_100g', 0),
                    'carbs_per_100g': food.get('carbs_per_100g', 0),
                    'fat_per_100g': food.get('fat_per_100g', 0),
                    'last_quantity_g': fav.get('last_quantity_g')
                })

        return favorites

    except Exception as e:
        logger.error(f"fetch_user_favorites failed for user {user_id}: {e}")
        return []  # Return empty list on error instead of raising


async def save_meal_plan(
    supabase: AsyncClient,
    user_id: str,
    week_start_date: str,
    plan_data: Dict
) -> Optional[Dict]:
    """
    Save or update a meal plan in the database.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        week_start_date: Start date of the week (YYYY-MM-DD format)
        plan_data: Complete meal plan data structure

    Returns:
        Saved meal plan record or None on error
    """
    try:
        response = await supabase.table('meal_plans') \
            .upsert({
                'user_id': user_id,
                'week_start_date': week_start_date,
                'plan_data': plan_data,
                'updated_at': datetime.utcnow().isoformat()
            }, on_conflict='user_id,week_start_date') \
            .execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    except Exception as e:
        logger.error(f"save_meal_plan failed for user {user_id}: {e}")
        return None


async def get_meal_plan(
    supabase: AsyncClient,
    user_id: str,
    week_start_date: str
) -> Optional[Dict]:
    """
    Fetch a meal plan for a specific week.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        week_start_date: Start date of the week (YYYY-MM-DD format)

    Returns:
        Meal plan data or None if not found
    """
    try:
        response = await supabase.table('meal_plans') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('week_start_date', week_start_date) \
            .single() \
            .execute()

        return response.data if response.data else None

    except Exception as e:
        logger.error(f"get_meal_plan failed for user {user_id}: {e}")
        return None


async def update_meal_plan_day(
    supabase: AsyncClient,
    user_id: str,
    week_start_date: str,
    day_index: int,
    updated_day_data: Dict
) -> Optional[Dict]:
    """
    Update a single day in an existing meal plan.

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        week_start_date: Start date of the week (YYYY-MM-DD format)
        day_index: Index of the day to update (0-6)
        updated_day_data: New data for the specific day

    Returns:
        Updated meal plan record or None on error
    """
    try:
        # First, fetch the existing plan
        existing_plan = await get_meal_plan(supabase, user_id, week_start_date)

        if not existing_plan or 'plan_data' not in existing_plan:
            logger.error(f"No existing meal plan found for user {user_id} on {week_start_date}")
            return None

        # Update the specific day
        plan_data = existing_plan['plan_data']
        if 'days' in plan_data and day_index < len(plan_data['days']):
            plan_data['days'][day_index] = updated_day_data

            # Save the updated plan
            return await save_meal_plan(supabase, user_id, week_start_date, plan_data)
        else:
            logger.error(f"Invalid day_index {day_index} for meal plan")
            return None

    except Exception as e:
        logger.error(f"update_meal_plan_day failed for user {user_id}: {e}")
        return None


async def fetch_frequently_logged_foods(
    supabase: AsyncClient,
    user_id: str,
    limit: int = 20
) -> List[Dict]:
    """
    Fetch user's most frequently logged foods (fallback when no favorites exist).

    Args:
        supabase: Async Supabase client
        user_id: Authenticated user ID
        limit: Maximum number of foods to return

    Returns:
        List of frequently logged foods with their macro information
    """
    try:
        # Query meal_items joined with food_items, grouped by food_item_id
        # This is a simplified version - actual implementation may need raw SQL
        response = await supabase.table('meal_items') \
            .select('food_item_id, food_items(*)') \
            .eq('user_id', user_id) \
            .limit(limit * 3) \
            .execute()  # Over-fetch to account for grouping

        if not response.data:
            return []

        # Count occurrences and format
        food_counts = {}
        for item in response.data:
            food = item.get('food_items', {})
            if food:
                food_id = item['food_item_id']
                if food_id not in food_counts:
                    food_counts[food_id] = {
                        'name': food.get('name', 'Unknown'),
                        'calories_per_100g': food.get('calories_per_100g', 0),
                        'protein_per_100g': food.get('protein_per_100g', 0),
                        'carbs_per_100g': food.get('carbs_per_100g', 0),
                        'fat_per_100g': food.get('fat_per_100g', 0),
                        'count': 0
                    }
                food_counts[food_id]['count'] += 1

        # Sort by count and return top N
        sorted_foods = sorted(
            food_counts.values(),
            key=lambda x: x['count'],
            reverse=True
        )[:limit]

        return sorted_foods

    except Exception as e:
        logger.error(f"fetch_frequently_logged_foods failed for user {user_id}: {e}")
        return []
