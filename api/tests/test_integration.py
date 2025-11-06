"""
Integration tests for the AI Nutrition Coach agent.

Tests full flow:
- FastAPI endpoints
- Conversation memory across requests
- Agent + tool integration
- Request/response validation
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from api.main import app
from api.agent.dependencies import CoachAgentDependencies
from pydantic_ai.models.test import TestModel


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test health check endpoint is working."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint returns API info."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "endpoints" in data


@pytest.mark.asyncio
async def test_chat_endpoint_basic_request():
    """Test basic chat endpoint request."""
    # Mock the agent and database
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        # Configure mock agent response
        mock_result = MagicMock()
        mock_result.data = "You're doing great! You've logged 1500 calories today."
        mock_result.all_messages.return_value = [
            {'role': 'user', 'content': 'How am I doing?'},
            {'role': 'assistant', 'content': "You're doing great! You've logged 1500 calories today."}
        ]
        mock_result.usage.return_value = MagicMock(
            request_tokens=50,
            response_tokens=30,
            total_tokens=80
        )
        mock_agent_run.return_value = mock_result

        # Configure mock Supabase
        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "How am I doing?",
                    "conversation_history": []
                }
            )

            assert response.status_code == 200
            data = response.json()

            # Verify response structure
            assert "response" in data
            assert "conversation_history" in data
            assert "usage" in data

            # Verify response content
            assert "1500 calories" in data["response"]


@pytest.mark.asyncio
async def test_chat_endpoint_with_conversation_history():
    """Test chat endpoint maintains conversation history."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        # Configure mock responses
        mock_result = MagicMock()
        mock_result.data = "Your carbs are at 150g of 200g target (75%)."
        mock_result.all_messages.return_value = [
            {'role': 'user', 'content': 'How is my protein?'},
            {'role': 'assistant', 'content': 'Your protein is at 120g of 150g target.'},
            {'role': 'user', 'content': 'What about carbs?'},
            {'role': 'assistant', 'content': 'Your carbs are at 150g of 200g target (75%).'}
        ]
        mock_result.usage.return_value = MagicMock(
            request_tokens=75,
            response_tokens=40,
            total_tokens=115
        )
        mock_agent_run.return_value = mock_result

        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            # Send message with history
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "What about carbs?",
                    "conversation_history": [
                        {'role': 'user', 'content': 'How is my protein?'},
                        {'role': 'assistant', 'content': 'Your protein is at 120g of 150g target.'}
                    ]
                }
            )

            assert response.status_code == 200
            data = response.json()

            # Verify history grew
            assert len(data["conversation_history"]) > 2

            # Verify agent received the history
            mock_agent_run.assert_called_once()
            call_kwargs = mock_agent_run.call_args[1]
            assert call_kwargs.get("message_history") is not None


