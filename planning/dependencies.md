# Dependencies for AI Nutrition Coach Agent

## Overview
This document specifies the **minimal** dependency configuration for the AI Nutrition Coach agent. Following the examples/main_agent_reference pattern, we focus on essential environment variables, simple dataclass dependencies, and single model provider setup.

## Environment Variables

### Required Environment Variables
```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...  # Service role key for Python backend

# LLM Configuration (REQUIRED)
LLM_PROVIDER=openai
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
```

### Optional Environment Variables
```bash
# Application Configuration (OPTIONAL - has defaults)
APP_ENV=development  # Options: development, staging, production
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR
DEBUG=false
```

### Environment File Template (.env.example)
```bash
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# LLM Provider (OpenAI recommended for Phase 1)
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-api-key-here
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1

# Application Settings
APP_ENV=development
LOG_LEVEL=INFO
DEBUG=false
```

## Python Dependencies (requirements.txt)

### Minimal Package List
```
# Core Pydantic AI
pydantic-ai>=0.0.14
pydantic>=2.0.0
pydantic-settings>=2.6.1
python-dotenv>=1.0.0

# LLM Provider (OpenAI for Phase 1)
openai>=1.0.0

# Database Integration
supabase>=2.10.0

# FastAPI Backend
fastapi>=0.115.0
uvicorn[standard]>=0.32.0

# Testing
pytest>=8.3.3
pytest-asyncio>=0.24.0
httpx>=0.27.0
```

### Why These Packages?
- **pydantic-ai**: Core agent framework
- **pydantic-settings**: Environment variable management (like main_agent_reference)
- **python-dotenv**: Load .env files (essential pattern from main_agent_reference)
- **openai**: Single model provider for Phase 1 (gpt-4o-mini for cost optimization)
- **supabase**: Async database client for Supabase PostgreSQL
- **fastapi + uvicorn**: Python API server for Next.js integration
- **pytest + httpx**: Testing infrastructure

## Agent Dependencies Dataclass

### Simple Dependencies Pattern
```python
@dataclass
class CoachAgentDependencies:
    """
    Minimal dependencies for AI Nutrition Coach agent.

    Injected into agent runtime via RunContext[CoachAgentDependencies].
    """
    supabase: AsyncClient  # Async Supabase client for database queries
    user_id: str  # Authenticated user ID (validated by Next.js layer)
```

### Design Rationale
- **Only 2 fields**: Keep it minimal - just what tools need to access user data
- **AsyncClient**: Use async Supabase client for compatibility with async agent.run()
- **user_id as string**: Simple string type, validated by Next.js auth layer before reaching Python
- **No complex state**: Tools are stateless, dependencies only provide access to external services

### Usage in Agent Tools
```python
@agent.tool
async def fetch_today_status(ctx: RunContext[CoachAgentDependencies]) -> str:
    """Fetch today's nutrition status."""
    # Access dependencies via ctx.deps
    response = await ctx.deps.supabase.table('daily_summary') \
        .select('*') \
        .eq('user_id', ctx.deps.user_id) \
        .eq('date', get_today_utc()) \
        .single() \
        .execute()

    return format_summary(response.data)
```

## Settings Configuration (settings.py)

### Implementation Pattern (Following main_agent_reference)
```python
"""
Configuration management using pydantic-settings and python-dotenv.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Supabase Configuration
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_service_key: str = Field(..., description="Supabase service role key")

    # LLM Configuration
    llm_provider: str = Field(default="openai", description="LLM provider")
    llm_api_key: str = Field(..., description="API key for LLM provider")
    llm_model: str = Field(default="gpt-4o-mini", description="Model name")
    llm_base_url: str = Field(
        default="https://api.openai.com/v1",
        description="Base URL for LLM API"
    )

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
```

### Key Design Decisions
1. **python-dotenv with load_dotenv()**: Explicitly load .env file (main_agent_reference pattern)
2. **Field validation**: Ensure API keys are not empty on startup
3. **Default values**: Sensible defaults for non-critical settings (log_level, debug)
4. **Error messages**: Helpful error messages if environment variables missing
5. **Global settings instance**: Single settings object created at module import

## Model Provider Configuration (providers.py)

### Simple Provider Pattern
```python
"""
Model provider configuration for LLM.
Following main_agent_reference pattern.
"""

from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.openai import OpenAIModel
from .settings import settings


def get_llm_model() -> OpenAIModel:
    """
    Get configured LLM model.

    Returns:
        Configured OpenAI model instance
    """
    provider = OpenAIProvider(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key
    )
    return OpenAIModel(settings.llm_model, provider=provider)
```

