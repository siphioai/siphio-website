"""Authentication dependencies for FastAPI endpoints."""

from fastapi import Header, HTTPException
from database.supabase import get_supabase_client
from supabase import AsyncClient


async def get_current_user_id(
    authorization: str = Header(..., description="Bearer {jwt_token}")
) -> str:
    """
    Extract and validate user_id from Supabase JWT token.

    This dependency:
    1. Validates JWT token with Supabase auth
    2. Extracts auth_id from token
    3. Looks up internal user_id from users table
    4. Returns validated user_id for use in agent

    Args:
        authorization: Authorization header in format "Bearer {token}"

    Returns:
        str: Validated user_id from users table

    Raises:
        HTTPException 401: Invalid/missing token or invalid format
        HTTPException 404: User profile not found in database
    """
    # Validate Authorization header format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Use 'Bearer {token}'"
        )

    # Extract JWT token
    token = authorization.replace("Bearer ", "")

    # Get Supabase client with service key (required for auth validation)
    supabase: AsyncClient = await get_supabase_client()

    try:
        # Validate JWT with Supabase and get user info
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        auth_id = user_response.user.id

        # Look up internal user_id from users table using auth_id
        user_data = await supabase.from_("users") \
            .select("id") \
            .eq("auth_id", auth_id) \
            .single() \
            .execute()

        if not user_data.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found. Please contact support."
            )

        return user_data.data["id"]

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other errors (network, parsing, etc.)
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )
