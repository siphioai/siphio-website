"""
Test core agent functionality with TestModel.

Validates:
- Agent initialization and configuration
- Tool registration (3 tools required)
- Basic responses without API calls
- Conversation memory
- Dependency injection
"""

import pytest
from pydantic_ai.models.test import TestModel
from pydantic_ai.messages import ModelTextResponse
from api.agent.coach_agent import nutrition_coach
from api.agent.dependencies import CoachAgentDependencies


@pytest.mark.asyncio
async def test_agent_initialization():
    """Test agent is properly initialized with correct configuration."""
    assert nutrition_coach is not None
    assert nutrition_coach.model is not None
    assert nutrition_coach.deps_type == CoachAgentDependencies


@pytest.mark.asyncio
async def test_agent_has_system_prompt():
    """Test agent is configured with proper system prompt."""
    assert nutrition_coach._system_prompt is not None

    # Check for key phrases from the coaching persona
    system_prompt_text = str(nutrition_coach._system_prompt).lower()
    assert "nutrition coach" in system_prompt_text or "supportive" in system_prompt_text
    assert len(nutrition_coach._system_prompt) > 100  # Should be substantial


@pytest.mark.asyncio
async def test_agent_has_all_required_tools():
    """Test agent has exactly 3 required tools registered."""
    # Should have 3 tools: fetch_today_status, fetch_weekly_progress, fetch_pattern_analysis
    tool_names = [tool.name for tool in nutrition_coach._function_tools.values()]

    assert len(tool_names) == 3, f"Expected 3 tools, found {len(tool_names)}: {tool_names}"

    # Verify each required tool is present
    required_tools = ['fetch_today_status', 'fetch_weekly_progress', 'fetch_pattern_analysis']
    for required_tool in required_tools:
        assert required_tool in tool_names, f"Required tool '{required_tool}' not found"


@pytest.mark.asyncio
async def test_agent_basic_response(test_deps, test_model):
    """Test agent provides appropriate response using TestModel."""
    result = await nutrition_coach.run(
        "How am I doing today?",
        deps=test_deps,
        model=test_model
    )

    # Verify result structure
    assert result is not None
    assert result.data is not None
    assert isinstance(result.data, str)
    assert len(result.data) > 0

    # Verify messages were created
    messages = result.all_messages()
    assert len(messages) > 0


@pytest.mark.asyncio
async def test_agent_conversation_memory():
    """Test agent maintains conversation context across multiple turns."""
    test_model = TestModel()

    # Create mock dependencies
    from unittest.mock import AsyncMock
    mock_supabase = AsyncMock()
    deps = CoachAgentDependencies(
        supabase=mock_supabase,
        user_id="test-user-123"
    )

    # First message
    result1 = await nutrition_coach.run(
        "What's my protein today?",
        deps=deps,
        model=test_model
    )

    history = result1.all_messages()
    assert len(history) > 0

    # Follow-up message with history
    result2 = await nutrition_coach.run(
        "And what about yesterday?",
        message_history=history,
        deps=deps,
        model=test_model
    )

    # History should have grown
    updated_history = result2.all_messages()
    assert len(updated_history) > len(history)

    # Verify we can get only new messages
    new_messages = result2.new_messages()
    assert len(new_messages) > 0
    assert len(new_messages) < len(updated_history)


@pytest.mark.asyncio
async def test_agent_with_custom_test_model_response(test_deps):
    """Test agent with custom TestModel response."""
    test_model = TestModel()

    # Configure custom response
    test_model.agent_responses = [
        ModelTextResponse(content="You're doing great today! You've logged 1500 calories so far.")
    ]

    result = await nutrition_coach.run(
        "How am I doing?",
        deps=test_deps,
        model=test_model
    )

    # Should contain the custom response
    assert "1500 calories" in result.data or "doing great" in result.data.lower()


@pytest.mark.asyncio
async def test_agent_empty_message_handling(test_deps, test_model):
    """Test agent handles empty messages gracefully."""
    result = await nutrition_coach.run(
        "",
        deps=test_deps,
        model=test_model
    )

    # Should still return something (agent handles this)
    assert result.data is not None


@pytest.mark.asyncio
async def test_agent_long_message_handling(test_deps, test_model):
    """Test agent handles longer messages."""
    long_message = "I've been tracking my macros for a while now and I'm noticing some interesting patterns. On weekdays I seem to do pretty well with hitting my protein goals, but on weekends I always seem to go over on carbs. Can you help me understand what's going on?"

    result = await nutrition_coach.run(
        long_message,
        deps=test_deps,
        model=test_model
    )

    assert result.data is not None
    assert len(result.data) > 0


@pytest.mark.asyncio
async def test_agent_with_different_user_ids(mock_supabase, test_model):
    """Test agent works correctly with different user IDs."""
    user_ids = ["user-1", "user-2", "test-user-xyz"]

    for user_id in user_ids:
        deps = CoachAgentDependencies(
            supabase=mock_supabase,
            user_id=user_id
        )

        result = await nutrition_coach.run(
            "How am I doing?",
            deps=deps,
            model=test_model
        )

        assert result is not None
        assert result.data is not None


@pytest.mark.asyncio
async def test_agent_result_has_usage_info(test_deps, test_model):
    """Test that agent result includes usage information."""
    result = await nutrition_coach.run(
        "Test message",
        deps=test_deps,
        model=test_model
    )

    # Verify result has usage method
    assert hasattr(result, 'usage')
    assert callable(result.usage)

    # With TestModel, usage might be None or empty
    usage = result.usage()
    # Just verify it doesn't crash


@pytest.mark.asyncio
async def test_agent_dependencies_properly_injected(test_user_id):
    """Test that dependencies are properly injected and accessible."""
    from unittest.mock import AsyncMock

    mock_supabase = AsyncMock()
    deps = CoachAgentDependencies(
        supabase=mock_supabase,
        user_id=test_user_id
    )

    # Verify dependencies structure
    assert deps.supabase is not None
    assert deps.user_id == test_user_id

    # Test agent can use these dependencies
    test_model = TestModel()
    result = await nutrition_coach.run(
        "Test message",
        deps=deps,
        model=test_model
    )

    assert result is not None


@pytest.mark.asyncio
async def test_agent_multiple_sequential_runs(test_deps, test_model):
    """Test agent can handle multiple sequential runs."""
    messages = [
        "How am I doing today?",
        "What's my protein at?",
        "Show me my weekly progress"
    ]

    for message in messages:
        result = await nutrition_coach.run(
            message,
            deps=test_deps,
            model=test_model
        )

        assert result is not None
        assert result.data is not None


@pytest.mark.asyncio
async def test_agent_override_method_works(test_deps):
    """Test agent.override() context manager works correctly."""
    test_model = TestModel()

    # Use override context manager
    with nutrition_coach.override(model=test_model):
        result = await nutrition_coach.run(
            "Test with override",
            deps=test_deps
        )

        assert result is not None
        assert result.data is not None
