name: "AI Nutrition Coach - Frontend Integration PRP"
description: |
  Complete frontend integration of the AI Nutrition Coach into the Next.js macro tracker application.
  This PRP provides comprehensive context for one-pass implementation success.

---

## Goal

Integrate the existing Pydantic AI nutrition coach backend into the Next.js macro tracker web application with a modal-based chat interface, enabling authenticated users to have conversational interactions about their nutrition data with context-aware quick actions and real-time insights.

## Why

- **User Value**: Provides immediate, personalized nutrition guidance without leaving the app
- **Engagement**: Transforms passive tracking into active coaching conversations
- **Data Utilization**: Makes complex nutrition data accessible through natural language
- **Competitive Feature**: AI coaching differentiates the app in a crowded market
- **Backend Already Built**: Backend has 67 passing tests and is production-ready, frontend is the final piece

## What

A fully functional AI nutrition coach chat interface that:
- Opens in a modal dialog from the Bot button on the main dashboard
- Maintains conversation memory throughout the session
- Adapts quick actions based on whether user has logged meals today
- Provides real-time responses (<2s) from the Python backend
- Handles errors gracefully with retry functionality
- Works on desktop web browsers (responsive design for different screen sizes)
- Matches the existing design system perfectly
- Persists conversation history across page refreshes (sessionStorage)

### Success Criteria

- [ ] Bot button on dashboard opens AI coach modal
- [ ] Modal displays appropriate quick actions (data-driven or educational)
- [ ] User can send messages and receive AI responses within 2 seconds
- [ ] Conversation memory works (follow-up questions have context)
- [ ] Error states display with retry functionality
- [ ] Auto-scroll works smoothly on new messages
- [ ] Design matches existing components (colors, spacing, animations)
- [ ] Responsive design works on different desktop screen sizes
- [ ] Conversation persists on page refresh during session
- [ ] No console errors or TypeScript errors
- [ ] Manual testing checklist passes (see Testing section)

## All Needed Context

### Documentation & References

```yaml
MUST READ - Core Documentation:
  - url: https://nextjs.org/docs/app
    section: API Routes with Route Handlers
    why: Creating /app/api/ai/chat/route.ts for Next.js <-> Python communication
    critical: Next.js 15 uses async APIs for request data (headers, cookies, params)

  - url: https://supabase.com/docs/guides/auth/server-side/nextjs
    section: Server-side authentication with cookies
    why: Validating user sessions and extracting user_id in API route
    critical: Must use createServerClient from @supabase/ssr

  - url: https://www.radix-ui.com/primitives/docs/components/dialog
    section: Dialog component API
    why: Modal container pattern (already used in MacroGoalsForm.tsx)
    critical: Use DialogTrigger, DialogContent, DialogHeader patterns

  - url: https://www.framer.com/motion/
    section: AnimatePresence for modal animations
    why: Smooth modal open/close animations matching existing design
    pattern: |
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

  - url: https://lucide.dev/
    section: Icon library
    why: Bot, Send, Sparkles, TrendingUp icons
    critical: Already imported in page.tsx (line 10)

  - url: https://tailwindcss.com/docs
    section: Utility classes and responsive design
    why: Styling with existing design tokens
    critical: Use existing CSS variables from globals.css (--primary, --chart-2, etc.)

Backend Integration References:
  - file: api/README.md
    lines: 135-173
    why: Complete API contract for /api/chat endpoint
    critical: Request format { user_id, message, conversation_history }

  - file: FRONTEND_INTEGRATION_GUIDE.md
    lines: 1-319
    why: Step-by-step integration guide with TypeScript examples
    critical: Shows exact request/response types and error handling

  - file: api/main.py
    lines: 25-103
    why: Exact backend endpoint implementation with Pydantic models
    critical: Response includes { response, conversation_history, usage }

Frontend Patterns to Follow:
  - file: macro-tracker/components/ui/dialog.tsx
    lines: 1-143
    why: Modal pattern with Radix UI primitives
    pattern: Dialog, DialogTrigger, DialogContent, DialogHeader structure

  - file: macro-tracker/components/ui/button.tsx
    lines: 1-61
    why: Button variants and sizing for Send, Quick Actions
    pattern: variant="default" (primary blue), variant="outline", size="default|sm"

  - file: macro-tracker/components/MacroGoalsForm.tsx
    lines: 1-100
    why: Dialog-based form with loading states and state management
    pattern: useState for open, saving, showSuccess; Dialog with controlled state

  - file: macro-tracker/components/FoodLog.tsx
    why: Complex interactive component with real-time updates
    pattern: Client component with hooks, optimistic updates, error handling

  - file: macro-tracker/lib/hooks/useRealtimeMacros.ts
    lines: 1-123
    why: Real-time data detection to determine if user has logged meals
    pattern: Returns { current, targets, loading } - use to conditionally show quick actions

  - file: macro-tracker/lib/supabase/server.ts
    lines: 1-30
    why: Server-side Supabase client for API route authentication
    pattern: createServerSupabaseClient() with cookies() from next/headers

  - file: macro-tracker/app/page.tsx
    lines: 1-69
    why: Main dashboard with Bot button placeholder (line 29)
    location: Bot button already exists - replace onClick handler

Design System Reference:
  - file: macro-tracker/app/globals.css
    lines: 46-96
    why: Complete color palette and design tokens
    critical: |
      Primary: #0170B9 (--primary)
      Chart colors: #10B981 (green), #F59E0B (amber), #8B5CF6 (purple)
      Border radius: 0.75rem (12px), use rounded-2xl (16px) for message bubbles
      Shadows: shadow-md default, hover:shadow-lg
```

