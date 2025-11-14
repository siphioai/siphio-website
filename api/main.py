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
    meal_plan: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional generated meal plan data"
    )


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
                # First, filter the incoming history to remove any tool blocks
                # This prevents validation errors from malformed tool_use/tool_result pairs
                filtered_input = []
                for msg in request.conversation_history:
                    if msg.get('role') in ['user', 'assistant']:
                        # Simplify message to just role and text content
                        content = msg.get('content', '')

                        # Handle different content formats
                        if isinstance(content, list):
                            # Extract text from content blocks, skip tool blocks
                            text_blocks = [
                                block.get('text', '') if isinstance(block, dict) and block.get('type') == 'text'
                                else str(block) if not isinstance(block, dict)
                                else ''
                                for block in content
                            ]
                            content = ' '.join(filter(None, text_blocks))

                        if content:  # Only add if there's actual content
                            filtered_input.append({
                                'role': msg['role'],
                                'content': content
                            })

                logger.debug(f"Filtered input history: {len(request.conversation_history)} -> {len(filtered_input)} messages")

                # Now validate the filtered history
                if filtered_input:
                    message_history = ModelMessagesTypeAdapter.validate_python(filtered_input)
                    logger.debug(f"Parsed conversation history with {len(message_history)} messages")
                else:
                    message_history = None
            except Exception as e:
                logger.error(f"Failed to parse conversation history: {e}", exc_info=True)
                # Continue without history rather than failing the request
                message_history = None

        # Run agent with conversation history
        result = await nutrition_coach.run(
            request.message,
            message_history=message_history,
            deps=deps
        )

        # Serialize updated conversation history, filtering out tool internals
        # ModelMessagesTypeAdapter is already an instance, use it directly
        all_messages = ModelMessagesTypeAdapter.dump_python(result.all_messages())

        # Filter to only user and assistant text messages (exclude tool_use/tool_result blocks)
        # This prevents serialization issues when sending history back to frontend
        filtered_history = []
        for msg in all_messages:
            logger.debug(f"Processing message with role: {msg.get('role')}, content type: {type(msg.get('content'))}")

            if msg.get('role') in ['user', 'assistant']:
                # For assistant messages, only keep text content, strip tool blocks
                if msg.get('role') == 'assistant':
                    content = msg.get('content', [])
                    if isinstance(content, str):
                        # Content is already a string, wrap it
                        filtered_history.append({
                            'role': 'assistant',
                            'content': content
                        })
                    elif isinstance(content, list):
                        # Filter content to only text blocks
                        text_content = [
                            block for block in content
                            if isinstance(block, dict) and block.get('type') == 'text'
                        ]
                        if text_content:
                            # Extract just the text from text blocks
                            text_only = ' '.join([
                                block.get('text', '') for block in text_content
                            ])
                            filtered_history.append({
                                'role': 'assistant',
                                'content': text_only
                            })
                else:
                    # User messages - convert content to simple string
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        # Extract text from content blocks
                        text = ' '.join([
                            block.get('text', block) if isinstance(block, dict) else str(block)
                            for block in content
                        ])
                        filtered_history.append({
                            'role': 'user',
                            'content': text
                        })
                    else:
                        filtered_history.append({
                            'role': 'user',
                            'content': str(content)
                        })

        logger.debug(f"Filtered conversation history: {len(all_messages)} -> {len(filtered_history)} messages")
        logger.debug(f"Sample filtered message: {filtered_history[0] if filtered_history else 'none'}")

        # Get usage stats
        usage_data = result.usage()
        usage = {
            'input_tokens': usage_data.input_tokens if usage_data else 0,
            'output_tokens': usage_data.output_tokens if usage_data else 0,
            'total_tokens': usage_data.total_tokens if usage_data else 0
        }

        return ChatResponse(
            response=result.output,
            conversation_history=filtered_history,
            usage=usage,
            meal_plan=deps.generated_meal_plan  # Include meal plan if generated by agent
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
