## FEATURE:

- **AI Nutrition Coach Chat Interface** - Frontend integration of existing Pydantic AI agent into Next.js macro tracker web app
- **Modal-based chat UI** with conversation memory, context-aware quick actions, and seamless design system integration
- **Dual-mode operation**: Data-driven insights (when user has logged meals) + Educational conversations (when user is new)
- **Next.js API Route middleware** for authentication, user_id lookup, and Python backend communication
- **Production-ready deployment** with CORS, error handling, and mobile-optimized UX

## EXAMPLES:

In the `examples/` folder and existing codebase:

### Backend (Already Built - Reference Only):
- `api/agent/coach_agent.py` - Production-ready Pydantic AI nutrition coach with 3 tools
- `api/agent/tools.py` - Tools for fetching today's status, weekly progress, pattern analysis
- `api/main.py` - FastAPI server with `/api/chat` endpoint (lines 42-103)
- `api/tests/` - 67 passing tests validating agent functionality
- `api/README.md` - Comprehensive backend documentation

### Frontend (Existing Patterns to Follow):
- `macro-tracker/components/ui/dialog.tsx` - Modal pattern (use this for chat container)
- `macro-tracker/components/ui/button.tsx` - Button variants and sizing (use for Send, Quick Actions)
- `macro-tracker/components/ui/input.tsx` - Input styling (use for message input)
- `macro-tracker/components/FoodLog.tsx` - Complex interactive component with real-time updates (reference for state management)
- `macro-tracker/components/MacroGoalsForm.tsx` - Dialog-based form with loading states (reference for modal UX)
- `macro-tracker/components/graphs/DailyMacroGauges.tsx` - Data-driven UI with empty states (reference for conditional rendering)
- `macro-tracker/app/page.tsx` - Main dashboard with Bot button placeholder (line 29)
- `macro-tracker/lib/supabase/server.ts` - Server-side Supabase client (use for auth in API route)
- `macro-tracker/lib/hooks/useRealtimeMacros.ts` - Real-time data hook (use to detect if user has data)