### Why This Pattern?
- **Single provider**: OpenAI only for Phase 1 (gpt-4o-mini)
- **No complex factories**: Simple function returns configured model
- **Environment-driven**: All configuration from settings (no hardcoded values)
- **Matches main_agent_reference**: Exact same pattern for consistency

### Usage in Agent Definition
```python
from pydantic_ai import Agent
from .providers import get_llm_model
from .dependencies import CoachAgentDependencies

# Create agent - never hardcode model strings
nutrition_coach = Agent(
    get_llm_model(),  # Always use this pattern
    deps_type=CoachAgentDependencies,
    system_prompt=SYSTEM_PROMPT
)
```

## Agent Initialization (agent.py)

### Minimal Agent Setup
```python
"""
AI Nutrition Coach Agent - Main agent definition.
"""

from pydantic_ai import Agent
from .providers import get_llm_model
from .dependencies import CoachAgentDependencies
from .prompts import SYSTEM_PROMPT

# Create agent with string output (default - no result_type needed)
nutrition_coach = Agent(
    get_llm_model(),
    deps_type=CoachAgentDependencies,
    system_prompt=SYSTEM_PROMPT
)

# Tools will be registered in tools.py using @nutrition_coach.tool decorator
# Import tools module to register them
from . import tools  # noqa: F401
```

### Agent Design Principles
1. **Default string output**: No result_type parameter (main_agent_reference pattern)
2. **Simple instantiation**: No complex builder patterns or factories
3. **Dependency injection**: deps_type specifies what tools receive via RunContext
4. **Tool registration**: Tools registered via decorator in separate tools.py module

## Supabase Client Setup (database/supabase.py)

### Async Client Pattern
```python
"""
Supabase async client for database operations.
"""

from supabase import acreate_client, AsyncClient
from ..agent.settings import settings


async def get_supabase_client() -> AsyncClient:
    """
    Create async Supabase client for database operations.

    Returns:
        Configured AsyncClient instance
    """
    return await acreate_client(
        settings.supabase_url,
        settings.supabase_service_key
    )
```

### Why Async?
- **Compatibility**: Agent.run() is async, tools must be async
- **Performance**: Non-blocking database queries
- **Single client pattern**: One client per request, passed via dependencies

### Usage in FastAPI Endpoint
```python
from fastapi import FastAPI
from api.database.supabase import get_supabase_client
from api.agent.coach_agent import nutrition_coach, CoachAgentDependencies

app = FastAPI()

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Create client once per request
    supabase = await get_supabase_client()

    # Create dependencies
    deps = CoachAgentDependencies(
        supabase=supabase,
        user_id=request.user_id
    )

    # Run agent with dependencies
    result = await nutrition_coach.run(
        request.message,
        message_history=request.conversation_history,
        deps=deps
    )

    return {"response": result.data}
```

## Dependency Design Notes

### Philosophy: Minimal and Focused
This dependency configuration follows the **"Configure only what's needed. Default to simplicity."** principle:

1. **Environment Variables**: Only 5 required variables (Supabase URL/key, LLM provider/key/model)
2. **Dependencies Dataclass**: Only 2 fields (supabase client, user_id)
3. **Single Model Provider**: OpenAI only for Phase 1 (no complex provider switching)
4. **No Premature Abstraction**: Direct configuration over factories, builders, or DI frameworks
5. **Standard Patterns**: Exact same pattern as main_agent_reference for consistency

### Security Considerations

#### API Key Management
- **Never commit .env files**: Add `api/.env` to .gitignore
- **Use .env.example**: Template file for documentation only
- **Service role key for Python**: Python backend uses service role key, not anon key
- **Validate on startup**: Settings validation ensures keys are present and non-empty

#### Authentication Strategy
- **Next.js handles auth**: All authentication logic in Next.js API routes
- **Python trusts Next.js**: Python receives validated user_id from Next.js
- **No auth tokens in Python**: Python doesn't handle Supabase auth cookies/JWTs
- **RLS enforcement**: All Supabase queries filter by user_id (automatic via RLS policies)

#### Input Validation
- **Pydantic models**: FastAPI request/response validation via Pydantic
- **User ID validation**: UUID format validation for user_id
- **Message length limits**: Max 1000 characters for user messages
- **SQL injection prevention**: Supabase client uses parameterized queries (safe by default)

### Cost Optimization

#### Model Selection
- **gpt-4o-mini**: Cost-effective model ($0.15/1M input, $0.60/1M output)
- **Target**: <$0.002 per conversation (<2000 tokens average)

