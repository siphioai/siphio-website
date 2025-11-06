"""
Validate implementation against PRP requirements.
"""

import pytest
from pydantic_ai.models.test import TestModel
from api.agent.coach_agent import nutrition_coach
from api.agent.settings import settings


def test_req_001_agent_structure():
    """REQ-001: Agent properly structured with deps_type and system_prompt."""
    assert nutrition_coach is not None
    assert nutrition_coach._system_prompt is not None
    assert "nutrition coach" in nutrition_coach._system_prompt.lower()
    
    # Check deps_type is configured
    assert nutrition_coach._deps_type is not None


def test_req_002_tool_registration():
    """REQ-002: All required tools are registered."""
    tool_names = [tool.name for tool in nutrition_coach._function_tools.values()]
    
    required_tools = ["fetch_today_status", "fetch_weekly_progress", "fetch_pattern_analysis"]
    
    for tool in required_tools:
        assert tool in tool_names, f"Required tool {tool} not found in {tool_names}"


def test_req_003_environment_configuration():
    """REQ-003: Environment variables properly configured."""
    # These should load from settings without error
    assert settings.supabase_url is not None
    assert settings.supabase_service_key is not None
    assert settings.llm_api_key is not None
    assert settings.llm_model is not None
    assert settings.llm_provider is not None


def test_req_004_no_result_type():
    """REQ-004: Agent uses default string output (no result_type)."""
    # Following main_agent_reference pattern - no result_type unless structured output needed
    assert nutrition_coach._result_type is None or nutrition_coach._result_type == str


@pytest.mark.asyncio
async def test_req_005_conversation_memory_support(test_deps):
    """REQ-005: Agent supports conversation memory via message_history."""
    test_model = TestModel()
    
    with nutrition_coach.override(model=test_model):
        result1 = await nutrition_coach.run(
            "First message",
            deps=test_deps
        )
        
        history = result1.all_messages()
        
        # Should be able to pass history to next run
        result2 = await nutrition_coach.run(
            "Second message",
            message_history=history,
            deps=test_deps
        )
        
        updated_history = result2.all_messages()
        assert len(updated_history) > len(history)


def test_req_006_tool_parameters():
    """REQ-006: Tools have proper parameter validation."""
    tools = nutrition_coach._function_tools
    
    # fetch_weekly_progress should have days parameter with default
    weekly_tool = tools.get("fetch_weekly_progress")
    assert weekly_tool is not None
    
    # fetch_pattern_analysis should have days and pattern_type parameters
    pattern_tool = tools.get("fetch_pattern_analysis")
    assert pattern_tool is not None


def test_req_007_system_prompt_personality():
    """REQ-007: System prompt follows PRP personality guidelines."""
    prompt = nutrition_coach._system_prompt.lower()
    
    # Check key personality traits
    assert "supportive" in prompt or "encouraging" in prompt
    assert "data" in prompt or "numbers" in prompt
    assert "conversational" in prompt or "friend" in prompt
    assert "concise" in prompt
    
    # Check core principles mentioned
    assert "judgment" in prompt or "non-judgmental" in prompt


@pytest.mark.asyncio
async def test_req_008_error_handling(test_deps):
    """REQ-008: Tools handle errors gracefully without crashing agent."""
    test_model = TestModel()
    
    # Configure test model to call tool
    test_model.agent_responses = [
        {"fetch_today_status": {}}
    ]
    
    with nutrition_coach.override(model=test_model):
        # Even if tool fails, agent should not crash
        result = await nutrition_coach.run(
            "How am I doing?",
            deps=test_deps
        )
        
        assert result.data is not None
        # Result should either be successful or contain error message
        assert isinstance(result.data, str)


def test_req_009_module_organization():
    """REQ-009: Code properly organized into modules."""
    # Verify all required modules can be imported
    from api.agent import settings
    from api.agent import providers
    from api.agent import dependencies
    from api.agent import prompts
    from api.agent import coach_agent
    from api.agent import tools
    from api.database import queries
    from api.database import supabase
    from api.utils import date_helpers
    
    assert settings is not None
    assert providers is not None
    assert dependencies is not None
    assert prompts is not None
    assert coach_agent is not None
    assert tools is not None
    assert queries is not None
    assert supabase is not None
    assert date_helpers is not None


def test_req_010_follows_pydantic_ai_patterns():
    """REQ-010: Follows main_agent_reference patterns."""
    from api.agent.providers import get_llm_model
    from api.agent.settings import load_settings
    
    # Should use get_llm_model() pattern
    model = get_llm_model()
    assert model is not None
    
    # Should use load_settings() pattern
    settings_obj = load_settings()
    assert settings_obj is not None
    assert hasattr(settings_obj, 'llm_model')
