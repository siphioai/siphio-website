# Frontend Integration Guide - AI Nutrition Coach

## Files You Need to Review

### 1. API Endpoint Contract
**File:** `api/main.py`
**Lines to focus on:** 25-96

**What you need to know:**
- **Endpoint:** `POST http://127.0.0.1:8000/api/chat`
- **Request Format:**
```typescript
{
  user_id: string;          // UUID from your auth system
  message: string;          // User's chat message (1-1000 chars)
  conversation_history?: Array<{...}>; // Optional - previous messages
}
```
- **Response Format:**
```typescript
{
  response: string;         // Agent's reply
  conversation_history: Array<{...}>; // Updated conversation
  usage: {
    input_tokens: number,
    output_tokens: number,
    total_tokens: number
  }
}
```

### 2. Request/Response Models
**File:** `api/main.py`
**Lines:** 25-39

```python
class ChatRequest(BaseModel):
    user_id: str                    # Required: UUID
    message: str                    # Required: 1-1000 chars
    conversation_history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    response: str                   # Agent's text response
    conversation_history: List[Dict[str, Any]]
    usage: Dict[str, Any]          # Token usage stats
```

### 3. Agent Capabilities (What it can do)
**File:** `api/agent/tools.py`
**Lines:** 24-220

**The agent has 3 tools:**

#### Tool 1: `fetch_today_status` (Lines 24-85)
- **When triggered:** User asks about today ("How am I doing today?", "What's my protein at?")
- **What it returns:** Current day progress with calories, protein, carbs, fat (current vs target)
- **Database table:** `daily_summary`, `macro_goals`

#### Tool 2: `fetch_weekly_progress` (Lines 88-150)
- **When triggered:** User asks about trends ("How was my week?", "Am I consistent?")
- **What it returns:** 7-day aggregated data with averages and trends
- **Database table:** `daily_summary`

#### Tool 3: `fetch_pattern_analysis` (Lines 153-220)
- **When triggered:** User asks about patterns ("What are my eating patterns?")
- **What it returns:** Macro consistency analysis with standard deviations
- **Database table:** `daily_summary`

### 4. Database Schema Requirements
**File:** `api/database/queries.py`
**Lines:** 14-170

**Your Supabase needs these tables:**

#### Table: `daily_summary`
```sql
- user_id: UUID (foreign key to auth.users)
- date: DATE
- total_calories: NUMERIC
- total_protein: NUMERIC
- total_carbs: NUMERIC
- total_fat: NUMERIC
- calories_target: NUMERIC
- protein_target: NUMERIC
- carbs_target: NUMERIC
- fat_target: NUMERIC
```

#### Table: `macro_goals`
```sql
- user_id: UUID
- date: DATE
- calories_target: NUMERIC
- protein_target: NUMERIC
- carbs_target: NUMERIC
- fat_target: NUMERIC
```

### 5. Agent Configuration
**File:** `api/agent/settings.py`
**Lines:** 30-55

**Environment variables needed:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
LLM_PROVIDER=anthropic
LLM_API_KEY=your-anthropic-key
LLM_MODEL=claude-3-5-haiku-20241022
```

### 6. Agent Personality & System Prompt
**File:** `api/agent/prompts.py`
**Lines:** 1-80

**Key personality traits:**
- Supportive and encouraging (not judgmental)
- Data-driven with actionable insights
- Conversational and empathetic
- Focuses on patterns and progress

### 7. Testing Scripts (Use as examples)
**File:** `api/test_chat.ps1`
**Lines:** 1-34

Shows how to make a proper HTTP request with:
- Correct headers (`Content-Type: application/json`)
- Proper body format
- UUID format for user_id

---

## Frontend Integration Checklist

### Step 1: Set Up API Client
Create a service to communicate with the agent:

```typescript
// services/nutritionCoach.ts
const AGENT_API_URL = 'http://127.0.0.1:8000'; // Change for production

interface ChatMessage {
  user_id: string;
  message: string;
  conversation_history?: any[];
}

interface ChatResponse {
  response: string;
  conversation_history: any[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export async function sendChatMessage(
  userId: string,
  message: string,
  history: any[] = []
): Promise<ChatResponse> {
  const response = await fetch(`${AGENT_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      message,
      conversation_history: history,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get agent response');
  }

  return response.json();
}
```

### Step 2: Chat UI Component
Create a chat interface component:

```typescript
// components/NutritionCoachChat.tsx
import { useState } from 'react';
import { sendChatMessage } from '@/services/nutritionCoach';

export default function NutritionCoachChat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to UI
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userId, input, conversationHistory);

      // Add agent response to UI
      const agentMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, agentMessage]);

      // Update conversation history for context
      setConversationHistory(response.conversation_history);
    } catch (error) {
      console.error('Chat error:', error);
      // Handle error in UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Ask about your nutrition..."
        disabled={isLoading}
      />
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? 'Thinking...' : 'Send'}
      </button>
    </div>
  );
}
```

### Step 3: Get User ID from Auth
The agent needs the authenticated user's UUID:

```typescript
// In your auth context or page
import { useUser } from '@supabase/auth-helpers-react';

function NutritionPage() {
  const user = useUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  return <NutritionCoachChat userId={user.id} />;
}
```

### Step 4: Test the Integration
Use these test queries to verify it's working:

1. **Basic greeting:** "Hello! Can you help me with my nutrition?"
2. **Today's status:** "How am I doing today?"
3. **Weekly progress:** "How was my week?"
4. **Pattern analysis:** "What are my eating patterns?"

---

## Important Notes

### CORS Configuration
You'll need to add CORS to the FastAPI app for frontend to access it:

```python
# Add to api/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production Considerations
1. **Change API URL** from `127.0.0.1:8000` to your production domain
2. **Use environment variables** for API URL
3. **Implement rate limiting** in frontend
4. **Add error handling** for network failures
5. **Show loading states** while agent is thinking
6. **Store conversation history** in local storage or database

### Conversation History Management
The `conversation_history` maintains context between messages:
- Store it in React state for the session
- Optionally persist to localStorage or database
- Reset it when starting a new conversation
- Can get large - consider truncating old messages

---

## Quick Start Files to Review (Priority Order)

1. ✅ **`api/main.py`** (Lines 25-96) - API contract
2. ✅ **`api/test_chat.ps1`** - Working example request
3. ✅ **`api/agent/tools.py`** - What the agent can do
4. ✅ **`api/database/queries.py`** - Database requirements
5. ✅ **`api/agent/prompts.py`** - Agent personality

After reviewing these 5 files, you'll understand everything needed to integrate the agent into your frontend!