### Current Codebase Structure

```bash
macro-tracker/
├── app/
│   ├── api/                    # NEW: Create /api/ai/chat/route.ts here
│   ├── page.tsx                # MODIFY: Bot button onClick (line 29)
│   └── globals.css             # REFERENCE: Design tokens
├── components/
│   ├── ui/
│   │   ├── dialog.tsx         # REFERENCE: Modal pattern
│   │   ├── button.tsx         # REFERENCE: Button variants
│   │   └── input.tsx          # REFERENCE: Input styling
│   ├── AINutritionCoach.tsx   # NEW: Main chat modal component
│   ├── FoodLog.tsx            # REFERENCE: State management pattern
│   └── MacroGoalsForm.tsx     # REFERENCE: Dialog pattern
├── lib/
│   ├── hooks/
│   │   └── useRealtimeMacros.ts  # USE: Detect if user has data
│   └── supabase/
│       └── server.ts          # USE: Auth in API route
└── types/
    └── chat.ts                # NEW: TypeScript types for chat

api/  # Python backend (ALREADY BUILT - DO NOT MODIFY)
├── agent/
│   └── coach_agent.py         # 3 tools: today_status, weekly_progress, pattern_analysis
├── main.py                    # FastAPI with /api/chat endpoint
└── tests/                     # 67 passing tests
```

### Desired Codebase Structure (Files to Create)

```bash
macro-tracker/
├── app/
│   └── api/
│       └── ai/
│           └── chat/
│               └── route.ts   # CREATE: Next.js API Route (auth + proxy to Python)
├── components/
│   └── AINutritionCoach.tsx   # CREATE: Main chat modal component
├── types/
│   └── chat.ts                # CREATE: TypeScript types
└── lib/
    └── services/
        └── nutritionCoach.ts  # CREATE: API client functions

# File Responsibilities:
# - route.ts: Auth validation, user_id lookup, call Python backend, error handling
# - AINutritionCoach.tsx: Chat UI, message state, quick actions, auto-scroll, sessionStorage
# - chat.ts: TypeScript interfaces for ChatMessage, ChatResponse, QuickAction
# - nutritionCoach.ts: Fetch wrapper for calling Next.js API route
```

### Known Gotchas & Critical Details