#### Data Minimization
- **Pre-aggregate in tools**: Return summary statistics, not raw database rows
- **Limit conversation history**: Only last 10 message pairs in memory
- **Smart tool selection**: Agent only calls tools when needed (not every message)

### Reference to main_agent_reference Patterns

This configuration mirrors the main_agent_reference example in these ways:

1. **settings.py**:
   - Uses `pydantic-settings` with `BaseSettings`
   - Uses `python-dotenv` with explicit `load_dotenv()`
   - Field validators for API key validation
   - Global `settings` instance at module level

2. **providers.py**:
   - Simple `get_llm_model()` function returning configured model
   - Uses `OpenAIProvider` with settings-based configuration
   - No hardcoded model strings

3. **agent.py**:
   - Default string output (no result_type parameter)
   - Simple agent instantiation with `get_llm_model()`
   - Dependency injection via `deps_type`
   - Tools registered via decorator in separate module

4. **Testing approach**:
   - Use `TestModel` for unit tests (no API calls)
   - Use `Agent.override()` for test isolation
   - Integration tests with real Supabase database

## Testing Configuration

### Test Dependencies
```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock
from pydantic_ai.models.test import TestModel

@pytest.fixture
def test_settings():
    """Mock settings for testing."""
    from unittest.mock import Mock
    return Mock(
        supabase_url="https://test.supabase.co",
        supabase_service_key="test-key",
        llm_provider="openai",
        llm_api_key="test-key",
        llm_model="gpt-4o-mini"
    )

@pytest.fixture
def test_dependencies():
    """Test dependencies with mocked Supabase client."""
    from api.agent.dependencies import CoachAgentDependencies
    mock_supabase = AsyncMock()
    return CoachAgentDependencies(
        supabase=mock_supabase,
        user_id="test_user_123"
    )

@pytest.fixture
def test_agent():
    """Test agent with TestModel (no API calls)."""
    from api.agent.coach_agent import nutrition_coach
    test_model = TestModel()
    with nutrition_coach.override(model=test_model):
        yield nutrition_coach
```

### Test Validation Commands
```bash
# Verify settings load correctly
python -c "from api.agent.settings import settings; print(settings.llm_model)"

# Verify provider configuration
python -c "from api.agent.providers import get_llm_model; print(get_llm_model())"

# Verify agent initialization
python -c "from api.agent.coach_agent import nutrition_coach; print(f'Agent has {len(nutrition_coach.tools)} tools')"

# Run unit tests with TestModel
pytest api/tests/test_agent.py -v

# Run integration tests with real database
pytest api/tests/test_integration.py -v
```

## Validation Checklist

Before implementation is complete, verify:

- ✅ All required environment variables documented in .env.example
- ✅ Settings.py follows main_agent_reference pattern (pydantic-settings + python-dotenv)
- ✅ providers.py has get_llm_model() function (no hardcoded model strings)
- ✅ CoachAgentDependencies dataclass has only essential fields (supabase, user_id)
- ✅ Agent uses default string output (no result_type parameter)
- ✅ Async Supabase client pattern for compatibility with async tools
- ✅ No sensitive data in .env committed to version control
- ✅ API key validation on settings load
- ✅ Test fixtures for unit testing with TestModel
- ✅ Clear error messages if environment variables missing

## Integration with Other Subagents

### Dependencies Consumed By:
- **prompt-engineer**: Uses CoachAgentDependencies type for tool context understanding
- **tool-integrator**: Registers tools with access to RunContext[CoachAgentDependencies]
- **pydantic-ai-validator**: Tests agent with test_dependencies fixture

### Dependencies Provided By This Spec:
- Settings configuration (settings.py)
- Model provider setup (providers.py)
- Agent dependencies dataclass (CoachAgentDependencies)
- Supabase client pattern (database/supabase.py)
- Environment variable template (.env.example)
- Test fixtures (conftest.py)

## Next Steps (For Main Agent)

After reviewing this specification:

1. **Create api/ directory structure** in macro-tracker/
2. **Create requirements.txt** with listed packages
3. **Implement settings.py** following the pattern above
4. **Implement providers.py** with get_llm_model() function
5. **Create CoachAgentDependencies** dataclass in dependencies.py
6. **Create .env.example** with documented variables
7. **Set up actual .env** with real API keys (never commit!)
8. **Test configuration loads**: Verify settings and provider initialization

This specification is **minimal, focused, and production-ready** for Phase 1 implementation.