"""
Test tool implementations with mocked database queries.

Validates:
- Each tool independently with mocked Supabase
- Error handling (no data, invalid inputs, timeouts)
- Edge cases (no goals, no logs, insufficient data)
- Tool parameter validation
- Proper data aggregation and formatting
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncio
from api.database.queries import fetch_today_summary, fetch_weekly_summary, fetch_pattern_summary
from api.agent.coach_agent import nutrition_coach
from api.agent.dependencies import CoachAgentDependencies
from pydantic_ai.models.test import TestModel


# ====================
# Query Function Tests
# ====================

@pytest.mark.asyncio
async def test_fetch_today_summary_with_data(mock_supabase, test_user_id, sample_daily_summary):
    """Test fetch_today_summary returns expected data."""
    mock_response = MagicMock()
    mock_response.data = sample_daily_summary

    # Configure the mock chain
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_today_summary(mock_supabase, test_user_id)

    assert result is not None
    assert result['total_protein'] == 120
    assert result['has_logged'] is True
    assert result['calories_target'] == 2000


@pytest.mark.asyncio
async def test_fetch_today_summary_no_data_but_has_goals(mock_supabase, test_user_id, sample_no_data_goals):
    """Test fetch_today_summary when no data logged today but goals exist."""
    # Mock no daily_summary data
    mock_daily_response = MagicMock()
    mock_daily_response.data = None

    # Mock goals data exists
    mock_goals_response = MagicMock()
    mock_goals_response.data = sample_no_data_goals

    # Configure sequential responses
    execute_mock = AsyncMock()
    execute_mock.side_effect = [mock_daily_response, mock_goals_response]

    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = execute_mock

    result = await fetch_today_summary(mock_supabase, test_user_id)

    assert result is not None
    assert result['has_logged'] is False
    assert result['total_protein'] == 0
    assert result['protein_target'] == 150


@pytest.mark.asyncio
async def test_fetch_today_summary_no_goals_set(mock_supabase, test_user_id):
    """Test fetch_today_summary when no goals are set."""
    # Mock no data for both queries
    mock_response = MagicMock()
    mock_response.data = None

    execute_mock = AsyncMock(return_value=mock_response)
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = execute_mock

    result = await fetch_today_summary(mock_supabase, test_user_id)

    assert result is None


@pytest.mark.asyncio
async def test_fetch_weekly_summary_with_data(mock_supabase, test_user_id, sample_weekly_data):
    """Test fetch_weekly_summary returns aggregated data."""
    mock_response = MagicMock()
    mock_response.data = sample_weekly_data

    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_weekly_summary(mock_supabase, test_user_id, 7)

    assert result is not None
    assert result['days_analyzed'] == 7
    assert result['days_logged'] == 7
    assert 'avg_protein' in result
    assert 'consistency_rate' in result
    assert 'best_protein_day' in result


@pytest.mark.asyncio
async def test_fetch_weekly_summary_no_data(mock_supabase, test_user_id):
    """Test fetch_weekly_summary when no data exists."""
    mock_response = MagicMock()
    mock_response.data = []

    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.order.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_weekly_summary(mock_supabase, test_user_id, 7)

    assert result is None


@pytest.mark.asyncio
async def test_fetch_pattern_summary_weekday_weekend(mock_supabase, test_user_id, sample_pattern_data):
    """Test fetch_pattern_summary with weekday vs weekend analysis."""
    mock_response = MagicMock()
    mock_response.data = sample_pattern_data

    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_pattern_summary(mock_supabase, test_user_id, 30, "weekday_weekend")

    assert result is not None
    assert result['pattern_type'] == 'weekday_weekend'
    assert 'weekday_count' in result
    assert 'weekend_count' in result
    assert result['weekend_avg_calories'] > result['weekday_avg_calories']


@pytest.mark.asyncio
async def test_fetch_pattern_summary_macro_consistency(mock_supabase, test_user_id, sample_pattern_data):
    """Test fetch_pattern_summary with macro consistency analysis."""
    mock_response = MagicMock()
    mock_response.data = sample_pattern_data

    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_pattern_summary(mock_supabase, test_user_id, 30, "macro_consistency")

    assert result is not None
    assert result['pattern_type'] == 'macro_consistency'
    assert 'protein_std' in result
    assert 'carbs_std' in result
    assert 'fat_std' in result


@pytest.mark.asyncio
async def test_fetch_pattern_summary_insufficient_data(mock_supabase, test_user_id):
    """Test fetch_pattern_summary with insufficient data (< 7 days)."""
    mock_response = MagicMock()
    mock_response.data = [
        {'date': '2025-11-06', 'total_calories': 2000, 'total_protein': 160, 'total_carbs': 200, 'has_logged': True}
    ]  # Only 1 day - need at least 7

    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = AsyncMock(return_value=mock_response)

    result = await fetch_pattern_summary(mock_supabase, test_user_id, 30, "weekday_weekend")

    assert result is None


# ====================
# Tool Integration Tests
# ====================

@pytest.mark.asyncio
async def test_fetch_today_status_tool_with_data(mock_supabase, test_user_id, sample_daily_summary):
    """Test fetch_today_status tool returns formatted string."""
    # Mock the query function
    with patch('api.agent.tools.fetch_today_summary') as mock_query:
        mock_query.return_value = sample_daily_summary

        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        # Import the tool after patching
        from api.agent.tools import register_tools
        register_tools()

        # Get the tool function
        tool = nutrition_coach._function_tools['fetch_today_status']

        # Create a mock context
        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_today_status')

        # Call the tool directly
        result = await tool.function(ctx)

        assert result is not None
        assert isinstance(result, str)
        assert '120g' in result or '120 g' in result  # Protein value
        assert 'Today' in result or 'today' in result


@pytest.mark.asyncio
async def test_fetch_today_status_tool_no_data(mock_supabase, test_user_id):
    """Test fetch_today_status tool when no data exists."""
    with patch('api.agent.tools.fetch_today_summary') as mock_query:
        mock_query.return_value = None

        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_today_status')

        tool = nutrition_coach._function_tools['fetch_today_status']
        result = await tool.function(ctx)

        assert result is not None
        assert isinstance(result, str)
        assert 'No nutrition goals' in result or 'goals' in result.lower()


@pytest.mark.asyncio
async def test_fetch_weekly_progress_tool_valid_days():
    """Test fetch_weekly_progress tool with valid days parameter."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    with patch('api.agent.tools.fetch_weekly_summary') as mock_query:
        mock_query.return_value = {
            'period': 'Last 7 days',
            'days_analyzed': 7,
            'avg_calories': 1950,
            'avg_protein': 145.5,
            'avg_carbs': 185.2,
            'avg_fat': 62.3,
            'days_logged': 7,
            'consistency_rate': 1.0,
            'protein_target_hit_rate': 0.71,
            'carbs_target_hit_rate': 0.86,
            'calories_target_hit_rate': 0.57,
            'best_protein_day': '2025-11-06',
            'worst_protein_day': '2025-11-01'
        }

        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_weekly_progress')

        tool = nutrition_coach._function_tools['fetch_weekly_progress']
        result = await tool.function(ctx, days=7)

        assert result is not None
        assert isinstance(result, str)
        assert 'Weekly Summary' in result or 'Last 7 days' in result
        assert '145.5' in result or '145' in result  # Protein value


