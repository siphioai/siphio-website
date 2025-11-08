"""
Supabase async client for database operations.
"""

from supabase import acreate_client, AsyncClient
from agent.settings import settings


async def get_supabase_client() -> AsyncClient:
    """
    Create async Supabase client for database operations.

    Returns:
        Configured AsyncClient instance
    """
    return await acreate_client(
        settings.supabase_url,
        settings.supabase_service_key
    )
