"""
Configuration management using pydantic-settings and python-dotenv.
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ConfigDict
from dotenv import load_dotenv

# Get the api directory path
API_DIR = Path(__file__).parent.parent
ENV_FILE = API_DIR / ".env"

# Load environment variables from api/.env file
load_dotenv(dotenv_path=ENV_FILE)


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = ConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Supabase Configuration
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_service_key: str = Field(..., description="Supabase service role key")

    # LLM Configuration
    llm_provider: str = Field(default="anthropic", description="LLM provider (openai or anthropic)")
    llm_api_key: str = Field(..., description="API key for LLM provider")
    llm_model: str = Field(default="claude-3-5-haiku-20241022", description="Model name")

    # Application Configuration
    app_env: str = Field(default="development", description="Environment")
    log_level: str = Field(default="INFO", description="Logging level")
    debug: bool = Field(default=False, description="Debug mode")

    @field_validator("llm_api_key", "supabase_service_key")
    @classmethod
    def validate_api_keys(cls, v):
        """Ensure API keys are not empty."""
        if not v or v.strip() == "":
            raise ValueError("API key cannot be empty")
        return v

    @field_validator("app_env")
    @classmethod
    def validate_environment(cls, v):
        """Validate environment setting."""
        valid_envs = ["development", "staging", "production"]
        if v not in valid_envs:
            raise ValueError(f"app_env must be one of {valid_envs}")
        return v


def load_settings() -> Settings:
    """Load settings with proper error handling."""
    try:
        return Settings()
    except Exception as e:
        error_msg = f"Failed to load settings: {e}"
        if "llm_api_key" in str(e).lower():
            error_msg += "\nMake sure to set LLM_API_KEY in your .env file"
        if "supabase" in str(e).lower():
            error_msg += "\nMake sure to set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file"
        raise ValueError(error_msg) from e


# Global settings instance
settings = load_settings()