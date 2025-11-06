# Anthropic Claude 3.5 Haiku Setup Guide

The AI Nutrition Coach agent has been configured to use **Anthropic's Claude 3.5 Haiku** model by default.

## Quick Setup

### 1. Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-`)

### 2. Create Your `.env` File

```bash
cd c:\Users\marley\siphio-website\api
copy .env.example .env
```

### 3. Edit `.env` File

Open `api\.env` and configure:

```bash
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Anthropic Claude 3.5 Haiku
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-your-api-key-here
LLM_MODEL=claude-3-5-haiku-20241022

# Application Settings
APP_ENV=development
LOG_LEVEL=INFO
DEBUG=false
```

### 4. Install Dependencies

```bash
# Activate virtual environment
.\venv\Scripts\activate

# Install updated dependencies (includes anthropic package)
pip install -r requirements.txt
```

### 5. Verify Configuration

```bash
# Test that settings load correctly
python -c "from api.agent.settings import settings; print(f'Provider: {settings.llm_provider}, Model: {settings.llm_model}')"
```

Expected output:
```
Provider: anthropic, Model: claude-3-5-haiku-20241022
```

### 6. Test the Agent

```bash
# Run tests
pytest api/tests/ -v

# Start development server
uvicorn api.main:app --reload --port 8000
```

## Claude 3.5 Haiku Details

**Model:** `claude-3-5-haiku-20241022`

**Pricing (as of Nov 2024):**
- Input: $1.00 per million tokens
- Output: $5.00 per million tokens

**Context Window:** 200,000 tokens

**Comparison to GPT-4o-mini:**

| Metric | Claude 3.5 Haiku | GPT-4o-mini |
|--------|------------------|-------------|
| Input Cost | $1.00/1M tokens | $0.15/1M tokens |
| Output Cost | $5.00/1M tokens | $0.60/1M tokens |
| Context Window | 200K tokens | 128K tokens |
| Speed | Very fast | Very fast |

**Expected Cost per Conversation:**
- ~500-800 tokens average per conversation
- Input: ~400 tokens × $1.00/1M = $0.0004
- Output: ~400 tokens × $5.00/1M = $0.002
- **Total: ~$0.0024 per conversation** (slightly higher than GPT-4o-mini's ~$0.0015)

## Alternative Models

### Other Anthropic Models

If you want to use a different Claude model, update `LLM_MODEL` in `.env`:

```bash
# Claude 3.5 Sonnet (more capable, more expensive)
LLM_MODEL=claude-3-5-sonnet-20241022

# Claude 3 Opus (most capable, most expensive)
LLM_MODEL=claude-3-opus-20240229

# Claude 3 Haiku (previous version)
LLM_MODEL=claude-3-haiku-20240307
```

### Switch Back to OpenAI

To use OpenAI instead of Anthropic, update `.env`:

```bash
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-openai-key
LLM_MODEL=gpt-4o-mini
```

The agent automatically detects the provider and uses the correct API.

## Provider Comparison

### Why Claude 3.5 Haiku?

**Pros:**
- ✅ Extremely fast inference
- ✅ Large context window (200K tokens)
- ✅ High-quality responses
- ✅ Strong at following instructions
- ✅ Good at structured output

**Cons:**
- ❌ ~60% higher cost than GPT-4o-mini
- ❌ Slightly lower throughput limits

### Why GPT-4o-mini?

**Pros:**
- ✅ Very cost-effective ($0.0015 vs $0.0024 per conversation)
- ✅ Fast and reliable
- ✅ Good tool calling support
- ✅ Higher rate limits

**Cons:**
- ❌ Smaller context window (128K vs 200K tokens)
- ❌ Slightly less nuanced responses

## Configuration Code Changes

The following files were updated to support Anthropic:

### 1. `api/agent/providers.py`

Added multi-provider support:

```python
def get_llm_model() -> Union[OpenAIModel, AnthropicModel]:
    """Get configured LLM model based on provider setting."""
    provider = settings.llm_provider.lower()

    if provider == "anthropic":
        return AnthropicModel(
            settings.llm_model,
            api_key=settings.llm_api_key
        )
    elif provider == "openai":
        return OpenAIModel(
            settings.llm_model,
            api_key=settings.llm_api_key
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")
```

### 2. `api/agent/settings.py`

Updated defaults:

```python
llm_provider: str = Field(default="anthropic", description="LLM provider")
llm_model: str = Field(default="claude-3-5-haiku-20241022", description="Model name")
```

Removed `llm_base_url` field (not needed for Anthropic).

### 3. `api/requirements.txt`

Added Anthropic SDK:

```
anthropic>=0.39.0
```

## Troubleshooting

### "Invalid API key"

**Cause:** Incorrect Anthropic API key

**Fix:**
1. Verify your API key at [console.anthropic.com](https://console.anthropic.com)
2. Make sure the key starts with `sk-ant-`
3. Check for extra spaces in `.env` file

### "Unsupported LLM provider"

**Cause:** Invalid provider name in `.env`

**Fix:**
```bash
# Must be lowercase
LLM_PROVIDER=anthropic  # ✅ Correct
LLM_PROVIDER=Anthropic  # ❌ Wrong (will work but should be lowercase)
```

### "Rate limit exceeded"

**Cause:** Hit Anthropic API rate limits

**Fix:**
- Anthropic has different rate limits based on your plan
- Check your limits at [console.anthropic.com](https://console.anthropic.com)
- Implement request throttling if needed

### Import errors

**Cause:** Missing `anthropic` package

**Fix:**
```bash
pip install anthropic>=0.39.0
# Or reinstall all dependencies
pip install -r requirements.txt
```

## Testing with Claude 3.5 Haiku

All existing tests work with both providers. Run tests:

```bash
pytest api/tests/ -v
```

The tests use `TestModel` which doesn't make real API calls, so provider choice doesn't affect tests.

For integration testing with real API calls:
```bash
# Make sure .env has valid Anthropic API key
pytest api/tests/test_integration.py -v -s
```

## Production Deployment

### Vercel

Add environment variables in Vercel dashboard:

```
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-your-key
LLM_MODEL=claude-3-5-haiku-20241022
```

### Docker

Update environment variables:

```bash
docker run -p 8000:8000 \
  -e LLM_PROVIDER=anthropic \
  -e LLM_API_KEY=sk-ant-your-key \
  -e LLM_MODEL=claude-3-5-haiku-20241022 \
  nutrition-coach-ai
```

## Cost Monitoring

### Anthropic Console

Monitor usage at [console.anthropic.com/settings/usage](https://console.anthropic.com/settings/usage)

### Expected Monthly Costs

Assuming 1000 conversations/month:
- 1000 conversations × $0.0024 = **$2.40/month**

Compare to GPT-4o-mini:
- 1000 conversations × $0.0015 = **$1.50/month**

**Recommendation:** Start with Claude 3.5 Haiku for quality, monitor costs, and switch to GPT-4o-mini if cost becomes a concern.

## Support

For Anthropic-specific issues:
- [Anthropic Documentation](https://docs.anthropic.com)
- [Anthropic Support](https://support.anthropic.com)
- [API Reference](https://docs.anthropic.com/en/api)

For agent issues, see [api/README.md](README.md)
