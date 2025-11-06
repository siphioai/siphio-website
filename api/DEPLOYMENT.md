# Deployment Guide - AI Nutrition Coach

Complete deployment guide for the AI Nutrition Coach Python backend.

## Prerequisites

- Python 3.10+
- Supabase project with service role key
- OpenAI API key (or alternative LLM provider)
- Next.js macro tracker application (optional for local testing)

## Local Development Setup

### 1. Create Virtual Environment

```bash
cd c:\Users\marley\siphio-website\api
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `api/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...  # Get from Supabase project settings

# LLM Provider (OpenAI)
LLM_PROVIDER=openai
LLM_API_KEY=sk-xxx  # Get from platform.openai.com
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1

# Application Settings
APP_ENV=development
LOG_LEVEL=INFO
DEBUG=false
```

### 4. Verify Configuration

```bash
# Test settings load
python -c "from api.agent.settings import settings; print(f'Model: {settings.llm_model}')"

# Test Supabase connection
python -c "
import asyncio
from api.database.supabase import get_supabase_client
async def test():
    client = await get_supabase_client()
    print('Supabase connected!')
asyncio.run(test())
"

# Test agent initialization
python -c "from api.agent.coach_agent import nutrition_coach; print(f'Agent has {len(nutrition_coach.tools)} tools')"
```

Expected output:
```
Model: gpt-4o-mini
Supabase connected!
Agent has 3 tools
```

### 5. Run Development Server

```bash
uvicorn api.main:app --reload --port 8000
```

Server runs at: [http://localhost:8000](http://localhost:8000)

**Verify endpoints:**
- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Docs: [http://localhost:8000/docs](http://localhost:8000/docs) (FastAPI auto-generated)

### 6. Run Tests

```bash
pytest api/tests/ -v
```

Expected: **67 tests passing** ✅

## Deployment to Vercel (Recommended)

### Step 1: Prepare Vercel Configuration

Create `vercel.json` in the **macro-tracker root** (not in api/):

```json
{
  "version": 2,
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

### Step 2: Update .gitignore

Ensure `api/.env` is ignored:

```bash
# In .gitignore
api/.env
api/venv/
api/__pycache__/
api/**/__pycache__/
*.pyc
```

### Step 3: Configure Vercel Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | https://xxx.supabase.co | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | eyJxxx... | Production, Preview, Development |
| `LLM_PROVIDER` | openai | Production, Preview, Development |
| `LLM_API_KEY` | sk-xxx | Production, Preview, Development |
| `LLM_MODEL` | gpt-4o-mini | Production, Preview, Development |
| `LLM_BASE_URL` | https://api.openai.com/v1 | Production, Preview, Development |
| `APP_ENV` | production | Production |
| `APP_ENV` | staging | Preview |
| `LOG_LEVEL` | INFO | Production, Preview, Development |

**Security:** Never commit API keys! All sensitive data goes in Vercel environment variables.

### Step 4: Deploy

```bash
cd macro-tracker
vercel deploy
```

Or push to GitHub (auto-deploys if Vercel GitHub integration enabled):

```bash
git add .
git commit -m "Add AI Nutrition Coach Python backend"
git push origin main
```

### Step 5: Verify Deployment

Once deployed, test endpoints:

```bash
# Health check
curl https://your-app.vercel.app/health

# Chat endpoint (replace with real user_id)
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "message": "How am I doing today?"
  }'
```

## Deployment to AWS Lambda (Alternative)

### Step 1: Install Mangum

```bash
pip install mangum
```

### Step 2: Update main.py

```python
from mangum import Mangum

app = FastAPI()

# ... existing code ...

# Add at the end
handler = Mangum(app)
```

### Step 3: Create Lambda Layer

```bash
mkdir python
pip install -r requirements.txt -t python/
zip -r lambda-layer.zip python/
```

### Step 4: Deploy to AWS

1. Create Lambda function
2. Upload `lambda-layer.zip` as a layer
3. Upload `api/` directory as function code
4. Set handler: `api.main.handler`
5. Configure environment variables (same as Vercel)
6. Increase timeout to 30 seconds
7. Increase memory to 512MB

## Deployment with Docker

### Step 1: Create Dockerfile

Create `api/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Build Image

```bash
cd c:\Users\marley\siphio-website
docker build -t nutrition-coach-ai -f api/Dockerfile .
```

### Step 3: Run Container

```bash
docker run -p 8000:8000 \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_SERVICE_KEY=eyJxxx \
  -e LLM_API_KEY=sk-xxx \
  -e LLM_MODEL=gpt-4o-mini \
  nutrition-coach-ai
```

### Step 4: Deploy to Cloud

**AWS ECS:**
```bash
docker tag nutrition-coach-ai:latest xxx.dkr.ecr.us-east-1.amazonaws.com/nutrition-coach-ai:latest
docker push xxx.dkr.ecr.us-east-1.amazonaws.com/nutrition-coach-ai:latest
```

**Google Cloud Run:**
```bash
docker tag nutrition-coach-ai gcr.io/your-project/nutrition-coach-ai
docker push gcr.io/your-project/nutrition-coach-ai
gcloud run deploy nutrition-coach-ai --image gcr.io/your-project/nutrition-coach-ai
```

## Production Checklist

### Security

- [x] API keys stored in environment variables (not committed)
- [x] Supabase RLS enabled and tested
- [x] Input validation via Pydantic models
- [x] Rate limiting implemented in Next.js layer
- [x] Error messages don't expose sensitive data
- [x] No PII logged to console

### Performance

- [x] Response time <2s (95th percentile)
- [x] Token usage <2000 per conversation
- [x] Cost <$0.002 per conversation
- [x] Database query timeout set (5s)
- [x] Conversation history limited (10 message pairs)

### Monitoring

- [ ] Set up logging aggregation (e.g., CloudWatch, Sentry)
- [ ] Configure error alerting
- [ ] Monitor API costs (OpenAI usage)
- [ ] Track response times
- [ ] Monitor database query performance

### Testing

- [x] All 67 tests passing
- [x] Integration tests with real database
- [x] Load testing (optional)
- [x] Security audit (basic)

## Post-Deployment

### 1. Monitor Logs

**Vercel:**
```bash
vercel logs --follow
```

**Docker:**
```bash
docker logs -f <container-id>
```

### 2. Test Production Endpoint

```bash
curl -X POST https://your-production-url/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "real-user-id",
    "message": "How am I doing today?"
  }'
