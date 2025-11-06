# AI Nutrition Coach - Python Backend

Production-ready AI nutrition coach agent built with Pydantic AI, integrated with the macro tracker web application.

## Overview

This Python backend provides an intelligent nutrition coaching service that:
- Provides real-time answers about user's nutrition progress and patterns
- Intelligently fetches only relevant data based on conversation context
- Maintains conversation memory for natural follow-up questions
- Delivers supportive, data-informed coaching without judgment
- Operates cost-effectively (<$0.002 per conversation)
- Respects user privacy through proper authentication and RLS

## Architecture

```
api/
├── agent/              # Pydantic AI agent
│   ├── coach_agent.py  # Main agent definition
│   ├── dependencies.py # Agent dependencies
│   ├── prompts.py      # System prompts
│   ├── providers.py    # LLM model provider
│   ├── settings.py     # Configuration
│   └── tools.py        # Agent tools (3 tools)
├── database/           # Database layer
│   ├── queries.py      # Database query functions
│   └── supabase.py     # Supabase client
├── utils/              # Utilities
│   └── date_helpers.py # Date utility functions
├── tests/              # Test suite (67 tests)
├── main.py             # FastAPI application
└── requirements.txt    # Python dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file in the `api/` directory:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# LLM Provider
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1

# Application
APP_ENV=development
LOG_LEVEL=INFO
DEBUG=false
```

**Security:** Never commit `.env` files! Use `.env.example` as a template.

### 3. Run Development Server

```bash
uvicorn api.main:app --reload --port 8000
```

Server starts at [http://localhost:8000](http://localhost:8000)

### 4. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "message": "How am I doing today?"
  }'
```

## Agent Features

### 3 Core Tools

1. **fetch_today_status** - Current day nutrition progress
   - Use: "How am I doing today?", "What's my protein at?"
   - Returns: Today's totals + remaining amounts

2. **fetch_weekly_progress** - Recent trends and consistency metrics
   - Use: "How's my week?", "Am I consistent?"
   - Returns: Averages, hit rates, streaks

3. **fetch_pattern_analysis** - Long-term behavioral pattern analysis
   - Use: "Why can't I stick to my carbs on weekends?"
   - Returns: Comparative insights (weekday/weekend, trends)

### Conversation Memory

The agent maintains conversation context across multiple turns:

```python
# First message
response1 = await agent.run("What's my protein at today?", deps=deps)

