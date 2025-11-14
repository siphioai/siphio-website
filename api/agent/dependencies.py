"""
Agent dependencies for dependency injection.
"""

from dataclasses import dataclass, field
from supabase import AsyncClient
from typing import Optional


@dataclass
class CoachAgentDependencies:
    """
    Minimal dependencies for AI Nutrition Coach agent.

    Injected into agent runtime via RunContext[CoachAgentDependencies].
    """
    supabase: AsyncClient  # Async Supabase client for database queries
    user_id: str  # Authenticated user ID (validated by Next.js layer)
    generated_meal_plan: Optional[dict] = field(default=None)  # Optional meal plan data for response passthrough