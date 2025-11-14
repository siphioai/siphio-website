"""
Pydantic models for meal plan structured outputs.

These models define the schema for Claude's structured output generation
and ensure type safety throughout the meal planning system.
"""

from pydantic import BaseModel, Field
from typing import List
from enum import Enum


class MealType(str, Enum):
    """Allowed meal types."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class DayName(str, Enum):
    """Days of the week."""
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class Food(BaseModel):
    """Individual food item with nutritional information."""
    name: str = Field(
        ...,
        description="Food name (e.g., 'Greek Yogurt 0% Fat', 'Chicken Breast Grilled')",
        min_length=1
    )
    quantity_g: float = Field(
        ...,
        gt=0,
        description="Quantity in grams (must be positive)"
    )
    calories: float = Field(
        ...,
        ge=0,
        description="Total calories for this quantity"
    )
    protein: float = Field(
        ...,
        ge=0,
        description="Protein in grams"
    )
    carbs: float = Field(
        ...,
        ge=0,
        description="Carbohydrates in grams"
    )
    fat: float = Field(
        ...,
        ge=0,
        description="Fat in grams"
    )


class MacroTotals(BaseModel):
    """Aggregated macro totals for validation."""
    calories: float = Field(..., ge=0, description="Total calories")
    protein: float = Field(..., ge=0, description="Total protein in grams")
    carbs: float = Field(..., ge=0, description="Total carbs in grams")
    fat: float = Field(..., ge=0, description="Total fat in grams")


class Meal(BaseModel):
    """Single meal with foods and calculated totals."""
    id: str = Field(
        ...,
        description="Unique meal ID (e.g., 'meal_001_breakfast')"
    )
    name: str = Field(
        ...,
        description="Descriptive meal name (e.g., 'Greek Yogurt Protein Bowl')",
        min_length=1
    )
    meal_type: MealType = Field(
        ...,
        description="Meal type: breakfast, lunch, dinner, or snack"
    )
    foods: List[Food] = Field(
        ...,
        min_length=1,
        description="List of foods in this meal (at least 1 required)"
    )
    totals: MacroTotals = Field(
        ...,
        description="Calculated totals for all foods in meal"
    )


class MealPlanDay(BaseModel):
    """Single day in the meal plan with all meals."""
    date: str = Field(
        ...,
        description="Date in YYYY-MM-DD format (e.g., '2025-01-13')"
    )
    day_name: DayName = Field(
        ...,
        description="Day name (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday)"
    )
    meals: List[Meal] = Field(
        ...,
        min_length=1,
        description="Meals for the day (at least 1 required)"
    )
    daily_totals: MacroTotals = Field(
        ...,
        description="Sum of all meal totals for the day"
    )


class DayChunk(BaseModel):
    """Chunk of meal plan days (1-2 days) for incremental generation with Claude 4.5 Haiku."""
    daily_target: MacroTotals = Field(
        ...,
        description="Daily macro targets for the user"
    )
    days: List[MealPlanDay] = Field(
        ...,
        min_length=1,
        max_length=2,
        description="1-2 days of meals (optimized for Claude 4.5 Haiku with max_tokens=8000)"
    )


class MealPlan(BaseModel):
    """Complete 7-day meal plan with validation."""
    week_start: str = Field(
        ...,
        description="Week start date in YYYY-MM-DD format (e.g., '2025-01-13')"
    )
    daily_target: MacroTotals = Field(
        ...,
        description="Daily macro targets for the user"
    )
    days: List[MealPlanDay] = Field(
        ...,
        min_length=7,
        max_length=7,
        description="Exactly 7 days (Monday through Sunday)"
    )

    def validate_macro_accuracy(self, tolerance: float = 0.05) -> bool:
        """
        Validate that all days are within acceptable range of targets.

        CRITICAL: Daily totals must NEVER exceed targets.
        Daily totals should be within tolerance UNDER the target.

        Args:
            tolerance: Acceptable deviation UNDER target (default 5% = 0.05)
                      Note: Values can be 0-5% under, but NEVER over

        Returns:
            True if all days within acceptable range (≤ target), False otherwise
        """
        for day in self.days:
            # Check each macro
            for macro in ['calories', 'protein', 'carbs', 'fat']:
                target = getattr(self.daily_target, macro)
                actual = getattr(day.daily_totals, macro)

                # CRITICAL: Must never exceed target
                if actual > target:
                    return False

                # Calculate how far under we are
                if target > 0:
                    under_deviation = (target - actual) / target
                    # Allow being up to tolerance% under the target
                    if under_deviation > tolerance:
                        return False

        return True