```typescript
// CRITICAL: Backend CORS must be configured in api/main.py
// Add AFTER line 22 (before @app.post):
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",              # Next.js dev
        "https://your-domain.vercel.app"      # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

// GOTCHA: Next.js 15 async APIs
// cookies() and headers() are now async in Next.js 15
const cookieStore = await cookies();  // Must await!

// GOTCHA: Supabase auth_id vs user_id
// Supabase auth gives auth_id, we need user_id from users table
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('id')
  .eq('auth_id', user.id)
  .single();
const actualUserId = profile.id;  // This is what Python backend needs

// GOTCHA: Conversation history format
// Python backend expects List[Dict[str, Any]] from Pydantic AI's ModelMessagesTypeAdapter
// Must preserve exact structure from response, don't modify

// GOTCHA: Auto-scroll must use useRef + useEffect
// Scroll on new messages, but ONLY when user is at bottom (don't interrupt reading)
const messagesEndRef = useRef<HTMLDivElement>(null);
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
useEffect(() => {
  scrollToBottom();
}, [messages]);

// GOTCHA: sessionStorage is client-side only
// Must wrap in typeof window !== 'undefined' checks
// Load on mount, save on every message update

// GOTCHA: Responsive modal sizing
// Constrained width on desktop for optimal readability
className="w-full max-w-2xl h-[600px] max-h-[80vh]"

// GOTCHA: Quick actions must adapt to user data
// Use useRealtimeMacros() to check if user has data today
const { current } = useRealtimeMacros();
const hasData = current.calories > 0 || current.protein > 0;
const quickActions = hasData ? dataQuickActions : educationalQuickActions;

// CRITICAL: Message bubble design (from INITIAL.md)
// User messages: right-aligned, bg-primary, text-primary-foreground, rounded-2xl
// AI messages: left-aligned, bg-secondary/80, border, AI avatar (gradient from-chart-2 to-chart-3)
```

## Implementation Blueprint

### TypeScript Types and Data Models

```typescript
// types/chat.ts - CREATE THIS FILE
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    metrics?: Record<string, any>;
    toolUsed?: string;
  };
}

export interface ChatResponse {
  response: string;
  conversation_history: any[];  // Pydantic AI format
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export interface QuickAction {
  label: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}
```

### Task List (Complete in Order)