# Follow-up (remembers we're talking about protein)
response2 = await agent.run(
    "What about yesterday?",
    message_history=response1.all_messages(),
    deps=deps
)
```

### System Prompt

Supportive nutrition coach with 5 core personality traits:
- Encouraging and positive, but realistic (no fake hype)
- Data-informed—always references specific numbers
- Conversational—like a knowledgeable friend
- Concise—gets to the point quickly
- Non-judgmental—frames struggles as normal

## API Endpoints

### POST /api/chat

Main chat endpoint for nutrition coach interactions.

**Request:**
```json
{
  "user_id": "uuid-here",
  "message": "How am I doing today?",
  "conversation_history": []  // Optional
}
```

**Response:**
```json
{
  "response": "You're at 87g of 160g protein (54%). You have 73g left for today.",
  "conversation_history": [...],  // Updated history
  "usage": {
    "input_tokens": 450,
    "output_tokens": 120,
    "total_tokens": 570
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "nutrition-coach-ai"
}
```

## Testing

### Run All Tests

```bash
pytest api/tests/ -v
```

Expected: **67 tests passing** in ~3-5 seconds

### Test Categories

- **Agent Tests** (16 tests) - Agent initialization, tool registration, conversation memory
- **Tool Tests** (25 tests) - Each tool with error handling and edge cases
- **Integration Tests** (16 tests) - FastAPI endpoints, full request/response flow
- **Requirement Tests** (10 tests) - PRP validation gates

### Test with Real Database

```bash
# Set TEST_USER_ID in test file
pytest api/tests/test_integration.py -v -s
```

See [tests/README.md](tests/README.md) for comprehensive testing documentation.

## Development

### Project Structure

```python
# Agent definition
from api.agent.coach_agent import nutrition_coach, CoachAgentDependencies
from api.database.supabase import get_supabase_client

# Create dependencies
supabase = await get_supabase_client()
deps = CoachAgentDependencies(supabase=supabase, user_id="user-id")

# Run agent
result = await nutrition_coach.run("How's my week?", deps=deps)
print(result.data)  # Agent response
```

### Adding New Tools

1. Create query function in `api/database/queries.py`
2. Add tool in `api/agent/tools.py` using `@nutrition_coach.tool` decorator
3. Test tool in `api/tests/test_tools.py`

Example:
```python
@nutrition_coach.tool
async def new_tool(ctx: RunContext[CoachAgentDependencies]) -> str:
    """Tool description for the agent."""
    summary = await fetch_data(ctx.deps.supabase, ctx.deps.user_id)
    return format_summary(summary)
```

### Configuration Management

All configuration is managed through `api/agent/settings.py` using pydantic-settings:

```python
from api.agent.settings import settings

print(settings.llm_model)  # gpt-4o-mini
print(settings.supabase_url)  # https://...
```

### Logging

Configure logging level via environment:

```bash
LOG_LEVEL=DEBUG  # Options: DEBUG, INFO, WARNING, ERROR
```

## Deployment

### Vercel (Recommended)

The agent is designed for Vercel serverless deployment alongside Next.js.

**vercel.json** (in macro-tracker root):
```json
{
  "builds": [
    {
      "src": "api/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/py/(.*)",
      "dest": "api/main.py"
    }
  ]
}
```

**Environment Variables** (Vercel project settings):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `LLM_API_KEY`
- `LLM_MODEL`
- `LLM_PROVIDER`

### Docker (Alternative)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY api/ /app/api/
COPY requirements.txt /app/

RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Security

### Authentication Flow

1. **Next.js Layer**: Validates user session via Supabase auth
2. **Extracts user_id**: Queries `users` table with `auth_id`
3. **Calls Python**: Passes validated `user_id` to Python backend
4. **Python Layer**: Trusts `user_id`, queries Supabase with RLS filtering

### Data Privacy

- Row-Level Security (RLS) enforces data isolation
- Service role key for Python backend
- No sensitive data logged to console
- API keys validated on startup
- Input validation via Pydantic models

### Rate Limiting

Implement in Next.js API layer:
```typescript
// app/api/ai/chat/route.ts
const rateLimiter = new RateLimiter(50, '1h');  // 50 req/hour per user
```

## Performance

### Metrics

- Response time: <2s for 95% of requests
- Token usage: ~500-800 tokens per conversation
- Cost: <$0.002 per conversation (GPT-4o-mini)

### Optimization

- Pre-aggregate data in tools (minimize tokens)
- Limit conversation history to last 10 message pairs
- Use timeout for database queries (5s max)
- Cache frequently accessed summaries (optional)

## Troubleshooting

### "Failed to load settings"

**Cause:** Missing environment variables

**Fix:**
```bash
cp api/.env.example api/.env
# Edit api/.env with your actual API keys
```

### "Unable to fetch today's status"

**Cause:** Database connection error or RLS issue

**Debug:**
```python
# Test Supabase connection
python -c "
import asyncio
from api.database.supabase import get_supabase_client
asyncio.run(get_supabase_client())
"
```

### "Agent has 0 tools"

**Cause:** Tools module not imported

**Fix:** Ensure `api/agent/coach_agent.py` imports tools:
```python
from . import tools  # noqa: F401
```

### Tests failing

**Cause:** Missing dependencies or environment variables

**Fix:**
```bash
pip install -r requirements.txt
pytest api/tests/ -v
```

## Integration with Next.js

### Next.js API Route

Create `app/api/ai/chat/route.ts`:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user_id from users table
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  const body = await request.json();
  const { message, conversation_history = [] } = body;

  // Call Python backend
  const pythonUrl = process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : process.env.VERCEL_URL;

  const response = await fetch(`${pythonUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: profile.id,
      message,
      conversation_history
    })
  });

  return NextResponse.json(await response.json());
}
```

## Resources

- [Pydantic AI Documentation](https://ai.pydantic.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## Support

For issues and questions:
- Review [tests/VALIDATION_REPORT.md](tests/VALIDATION_REPORT.md) for validation status
- Check [tests/README.md](tests/README.md) for testing documentation
- Review FastAPI logs for runtime errors

## License

Part of the macro tracker application.
