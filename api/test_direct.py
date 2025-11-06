"""
Direct test of chat endpoint to see actual errors.
"""
import sys
import asyncio
from pathlib import Path

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from api.main import chat, ChatRequest

async def test_chat():
    """Test chat endpoint directly."""
    # Use a valid UUID format (this is a test UUID, not from your actual database)
    request = ChatRequest(
        user_id="123e4567-e89b-12d3-a456-426614174000",
        message="Hello! Can you help me with my nutrition?"
    )

    try:
        response = await chat(request)
        print(f"SUCCESS!")
        print(f"Response: {response.response}")
        print(f"Usage: {response.usage}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chat())