### Design System (Follow These Patterns):
- `macro-tracker/app/globals.css` - Color palette, gradients, spacing system
  - Primary: `#0170B9` (blue)
  - Chart colors: Green (#10B981), Amber (#F59E0B), Purple (#8B5CF6)
  - Border radius: `0.75rem` (12px) - more rounded than typical
  - Shadows: `shadow-md` default, `hover:shadow-lg`
- **Gradient backgrounds**: `from-primary/5 via-transparent to-chart-2/5` (used everywhere)
- **Message bubbles**: User (right, primary blue), AI (left, secondary gray)
- **Animations**: Framer Motion for entry, CSS transitions for interactions

Don't copy these examples directly - they serve different purposes. Use them as inspiration for component structure, state management, and visual consistency.

## DOCUMENTATION:

### Core Documentation (MUST READ):
- **Next.js App Router**: https://nextjs.org/docs/app
  - Why: API Routes, server components, client components
- **Supabase Auth (SSR)**: https://supabase.com/docs/guides/auth/server-side/nextjs
  - Why: User authentication and session management
- **React Hooks**: https://react.dev/reference/react
  - Why: useState, useEffect, useRef for chat state
- **Framer Motion**: https://www.framer.com/motion/
  - Why: Animations matching existing design (Hero.tsx uses this)
- **Lucide React Icons**: https://lucide.dev/
  - Why: Icon library used throughout app (Bot, Send, etc.)

### Backend Integration (Reference):
- **Python Backend API**: `api/README.md` - Lines 135-173 (API contract)
- **FRONTEND_INTEGRATION_GUIDE.md**: Lines 1-319 (Step-by-step integration guide)
- **FastAPI Endpoint**: `api/main.py` lines 42-103
  - Request: `{ user_id, message, conversation_history }`
  - Response: `{ response, conversation_history, usage }`

### Design System Reference:
- **Tailwind CSS v4**: https://tailwindcss.com/docs
  - Why: Utility classes, custom theme configuration
- **Radix UI Primitives**: https://www.radix-ui.com/primitives
  - Why: Dialog, accessible components (already used in app)
- **Class Variance Authority**: https://cva.style/docs
  - Why: Component variants (see button.tsx)

## OTHER CONSIDERATIONS:

### Critical Requirements:
- **Authentication is REQUIRED** - User must be logged in to access chat (Bot button only visible to authenticated users)
- **No data = Still functional** - Agent works conversationally even if user has no meals logged yet
- **Mobile-first** - 50%+ users will be mobile, modal must be full-screen on mobile
- **Real-time data detection** - Use `useRealtimeMacros()` to determine if user has data → show appropriate quick actions
- **Conversation memory** - Store in component state (sessionStorage for persistence across refreshes in MVP)
- **CORS required** - Python backend must allow Next.js origin (localhost:3000 dev, production domain)

### Design System Gotchas:
- ✅ **Use rounded-2xl (16px)** for message bubbles, not rounded-xl (12px)
- ✅ **User messages**: `bg-primary text-primary-foreground` (right-aligned)
- ✅ **AI messages**: `bg-secondary/80 border border-border/50` (left-aligned with avatar)
- ✅ **Gradient avatars**: `from-chart-2 to-chart-3` for AI (green→amber)
- ✅ **Loading states**: Three bouncing dots with staggered animation (see MacroGoalsForm.tsx:307 for spinner pattern)
- ✅ **Timestamps**: `text-xs opacity-70` below message content
- ✅ **Auto-scroll**: Use `useRef` + `scrollIntoView` on new messages
- ✅ **Max width**: Modal `max-w-2xl` on desktop, `max-w-[calc(100%-2rem)]` on mobile

### TypeScript Patterns:
```typescript
// Message type
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    metrics?: Record<string, any>;
    toolUsed?: string;
  };
}

// API response type
interface ChatResponse {
  response: string;
  conversation_history: any[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}
```

### State Management Best Practices:
- ✅ **Local state** with useState for messages, input, loading
- ✅ **sessionStorage** for conversation persistence (MVP)
- ✅ **Don't over-engineer** - No Redux, no Context API needed for MVP
- ✅ **Optimistic UI** - Add user message immediately, then call API
- ✅ **Error recovery** - Show error bubble with retry button inline

### Performance Gotchas:
- ⚠️ **Auto-scroll on every message** - Can cause layout thrash, use `smooth` behavior
- ⚠️ **Long conversations** - Consider truncating UI to last 10 messages (backend handles full history)
- ⚠️ **Framer Motion animations** - Use sparingly (only on modal open/close, not every message)
- ⚠️ **API calls** - Debounce/throttle if implementing typing indicators (future feature)

### CORS Configuration (CRITICAL):
```python
# Add to api/main.py (after line 22)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "https://your-domain.vercel.app"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error Handling Scenarios:
1. **Network failure** → Show error bubble with retry button
2. **Session expired** → Redirect to login (should be rare, handled by Next.js middleware)
3. **Python backend down** → Show "Service unavailable, try again later"
4. **User_id lookup fails** → Show "Profile error, please refresh"
5. **Rate limit hit** → Show "Too many requests, please wait"
6. **Agent timeout (5s)** → Show "Request timeout, please try again"

### Accessibility Requirements:
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Enter to send, Escape to close modal)
- ✅ Focus management (auto-focus input on open, return focus on close)
- ✅ Screen reader support (role="log" on message container, live regions)
- ✅ Color contrast (all text meets WCAG AA)

### Testing Considerations:
- 🧪 **Manual testing checklist**:
  - [ ] New user with no data → sees educational quick actions
  - [ ] User with data → sees data-driven quick actions
  - [ ] Send message → receives response
  - [ ] Conversation memory works (follow-up questions have context)
  - [ ] Error states display correctly
  - [ ] Mobile responsive (test on real device)
  - [ ] Loading states show during API calls
  - [ ] Auto-scroll works smoothly
  - [ ] Timestamps format correctly
  - [ ] Modal opens/closes smoothly

### Deployment Notes:
- **Environment Variables** (Next.js):
  - `NEXT_PUBLIC_SUPABASE_URL` - Already configured
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Already configured
  - No new env vars needed for frontend
- **Python Backend**:
  - Must be running on localhost:8000 for dev
  - Production: Deploy to Vercel Serverless or separate service
  - Update CORS origins for production domain

### Anti-Patterns to Avoid:
- ❌ **Don't create new design patterns** - Use existing components/styles
- ❌ **Don't use emojis** unless user explicitly requested (per CLAUDE.md)
- ❌ **Don't create markdown files** unless explicitly required
- ❌ **Don't use complex state management** - Keep it simple with useState
- ❌ **Don't hardcode API URLs** - Use env vars or detect environment
- ❌ **Don't skip error handling** - Every API call needs try/catch
- ❌ **Don't ignore mobile UX** - Test on small screens early

### Success Metrics:
- ✅ User can click Bot button → modal opens
- ✅ User can send message → receives AI response within 2s
- ✅ Conversation history persists during session
- ✅ Quick actions adapt to user's data state
- ✅ Error states handle gracefully with retry
- ✅ Design matches existing app perfectly
- ✅ Mobile experience is smooth and usable
- ✅ No console errors or warnings
