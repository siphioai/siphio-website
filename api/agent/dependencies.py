"""
Agent dependencies for dependency injection.
"""

from dataclasses import dataclass
from supabase import AsyncClient


@dataclass
class CoachAgentDependencies:
    """
    Minimal dependencies for AI Nutrition Coach agent.

    Injected into agent runtime via RunContext[CoachAgentDependencies].
    """
    supabase: AsyncClient  # Async Supabase client for database queries
    user_id: str  # Authenticated user ID (validated by Next.js layer)