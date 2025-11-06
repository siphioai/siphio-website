"""
Model provider configuration for LLM.
Following main_agent_reference pattern with multi-provider support.
"""

from typing import Union
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.models.anthropic import AnthropicModel
from .settings import settings


def get_llm_model() -> Union[OpenAIModel, AnthropicModel]:
    """
    Get configured LLM model based on provider setting.

    Supports:
    - openai: OpenAI models (gpt-4o-mini, gpt-4, etc.)
    - anthropic: Anthropic Claude models (claude-3-5-haiku-20241022, etc.)

    Returns:
        Configured model instance based on LLM_PROVIDER env var
    """
    provider = settings.llm_provider.lower()

    if provider == "anthropic":
        # Anthropic Claude models
        # Note: AnthropicModel automatically reads ANTHROPIC_API_KEY env var
        # So we need to ensure it's set in the environment
        import os
        os.environ['ANTHROPIC_API_KEY'] = settings.llm_api_key
        return AnthropicModel(settings.llm_model)
    elif provider == "openai":
        # OpenAI models
        return OpenAIModel(
            settings.llm_model,
            api_key=settings.llm_api_key
        )
    else:
        raise ValueError(
            f"Unsupported LLM provider: {provider}. "
            f"Supported providers: 'openai', 'anthropic'"
        )