@pytest.mark.asyncio
async def test_fetch_weekly_progress_tool_invalid_days():
    """Test fetch_weekly_progress tool with invalid days parameter."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

    from pydantic_ai import RunContext
    ctx = RunContext(deps=deps, retry=0, tool_name='fetch_weekly_progress')

    tool = nutrition_coach._function_tools['fetch_weekly_progress']

    # Test days < 1
    result = await tool.function(ctx, days=0)
    assert 'Error' in result

    # Test days > 30
    result = await tool.function(ctx, days=31)
    assert 'Error' in result


@pytest.mark.asyncio
async def test_fetch_pattern_analysis_tool_weekday_weekend():
    """Test fetch_pattern_analysis tool with weekday_weekend pattern."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    with patch('api.agent.tools.fetch_pattern_summary') as mock_query:
        mock_query.return_value = {
            'pattern_type': 'weekday_weekend',
            'weekday_count': 20,
            'weekend_count': 8,
            'weekday_avg_calories': 1900,
            'weekend_avg_calories': 2200,
            'weekday_avg_protein': 150,
            'weekend_avg_protein': 140,
            'weekday_avg_carbs': 180,
            'weekend_avg_carbs': 230,
            'weekday_logged': 0.95,
            'weekend_logged': 0.88
        }

        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_pattern_analysis')

        tool = nutrition_coach._function_tools['fetch_pattern_analysis']
        result = await tool.function(ctx, days=30, pattern_type="weekday_weekend")

        assert result is not None
        assert isinstance(result, str)
        assert 'Weekday' in result or 'weekday' in result
        assert 'Weekend' in result or 'weekend' in result


