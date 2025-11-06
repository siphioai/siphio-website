"""
Test configuration and fixtures for Pydantic AI agent tests.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from pydantic_ai.models.test import TestModel
from api.agent.dependencies import CoachAgentDependencies
from datetime import datetime, timedelta


@pytest.fixture
def test_model():
    """Create TestModel for testing without API calls."""
    return TestModel()


@pytest.fixture
def mock_supabase():
    """Create mock async Supabase client."""
    mock = AsyncMock()

    # Configure table method to return a mock with chainable methods
    table_mock = MagicMock()
    mock.table.return_value = table_mock

    # Make all query methods chainable
    table_mock.select.return_value = table_mock
    table_mock.eq.return_value = table_mock
    table_mock.gte.return_value = table_mock
    table_mock.lte.return_value = table_mock
    table_mock.order.return_value = table_mock
    table_mock.single.return_value = table_mock
    table_mock.limit.return_value = table_mock

    # Configure execute to return mock response
    execute_mock = AsyncMock()
    execute_mock.return_value = MagicMock(data=None)
    table_mock.execute = execute_mock

    return mock


@pytest.fixture
def test_user_id():
    """Standard test user ID."""
    return "test-user-123"


@pytest.fixture
def test_deps(mock_supabase, test_user_id):
    """Create test dependencies with mocked Supabase client."""
    return CoachAgentDependencies(
        supabase=mock_supabase,
        user_id=test_user_id
    )


@pytest.fixture
def sample_daily_summary():
    """Sample daily summary data for testing."""
    today = datetime.utcnow().date().isoformat()
    return {
        'date': today,
        'user_id': 'test-user-123',
        'total_calories': 1800,
        'total_protein': 120,
        'total_carbs': 180,
        'total_fat': 60,
        'calories_target': 2000,
        'protein_target': 150,
        'carbs_target': 200,
        'fat_target': 65,
        'has_logged': True
    }


@pytest.fixture
def sample_weekly_data():
    """Sample weekly data for testing."""
    today = datetime.utcnow().date()
    data = []

    for i in range(7):
        date = (today - timedelta(days=i)).isoformat()
        data.append({
            'date': date,
            'user_id': 'test-user-123',
            'total_calories': 1900 + (i * 50),
            'total_protein': 130 + (i * 5),
            'total_carbs': 185 + (i * 10),
            'total_fat': 62 + (i * 2),
            'calories_target': 2000,
            'protein_target': 150,
            'carbs_target': 200,
            'fat_target': 65,
            'has_logged': True
        })

    return data


@pytest.fixture
def sample_pattern_data():
    """Sample pattern data for weekday/weekend analysis."""
    today = datetime.utcnow().date()
    data = []

    for i in range(30):
        date_obj = today - timedelta(days=i)
        is_weekend = date_obj.weekday() >= 5

        data.append({
            'date': date_obj.isoformat(),
            'user_id': 'test-user-123',
            'total_calories': 2200 if is_weekend else 1900,
            'total_protein': 140 if is_weekend else 135,
            'total_carbs': 230 if is_weekend else 185,
            'total_fat': 70 if is_weekend else 62,
            'calories_target': 2000,
            'protein_target': 150,
            'carbs_target': 200,
            'fat_target': 65,
            'has_logged': True
        })

    return data


@pytest.fixture
def sample_no_data_goals():
    """Sample goals data when user hasn't logged yet."""
    today = datetime.utcnow().date().isoformat()
    return {
        'date': today,
        'user_id': 'test-user-123',
        'calories_target': 2000,
        'protein_target': 150,
        'carbs_target': 200,
        'fat_target': 65
    }
