"""
Agent tools for fetching nutrition data from Supabase.
"""

import logging
import asyncio
from pydantic_ai import RunContext
from .dependencies import CoachAgentDependencies
from ..database.queries import (
    fetch_today_summary,
    fetch_weekly_summary,
    fetch_pattern_summary
)

logger = logging.getLogger(__name__)


# Import after logger to avoid circular import
def register_tools():
    """Register all tools with the nutrition_coach agent."""
    from .coach_agent import nutrition_coach

    @nutrition_coach.tool
    async def fetch_today_status(
        ctx: RunContext[CoachAgentDependencies]
    ) -> str:
        """
        Fetch today's nutrition status with current totals and remaining targets.

        Use this when user asks about their current day progress:
        "How am I doing today?", "What's my protein at?", "How many calories left?"

        Returns:
            Formatted summary of today's progress
        """
        try:
            summary = await fetch_today_summary(
                ctx.deps.supabase,
                ctx.deps.user_id
            )

            if summary is None:
                return "No nutrition goals set yet. User should set their daily macro targets first."

            if not summary['has_logged']:
                return f"No meals logged yet today. Goals: {summary['calories_target']} cal, {summary['protein_target']}g protein, {summary['carbs_target']}g carbs, {summary['fat_target']}g fat."

            # Format for agent (concise, data-focused)
            cal_pct = summary['total_calories']/summary['calories_target']*100
            prot_pct = summary['total_protein']/summary['protein_target']*100
            carbs_pct = summary['total_carbs']/summary['carbs_target']*100
            fat_pct = summary['total_fat']/summary['fat_target']*100

            return f"""Today's Status ({summary['date']}):
- Calories: {summary['total_calories']} of {summary['calories_target']} ({cal_pct:.0f}%)
- Protein: {summary['total_protein']}g of {summary['protein_target']}g ({prot_pct:.0f}%)
- Carbs: {summary['total_carbs']}g of {summary['carbs_target']}g ({carbs_pct:.0f}%)
- Fat: {summary['total_fat']}g of {summary['fat_target']}g ({fat_pct:.0f}%)
- Has logged meals: Yes

Remaining to hit targets:
- Calories: {max(0, summary['calories_target'] - summary['total_calories'])} cal
- Protein: {max(0, summary['protein_target'] - summary['total_protein'])}g
- Carbs: {max(0, summary['carbs_target'] - summary['total_carbs'])}g
- Fat: {max(0, summary['fat_target'] - summary['total_fat'])}g"""

        except Exception as e:
            logger.error(f"fetch_today_status failed: {e}")
            return "Unable to fetch today's status due to a technical issue. Please try again."

    @nutrition_coach.tool
    async def fetch_weekly_progress(
        ctx: RunContext[CoachAgentDependencies],
        days: int = 7
    ) -> str:
        """
        Fetch weekly progress summary with averages and consistency metrics.

        Use this when user asks about recent trends or weekly performance:
        "How's my week?", "Am I consistent?", "How's my protein trend?"

        Args:
            days: Number of days to analyze (1-30, default 7)

        Returns:
            Formatted weekly summary
        """
        try:
            if days < 1 or days > 30:
                return "Error: days must be between 1 and 30"

            summary = await asyncio.wait_for(
                fetch_weekly_summary(
                    ctx.deps.supabase,
                    ctx.deps.user_id,
                    days
                ),
                timeout=5.0
            )

            if summary is None:
                return f"No nutrition data found for the last {days} days. User hasn't logged any meals yet."

            return f"""Weekly Summary ({summary['period']}):
- Days analyzed: {summary['days_analyzed']}
- Days logged: {summary['days_logged']} ({summary['consistency_rate']*100:.0f}% consistency)

Average Daily Macros:
- Calories: {summary['avg_calories']:.0f}
- Protein: {summary['avg_protein']:.1f}g
- Carbs: {summary['avg_carbs']:.1f}g
- Fat: {summary['avg_fat']:.1f}g

Target Hit Rates:
- Protein target hit: {summary['protein_target_hit_rate']*100:.0f}% of days
- Carbs within range: {summary['carbs_target_hit_rate']*100:.0f}% of days
- Calories on target: {summary['calories_target_hit_rate']*100:.0f}% of days

Best protein day: {summary['best_protein_day']}
Worst protein day: {summary['worst_protein_day']}"""

        except asyncio.TimeoutError:
            return "Database query timed out. Please try again."
        except Exception as e:
            logger.error(f"fetch_weekly_progress failed: {e}")
            return "Unable to fetch weekly progress. Please try again later."

    @nutrition_coach.tool
    async def fetch_pattern_analysis(
        ctx: RunContext[CoachAgentDependencies],
        days: int = 30,
        pattern_type: str = "weekday_weekend"
    ) -> str:
        """
        Analyze eating patterns over time to identify trends and behavioral patterns.

        Use this when user asks about long-term trends, consistency issues, or
        wants to understand their eating patterns (e.g., weekday vs weekend):
        "Why can't I stick to my carbs on weekends?", "What's my pattern with protein?"

        Args:
            days: Number of days to analyze (7-90, default 30)
            pattern_type: Type of analysis - "weekday_weekend" or "macro_consistency"

        Returns:
            Formatted pattern analysis
        """
        try:
            if days < 7 or days > 90:
                return "Error: days must be between 7 and 90"

            valid_patterns = ["weekday_weekend", "macro_consistency"]
            if pattern_type not in valid_patterns:
                return f"Error: pattern_type must be one of {valid_patterns}"

            summary = await fetch_pattern_summary(
                ctx.deps.supabase,
                ctx.deps.user_id,
                days,
                pattern_type
            )

            if summary is None:
                return f"Need at least 7 days of logged data for pattern analysis. User hasn't logged enough meals yet."

            if pattern_type == "weekday_weekend":
                cal_diff = summary['weekend_avg_calories'] - summary['weekday_avg_calories']
                cal_pct = (cal_diff / summary['weekday_avg_calories']) * 100
                carbs_diff = summary['weekend_avg_carbs'] - summary['weekday_avg_carbs']
                carbs_pct = (carbs_diff / summary['weekday_avg_carbs']) * 100

                return f"""Pattern Analysis - Weekday vs Weekend (Last {days} days):

Weekdays (Mon-Fri):
- Average calories: {summary['weekday_avg_calories']:.0f}
- Average protein: {summary['weekday_avg_protein']:.1f}g
- Average carbs: {summary['weekday_avg_carbs']:.1f}g
- Days logged: {summary['weekday_count']} ({summary['weekday_logged']*100:.0f}% consistency)

Weekends (Sat-Sun):
- Average calories: {summary['weekend_avg_calories']:.0f} ({cal_diff:+.0f} or {cal_pct:+.0f}%)
- Average protein: {summary['weekend_avg_protein']:.1f}g
- Average carbs: {summary['weekend_avg_carbs']:.1f}g ({carbs_diff:+.0f}g or {carbs_pct:+.0f}%)
- Days logged: {summary['weekend_count']} ({summary['weekend_logged']*100:.0f}% consistency)

Key Pattern:
Weekend calories are {abs(cal_pct):.0f}% {'higher' if cal_diff > 0 else 'lower'} than weekdays, with carbs showing the biggest difference ({abs(carbs_pct):.0f}% {'increase' if carbs_diff > 0 else 'decrease'})."""

            elif pattern_type == "macro_consistency":
                stds = {
                    'protein': summary['protein_std'],
                    'carbs': summary['carbs_std'],
                    'fat': summary['fat_std']
                }
                most_consistent = min(stds, key=stds.get)
                least_consistent = max(stds, key=stds.get)

                return f"""Macro Consistency Analysis (Last {days} days):

Average Values:
- Protein: {summary['protein_avg']:.1f}g (+/- {summary['protein_std']:.1f}g std dev)
- Carbs: {summary['carbs_avg']:.1f}g (+/- {summary['carbs_std']:.1f}g std dev)
- Fat: {summary['fat_avg']:.1f}g (+/- {summary['fat_std']:.1f}g std dev)

Consistency:
- Most consistent: {most_consistent.capitalize()} (lowest variation day-to-day)
- Least consistent: {least_consistent.capitalize()} (highest variation day-to-day)

Pattern:
Your {most_consistent} intake is very consistent, while {least_consistent} varies more from day to day."""

        except Exception as e:
            logger.error(f"fetch_pattern_analysis failed: {e}")
            return "Unable to perform pattern analysis. Please try again later."


# Register tools when module is imported
register_tools()