@pytest.mark.asyncio
async def test_fetch_pattern_analysis_tool_invalid_pattern_type():
    """Test fetch_pattern_analysis tool with invalid pattern_type."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

    from pydantic_ai import RunContext
    ctx = RunContext(deps=deps, retry=0, tool_name='fetch_pattern_analysis')

    tool = nutrition_coach._function_tools['fetch_pattern_analysis']
    result = await tool.function(ctx, days=30, pattern_type="invalid_type")

    assert 'Error' in result


@pytest.mark.asyncio
async def test_tool_error_handling():
    """Test that tools handle exceptions gracefully."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    # Force an exception in the query
    with patch('api.agent.tools.fetch_today_summary') as mock_query:
        mock_query.side_effect = Exception("Database connection error")

        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_today_status')

        tool = nutrition_coach._function_tools['fetch_today_status']
        result = await tool.function(ctx)

        # Should return error message, not crash
        assert result is not None
        assert isinstance(result, str)
        assert 'Unable' in result or 'technical' in result.lower()


@pytest.mark.asyncio
async def test_tool_timeout_handling():
    """Test that tools handle timeouts gracefully."""
    mock_supabase = AsyncMock()
    test_user_id = "test-user-123"

    # Simulate a timeout
    async def slow_query(*args, **kwargs):
        await asyncio.sleep(10)  # Longer than the 5s timeout
        return None

    with patch('api.agent.tools.fetch_weekly_summary', side_effect=slow_query):
        deps = CoachAgentDependencies(supabase=mock_supabase, user_id=test_user_id)

        from pydantic_ai import RunContext
        ctx = RunContext(deps=deps, retry=0, tool_name='fetch_weekly_progress')

        tool = nutrition_coach._function_tools['fetch_weekly_progress']

        # Should timeout and return error message
        result = await tool.function(ctx, days=7)

        assert result is not None
        assert isinstance(result, str)
        assert 'timeout' in result.lower() or 'timed out' in result.lower()


# ====================
# Tool Documentation Tests
# ====================

@pytest.mark.asyncio
async def test_all_tools_have_docstrings():
    """Test that all tools have proper documentation."""
    for tool_name, tool in nutrition_coach._function_tools.items():
        assert tool.description is not None and len(tool.description) > 0, f"Tool '{tool_name}' missing description"
        assert tool.function.__doc__ is not None, f"Tool '{tool_name}' missing docstring"


@pytest.mark.asyncio
async def test_tool_parameter_schemas():
    """Test that tools with parameters have proper schema definitions."""
    # fetch_weekly_progress should have days parameter
    weekly_tool = nutrition_coach._function_tools['fetch_weekly_progress']
    assert 'days' in str(weekly_tool.parameters_json_schema)

    # fetch_pattern_analysis should have days and pattern_type parameters
    pattern_tool = nutrition_coach._function_tools['fetch_pattern_analysis']
    assert 'days' in str(pattern_tool.parameters_json_schema)
    assert 'pattern_type' in str(pattern_tool.parameters_json_schema)
