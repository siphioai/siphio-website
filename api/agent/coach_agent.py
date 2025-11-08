"""
AI Nutrition Coach Agent - Main agent definition.
"""

from pydantic_ai import Agent
from agent.providers import get_llm_model
from agent.dependencies import CoachAgentDependencies
from agent.prompts import SYSTEM_PROMPT

# Create agent with string output (default - no result_type needed)
nutrition_coach = Agent(
    get_llm_model(),
    deps_type=CoachAgentDependencies,
    system_prompt=SYSTEM_PROMPT
)

# Tools will be registered in tools.py using @nutrition_coach.tool decorator
# Import tools module to register them
import agent.tools  # noqa: F401