```yaml
Task 1: Configure Backend CORS
  action: MODIFY api/main.py
  location: After line 22 (after app = FastAPI(...))
  code: |
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://*.vercel.app"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
  why: Frontend cannot call Python backend without CORS configured
  validation: curl -H "Origin: http://localhost:3000" http://localhost:8000/health (should not error)

Task 2: Create TypeScript Types
  action: CREATE macro-tracker/types/chat.ts
  pattern: Follow types/macros.ts structure for consistency
  includes: ChatMessage, ChatResponse, QuickAction interfaces
  why: Type safety for all chat-related data structures
  validation: No TypeScript errors when importing types

Task 3: Create API Client Service
  action: CREATE macro-tracker/lib/services/nutritionCoach.ts
  purpose: Abstraction layer for calling Next.js API route
  exports: sendChatMessage(message: string, history: any[]) -> Promise<ChatResponse>
  pattern: |
    export async function sendChatMessage(
      message: string,
      conversationHistory: any[] = []
    ): Promise<ChatResponse> {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversation_history: conversationHistory }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }
      return response.json();
    }
  why: Separation of concerns - UI doesn't handle fetch directly
  validation: Can import { sendChatMessage } without errors

Task 4: Create Next.js API Route
  action: CREATE macro-tracker/app/api/ai/chat/route.ts
  purpose: Authentication bridge between Next.js and Python backend
  responsibilities:
    - Validate user session with Supabase
    - Lookup user_id from users table
    - Proxy request to Python backend
    - Handle errors and return appropriate status codes
  pattern: REFERENCE api/README.md lines 386-427 for exact implementation
  critical: |
    - Use createServerSupabaseClient() from @/lib/supabase/server
    - Await cookies() since Next.js 15 uses async APIs
    - Extract auth.getUser() -> lookup users table by auth_id
    - Call Python backend at http://127.0.0.1:8000/api/chat (dev) or process.env.PYTHON_API_URL (prod)
    - Return NextResponse.json() with proper error handling
  pseudocode: |
    export async function POST(request: Request) {
      // 1. Get Supabase client
      const supabase = await createServerSupabaseClient();

      // 2. Check authentication
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 3. Get user_id from users table
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      // 4. Parse request body
      const body = await request.json();
      const { message, conversation_history = [] } = body;

      // 5. Validate message
      if (!message || message.trim().length === 0) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }

      // 6. Call Python backend
      const pythonUrl = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8000'
        : process.env.PYTHON_API_URL;

      try {
        const response = await fetch(`${pythonUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile.id,
            message,
            conversation_history
          }),
        });

        if (!response.ok) {
          throw new Error(`Python API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error calling Python backend:', error);
        return NextResponse.json(
          { error: 'Failed to process chat request' },
          { status: 500 }
        );
      }
    }
  validation: |
    curl -X POST http://localhost:3000/api/ai/chat \
      -H "Content-Type: application/json" \
      -d '{"message": "test"}' \
    (Should return 401 if not authenticated)

Task 5: Create Main Chat Component
  action: CREATE macro-tracker/components/AINutritionCoach.tsx
  purpose: Full chat UI with modal, messages, input, quick actions
  state_management: |
    - messages: ChatMessage[] (user + AI messages)
    - input: string (current input value)
    - loading: boolean (waiting for AI response)
    - error: string | null (error state)
    - conversationHistory: any[] (Pydantic AI format)
  pattern: Follow MacroGoalsForm.tsx for Dialog pattern
  structure: |
    export function AINutritionCoach() {
      const [open, setOpen] = useState(false);
      const [messages, setMessages] = useState<ChatMessage[]>([]);
      const [input, setInput] = useState('');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [conversationHistory, setConversationHistory] = useState<any[]>([]);
      const messagesEndRef = useRef<HTMLDivElement>(null);
      const { current } = useRealtimeMacros();

      // Load conversation from sessionStorage on mount
      useEffect(() => {
        if (typeof window !== 'undefined') {
          const saved = sessionStorage.getItem('ai-coach-conversation');
          if (saved) {
            const { messages: savedMessages, history } = JSON.parse(saved);
            setMessages(savedMessages);
            setConversationHistory(history);
          }
        }
      }, []);

      // Save conversation to sessionStorage on change
      useEffect(() => {
        if (typeof window !== 'undefined' && messages.length > 0) {
          sessionStorage.setItem('ai-coach-conversation', JSON.stringify({
            messages,
            history: conversationHistory
          }));
        }
      }, [messages, conversationHistory]);

      // Auto-scroll on new messages
      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      // Determine quick actions based on user data
      const hasData = current.calories > 0 || current.protein > 0;
      const quickActions = hasData ? dataQuickActions : educationalQuickActions;

      const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim()) return;

        // Optimistic UI update
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: textToSend,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);

        try {
          const response = await sendChatMessage(textToSend, conversationHistory);

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.response,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMessage]);
          setConversationHistory(response.conversation_history);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
          setLoading(false);
        }
      };

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>AI Nutrition Coach</DialogTitle>
            </DialogHeader>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.length === 0 && (
                <WelcomeMessage quickActions={quickActions} onQuickAction={handleSend} />
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              {error && <ErrorMessage error={error} onRetry={() => handleSend()} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your nutrition..."
                disabled={loading}
              />
              <Button onClick={() => handleSend()} disabled={loading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  includes_subcomponents: |
    - MessageBubble: Individual message with role-based styling
    - WelcomeMessage: Initial screen with quick actions
    - TypingIndicator: Loading animation (3 bouncing dots)
    - ErrorMessage: Error display with retry button
  validation: Component renders without errors, TypeScript checks pass

Task 6: Implement Message Bubble Component
  action: ADD to AINutritionCoach.tsx
  purpose: Display individual messages with proper styling
  pattern: |
    interface MessageBubbleProps {
      message: ChatMessage;
    }

    function MessageBubble({ message }: MessageBubbleProps) {
      const isUser = message.role === 'user';

      return (
        <div className={cn(
          'flex gap-3',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <div className={cn(
            'max-w-[80%] rounded-2xl px-4 py-3 space-y-1',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/80 border border-border/50'
          )}>
            <p className="text-sm leading-relaxed">{message.content}</p>
            <p className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      );
    }
  design_critical: |
    - User bubbles: right-aligned, primary blue, rounded-2xl (16px)
    - AI bubbles: left-aligned, secondary bg, border, avatar with gradient
    - Timestamps: text-xs, opacity-70, below content
    - Max width: 80% of container
    - Avatar: 32px circle with gradient from-chart-2 (green) to-chart-3 (amber)

Task 7: Implement Quick Actions
  action: ADD to AINutritionCoach.tsx
  purpose: Provide suggested queries users can click
  pattern: |
    const dataQuickActions: QuickAction[] = [
      { label: "Today's Progress", message: "How am I doing today?", icon: TrendingUp },
      { label: "Weekly Trends", message: "How was my week?", icon: BarChart },
      { label: "Patterns", message: "What are my eating patterns?", icon: Brain }
    ];

    const educationalQuickActions: QuickAction[] = [
      { label: "Learn About Macros", message: "Explain macros to me", icon: BookOpen },
      { label: "Tracking Tips", message: "How should I track my food?", icon: Target },
      { label: "Goal Setting", message: "How do I set good macro goals?", icon: Flame }
    ];

    function WelcomeMessage({ quickActions, onQuickAction }: {
      quickActions: QuickAction[];
      onQuickAction: (message: string) => void;
    }) {
      return (
        <div className="space-y-4 text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Hi! I'm your nutrition coach</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Ask me anything about your nutrition progress
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
            {quickActions.map(action => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => onQuickAction(action.message)}
                className="h-auto py-3 flex-col gap-2"
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      );
    }
  why: Improves discoverability and reduces friction for first-time users

Task 8: Implement Loading and Error States
  action: ADD to AINutritionCoach.tsx
  purpose: Visual feedback during API calls and error handling
  pattern: |
    function TypingIndicator() {
      return (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-secondary/80 border border-border/50 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      );
    }

    function ErrorMessage({ error, onRetry }: { error: string; onRetry: () => void }) {
      return (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div className="bg-destructive/10 border border-destructive/50 rounded-2xl px-4 py-3 space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      );
    }
  design: |
    - Loading: Three dots with staggered bounce animation
    - Error: Red-tinted message bubble with retry button
    - Both match message bubble style with appropriate coloring

Task 9: Wire Up Bot Button
  action: MODIFY macro-tracker/app/page.tsx
  location: Line 29 (Bot button onClick)
  find: onClick={() => {/* TODO: Add chat with AI functionality */}}
  replace: |
    onClick={() => setCoachOpen(true)}
  additions: |
    // Add at top of file
    import { AINutritionCoach } from '@/components/AINutritionCoach';

    // Add state
    const [coachOpen, setCoachOpen] = useState(false);

    // Add component after closing </div> tag (after line 66)
    <AINutritionCoach open={coachOpen} onOpenChange={setCoachOpen} />
  why: Connect existing Bot button to new chat modal
  validation: Click Bot button opens modal

Task 10: Add Responsive Modal Styling
  action: MODIFY AINutritionCoach.tsx DialogContent
  purpose: Optimal sizing for different desktop screen sizes
  pattern: |
    <DialogContent className={cn(
      "flex flex-col",
      "w-full max-w-2xl h-[600px] max-h-[80vh]"
    )}>
  critical: |
    - Max width: 2xl (672px) for optimal readability
    - Height: 600px default, max 80vh to fit on smaller screens
    - Ensure messages container has overflow-y-auto
  validation: Test on different screen sizes (1920px, 1366px, 1024px width)

Task 11: Implement Keyboard Shortcuts
  action: ADD to AINutritionCoach.tsx
  purpose: Better UX with keyboard support
  pattern: |
    // Add to input onKeyDown
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }}

    // Add to Dialog
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Escape key closes automatically via Radix UI */}
    </Dialog>
  includes: |
    - Enter: Send message
    - Shift+Enter: New line (future enhancement)
    - Escape: Close modal (built-in)
  validation: Pressing Enter sends message, Escape closes modal

Task 12: Add ARIA Labels for Accessibility
  action: ADD to AINutritionCoach.tsx
  purpose: Screen reader support and accessibility
  pattern: |
    <div
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      className="flex-1 overflow-y-auto space-y-4 p-4"
    >
      {/* messages */}
    </div>

    <Input
      aria-label="Chat message input"
      placeholder="Ask about your nutrition..."
    />

    <Button
      aria-label="Send message"
      disabled={loading}
    >
      <Send className="w-4 h-4" />
    </Button>
  validation: Run accessibility checker (Lighthouse or axe DevTools)
```

## Validation Loop

### Level 1: Type Checking & Linting

```bash
# Run in macro-tracker directory
npm run type-check      # TypeScript compilation
npm run lint           # ESLint checks

# Expected: No errors
# If errors: Read error message, understand issue, fix code, re-run
```

### Level 2: Backend Validation

```bash
# Ensure Python backend is running
cd api
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn api.main:app --reload --port 8000

# Test CORS configuration
curl -H "Origin: http://localhost:3000" http://localhost:8000/health
# Expected: No CORS errors

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","message":"Hello"}'
# Expected: {"response": "...", "conversation_history": [...], "usage": {...}}
```

### Level 3: Integration Testing

```bash
# Start Next.js dev server
cd macro-tracker
npm run dev

# Manual Testing Checklist:
```

**Frontend Manual Testing Checklist:**

- [ ] **Authentication Required**
  - [ ] Not logged in → Bot button hidden or disabled
  - [ ] Logged in → Bot button visible and clickable

- [ ] **Modal Open/Close**
  - [ ] Click Bot button → Modal opens smoothly
  - [ ] Click X button → Modal closes
  - [ ] Press Escape key → Modal closes
  - [ ] Click outside modal → Modal closes

- [ ] **Quick Actions - New User (No Data)**
  - [ ] Shows educational quick actions: "Learn About Macros", "Tracking Tips", "Goal Setting"
  - [ ] Click quick action → Sends message automatically

- [ ] **Quick Actions - Active User (Has Data)**
  - [ ] User has logged food today
  - [ ] Shows data-driven quick actions: "Today's Progress", "Weekly Trends", "Patterns"
  - [ ] Click quick action → Sends message and gets relevant data

- [ ] **Message Sending**
  - [ ] Type message → Press Enter → Message appears immediately (optimistic)
  - [ ] Typing indicator shows (3 bouncing dots with AI avatar)
  - [ ] AI response appears within 2 seconds
  - [ ] User messages: right-aligned, blue background, rounded corners
  - [ ] AI messages: left-aligned, gray background, AI avatar, border

- [ ] **Conversation Memory**
  - [ ] Send "How am I doing today?"
  - [ ] Send "What about yesterday?" (follow-up)
  - [ ] AI should remember context (mention "today" or show understanding)

- [ ] **Auto-Scroll**
  - [ ] New messages appear → View automatically scrolls to bottom
  - [ ] Scroll behavior is smooth (not jarring)

- [ ] **Error Handling**
  - [ ] Stop Python backend → Send message → Error bubble appears
  - [ ] Error message has "Retry" button
  - [ ] Click Retry → Re-sends last message

- [ ] **Loading States**
  - [ ] While waiting for AI → Send button disabled
  - [ ] Input field disabled during loading
  - [ ] Typing indicator shows

- [ ] **Session Persistence**
  - [ ] Send several messages
  - [ ] Refresh page (F5)
  - [ ] Reopen modal → Previous conversation still there

- [ ] **Responsive Design**
  - [ ] Test on large screens (1920px width)
  - [ ] Test on medium screens (1366px width)
  - [ ] Test on smaller screens (1024px width)
  - [ ] Modal stays readable and usable at all sizes
  - [ ] Max-width constraint (672px) maintains readability

- [ ] **Timestamps**
  - [ ] Each message shows time (e.g., "2:35 PM")
  - [ ] Format is clean and unobtrusive

- [ ] **No Console Errors**
  - [ ] Open DevTools Console
  - [ ] Perform all actions above
  - [ ] No errors or warnings in console

### Level 4: Browser Testing

```bash
# Test in multiple desktop browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)

# Focus areas:
- Modal animations smooth
- Fetch API works correctly
- sessionStorage persists
- Responsive sizing on different screen widths
```

## Final Validation Checklist

- [ ] All TypeScript types are correct (npm run type-check passes)
- [ ] No linting errors (npm run lint passes)
- [ ] Python backend has CORS configured
- [ ] Next.js API route authenticates correctly (401 when not logged in)
- [ ] Chat modal opens from Bot button
- [ ] Quick actions adapt based on user data
- [ ] Messages send and receive within 2 seconds
- [ ] Conversation memory works (follow-up questions have context)
- [ ] Error states display with retry functionality
- [ ] Auto-scroll works smoothly
- [ ] Design matches existing components (colors, spacing, animations)
- [ ] Responsive design works on different desktop screen sizes
- [ ] Conversation persists on refresh (sessionStorage)
- [ ] Keyboard shortcuts work (Enter, Escape)
- [ ] Accessibility: ARIA labels, focus management
- [ ] All manual testing checklist items pass
- [ ] No console errors or warnings

---

## Anti-Patterns to Avoid

- ❌ Don't create new design patterns - Use existing button/dialog components
- ❌ Don't modify conversation_history format - Preserve exact structure from Python backend
- ❌ Don't skip error handling - Every fetch needs try/catch
- ❌ Don't hardcode API URLs - Use environment detection (dev vs prod)
- ❌ Don't skip responsive design - Test on different screen sizes
- ❌ Don't skip sessionStorage persistence - User expects conversation to persist
- ❌ Don't use sync operations for auth - Next.js 15 cookies() is async
- ❌ Don't forget user_id lookup - auth.getUser() gives auth_id, need users.id
- ❌ Don't skip CORS configuration - Frontend cannot call backend without it
- ❌ Don't create complex state management - Keep it simple with useState

---

## Performance Considerations

- **Response time target**: <2s for 95% of requests
- **Token optimization**: Backend already optimized, frontend just passes through
- **Message limit**: Consider truncating UI to last 20 messages (backend handles full history)
- **Auto-scroll**: Use `behavior: 'smooth'` to avoid jarring jumps
- **Optimistic updates**: Add user message immediately, don't wait for backend

---

## Security Considerations

- **Authentication**: MUST validate user session in API route
- **User isolation**: API route ensures user_id belongs to authenticated user
- **Input validation**: Max message length 1000 chars (enforced by backend)
- **Rate limiting**: Consider implementing in Next.js API route (50 req/hour per user)
- **XSS prevention**: React handles escaping, but don't use dangerouslySetInnerHTML
- **CORS**: Restrict origins to known domains (localhost + production)

---

## Additional Resources

- [Next.js API Routes (2025)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase SSR Authentication](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Framer Motion Modal Animations](https://www.framer.com/motion/animate-presence/)
- [Radix UI Dialog Accessibility](https://www.radix-ui.com/primitives/docs/components/dialog)
- [React Chat UI Best Practices 2025](https://www.contus.com/blog/chat-ui-implemtation/)

---

## PRP Confidence Score: 9.5/10

**Rationale:**
- ✅ Backend is 100% complete and tested (67 passing tests)
- ✅ Frontend patterns exist and are well-documented
- ✅ Design system is comprehensive and consistent
- ✅ Complete API contract with examples
- ✅ All critical gotchas documented
- ✅ Step-by-step task breakdown with pseudocode
- ✅ Comprehensive validation gates
- ✅ Web-only scope simplifies testing requirements
- ⚠️ Minor risk: CORS configuration requires Python backend modification

This PRP provides sufficient context for one-pass implementation with high confidence of success.
