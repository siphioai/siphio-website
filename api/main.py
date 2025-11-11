"""
FastAPI main application for AI Nutrition Coach.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from agent.coach_agent import nutrition_coach
from agent.dependencies import CoachAgentDependencies
from agent.settings import load_settings
from database.supabase import get_supabase_client
from dependencies.auth import get_current_user_id
from pydantic_ai.messages import ModelMessagesTypeAdapter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load settings
settings = load_settings()

app = FastAPI(
    title="Nutrition Coach AI",
    description="AI-powered nutrition coaching backend for macro tracker",
    version="1.0.0"
)

# Build allowed origins based on environment
allowed_origins = [
    "http://localhost:3000",  # Always allow localhost for development
]

# Add production domain if in production environment
if settings.app_env == "production":
    allowed_origins.append(settings.frontend_url)

# Configure CORS middleware with environment-aware origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # No wildcards, explicit domains only
    allow_credentials=True,
    allow_methods=["POST"],  # Only POST needed for /api/chat
    allow_headers=["Content-Type", "Authorization"],  # Include Authorization
    max_age=3600,  # Cache preflight requests for 1 hour
)


class ChatRequest(BaseModel):
    """Request model for chat endpoint - user_id extracted from JWT."""
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="Previous messages in conversation"
    )


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    conversation_history: List[Dict[str, Any]]
    usage: Dict[str, Any]


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Main chat endpoint for nutrition coach agent with JWT authentication.

    Args:
        request: Chat request with message and optional conversation history
        user_id: Validated user ID extracted from JWT token (via dependency)

    Returns:
        Chat response with agent reply, updated conversation history, and usage stats
    """
    try:
        # Create Supabase client
        supabase = await get_supabase_client()

        # Create agent dependencies with VALIDATED user_id from JWT
        deps = CoachAgentDependencies(
            supabase=supabase,
            user_id=user_id  # Guaranteed valid - came from JWT
        )

        # Deserialize conversation history if provided
        message_history = None
        if request.conversation_history:
            try:
                # ModelMessagesTypeAdapter is already an instance, use it directly
                message_history = ModelMessagesTypeAdapter.validate_python(request.conversation_history)
            except Exception as e:
                logger.warning(f"Failed to parse conversation history: {e}")
                message_history = None

        # Run agent with conversation history
        result = await nutrition_coach.run(
            request.message,
            message_history=message_history,
            deps=deps
        )

        # Serialize updated conversation history
        # ModelMessagesTypeAdapter is already an instance, use it directly
        updated_history = ModelMessagesTypeAdapter.dump_python(result.all_messages())

        # Get usage stats
        usage_data = result.usage()
        usage = {
            'input_tokens': usage_data.input_tokens if usage_data else 0,
            'output_tokens': usage_data.output_tokens if usage_data else 0,
            'total_tokens': usage_data.total_tokens if usage_data else 0
        }

        return ChatResponse(
            response=result.output,
            conversation_history=updated_history,
            usage=usage
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to process chat request"
        )


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "nutrition-coach-ai"}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "Nutrition Coach AI",
        "version": "1.0.1-FIXED",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/health"
        },
        "status": "CODE UPDATED - Cache cleared"
    }