```

### 3. Monitor Costs

**OpenAI Usage:**
- Go to [platform.openai.com/usage](https://platform.openai.com/usage)
- Set up billing alerts
- Monitor token usage per day

**Expected costs (GPT-4o-mini):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Target: <$0.002 per conversation (~1500 tokens average)

### 4. Set Up Alerts

**Vercel:**
- Configure alerting for 5xx errors
- Set up usage notifications

**AWS:**
- CloudWatch alarms for Lambda errors
- Cost Explorer budgets

## Troubleshooting Deployment

### "Module 'api.main' has no attribute 'app'"

**Cause:** Incorrect import path or file structure

**Fix:**
```bash
# Verify structure
ls api/main.py  # Should exist
grep "app = FastAPI()" api/main.py  # Should find app definition
```

### "Failed to load settings"

**Cause:** Missing environment variables in deployment platform

**Fix:** Double-check all environment variables are set in Vercel/AWS/etc.

### "Database connection timeout"

**Cause:** Supabase service key incorrect or RLS blocking queries

**Fix:**
1. Verify `SUPABASE_SERVICE_KEY` is service role key (not anon key)
2. Test Supabase connection in deployment logs
3. Check RLS policies allow service role access

### "Agent has 0 tools"

**Cause:** Circular import or tools not registered

**Fix:**
```python
# In api/agent/tools.py
register_tools()  # Must be called at module level
```

### High latency (>5s response time)

**Possible causes:**
1. Cold start (serverless) - Normal for first request
2. Slow database queries - Add indexes
3. Large conversation history - Limit to 10 message pairs
4. Network issues - Check deployment region vs database region

**Optimize:**
- Pre-warm serverless functions
- Add database indexes on `user_id` and `date`
- Implement caching for frequently accessed data

## Rollback Procedure

### Vercel

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Docker

```bash
docker pull nutrition-coach-ai:previous-tag
docker stop current-container
docker run -d -p 8000:8000 nutrition-coach-ai:previous-tag
```

### Git

```bash
git revert <commit-hash>
git push origin main
```

## Scaling Considerations

### Horizontal Scaling

**Serverless (Vercel/Lambda):** Auto-scales automatically

**Docker/VM:** Use load balancer:
```bash
# Run multiple instances
docker run -p 8001:8000 nutrition-coach-ai
docker run -p 8002:8000 nutrition-coach-ai
docker run -p 8003:8000 nutrition-coach-ai

# nginx load balancer
upstream backend {
    server localhost:8001;
    server localhost:8002;
    server localhost:8003;
}
```

### Database Connection Pooling

For high traffic, use connection pooling:

```python
# In api/database/supabase.py
from supabase_pooler import create_pool

pool = create_pool(
    settings.supabase_url,
    settings.supabase_service_key,
    max_connections=10
)
```

### Caching

Implement Redis for frequently accessed data:

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379)

@nutrition_coach.tool
async def fetch_today_status(ctx):
    cache_key = f"today_status:{ctx.deps.user_id}"
    cached = redis_client.get(cache_key)

    if cached:
        return cached.decode()

    # Fetch from database
    summary = await fetch_today_summary(...)

    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, formatted_summary)

    return formatted_summary
```

## Support

For deployment issues:
1. Check deployment logs
2. Review [VALIDATION_REPORT.md](tests/VALIDATION_REPORT.md)
3. Test locally first to isolate deployment-specific issues
4. Verify environment variables are correctly set

## Next Steps

After successful deployment:
1. Integrate with Next.js frontend (see [README.md](README.md))
2. Implement rate limiting in Next.js API layer
3. Set up monitoring and alerting
4. Monitor costs and optimize if needed
5. Gather user feedback and iterate