@pytest.mark.asyncio
async def test_chat_endpoint_invalid_request_no_message():
    """Test chat endpoint rejects request without message."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={
                "user_id": "test-user-123",
                # Missing message field
                "conversation_history": []
            }
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_chat_endpoint_invalid_request_no_user_id():
    """Test chat endpoint rejects request without user_id."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={
                # Missing user_id field
                "message": "How am I doing?",
                "conversation_history": []
            }
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_chat_endpoint_message_too_long():
    """Test chat endpoint rejects messages that are too long."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={
                "user_id": "test-user-123",
                "message": "x" * 1001,  # Exceeds 1000 character limit
                "conversation_history": []
            }
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_chat_endpoint_empty_message():
    """Test chat endpoint handles empty message."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        mock_result = MagicMock()
        mock_result.data = "How can I help you today?"
        mock_result.all_messages.return_value = []
        mock_result.usage.return_value = None
        mock_agent_run.return_value = mock_result

        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "",  # Empty but present
                    "conversation_history": []
                }
            )

            # Should be rejected by min_length=1 validator
            assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_endpoint_handles_agent_error():
    """Test chat endpoint handles agent errors gracefully."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        # Simulate agent error
        mock_agent_run.side_effect = Exception("Agent processing error")

        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "How am I doing?",
                    "conversation_history": []
                }
            )

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data


@pytest.mark.asyncio
async def test_chat_endpoint_handles_database_error():
    """Test chat endpoint handles database errors gracefully."""
    with patch('api.main.get_supabase_client') as mock_get_client:

        # Simulate database error
        mock_get_client.side_effect = Exception("Database connection failed")

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "How am I doing?",
                    "conversation_history": []
                }
            )

            assert response.status_code == 500


@pytest.mark.asyncio
async def test_full_conversation_flow():
    """Test a complete multi-turn conversation flow."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        mock_get_client.return_value = AsyncMock()

        # Mock conversation turns
        conversation_turns = [
            ("How's my protein today?", "You're at 120g of 150g protein target (80%)."),
            ("What about yesterday?", "Yesterday you hit 145g of 150g protein (97%)."),
            ("Am I consistent?", "You've hit your protein target 5 out of 7 days this week (71%).")
        ]

        async with AsyncClient(app=app, base_url="http://test") as client:
            history = []

            for i, (user_msg, agent_response) in enumerate(conversation_turns):
                # Mock agent response for this turn
                mock_result = MagicMock()
                mock_result.data = agent_response

                # Build up history
                turn_history = history + [
                    {'role': 'user', 'content': user_msg},
                    {'role': 'assistant', 'content': agent_response}
                ]
                mock_result.all_messages.return_value = turn_history
                mock_result.usage.return_value = MagicMock(
                    request_tokens=50 + (i * 10),
                    response_tokens=30 + (i * 5),
                    total_tokens=80 + (i * 15)
                )
                mock_agent_run.return_value = mock_result

                # Send request
                response = await client.post(
                    "/api/chat",
                    json={
                        "user_id": "test-user-123",
                        "message": user_msg,
                        "conversation_history": history
                    }
                )

                assert response.status_code == 200
                data = response.json()

                # Verify response
                assert data["response"] == agent_response

                # Update history for next turn
                history = data["conversation_history"]

            # After 3 turns, history should have 6 messages (3 user + 3 assistant)
            assert len(history) == 6


@pytest.mark.asyncio
async def test_concurrent_requests_different_users():
    """Test handling multiple concurrent requests from different users."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        mock_get_client.return_value = AsyncMock()

        # Mock responses for different users
        def create_mock_response(user_id):
            mock_result = MagicMock()
            mock_result.data = f"Response for {user_id}"
            mock_result.all_messages.return_value = []
            mock_result.usage.return_value = None
            return mock_result

        mock_agent_run.side_effect = [
            create_mock_response("user-1"),
            create_mock_response("user-2"),
            create_mock_response("user-3")
        ]

        async with AsyncClient(app=app, base_url="http://test") as client:
            # Send concurrent requests
            import asyncio
            tasks = [
                client.post("/api/chat", json={
                    "user_id": f"user-{i}",
                    "message": "How am I doing?",
                    "conversation_history": []
                })
                for i in range(1, 4)
            ]

            responses = await asyncio.gather(*tasks)

            # All should succeed
            for response in responses:
                assert response.status_code == 200


@pytest.mark.asyncio
async def test_usage_tracking():
    """Test that usage information is properly tracked and returned."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        # Mock with usage data
        mock_result = MagicMock()
        mock_result.data = "Test response"
        mock_result.all_messages.return_value = []
        mock_result.usage.return_value = MagicMock(
            request_tokens=150,
            response_tokens=75,
            total_tokens=225
        )
        mock_agent_run.return_value = mock_result

        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "Test message",
                    "conversation_history": []
                }
            )

            assert response.status_code == 200
            data = response.json()

            # Verify usage data
            assert "usage" in data
            assert data["usage"]["input_tokens"] == 150
            assert data["usage"]["output_tokens"] == 75
            assert data["usage"]["total_tokens"] == 225


@pytest.mark.asyncio
async def test_malformed_conversation_history():
    """Test endpoint handles malformed conversation history gracefully."""
    with patch('api.main.nutrition_coach.run') as mock_agent_run, \
         patch('api.main.get_supabase_client') as mock_get_client:

        mock_result = MagicMock()
        mock_result.data = "Response"
        mock_result.all_messages.return_value = []
        mock_result.usage.return_value = None
        mock_agent_run.return_value = mock_result

        mock_get_client.return_value = AsyncMock()

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={
                    "user_id": "test-user-123",
                    "message": "Test",
                    "conversation_history": [
                        {"invalid": "format"},  # Malformed history
                        {"also": "invalid"}
                    ]
                }
            )

            # Should still process (logs warning and continues with None history)
            assert response.status_code == 200
