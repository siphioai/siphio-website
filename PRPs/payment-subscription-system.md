# Payment & Subscription System - Freemium to Premium Conversion Funnel PRP

name: "Payment & Subscription System Implementation with Stripe Integration"
version: "1.0"
created: "2025-11-11"
confidence_score: "9/10 - Comprehensive context with production patterns"

---

## Goal

Implement a complete freemium-to-paid conversion funnel for the Siphio macro tracker application with Stripe integration, two-stage email verification (15 messages unverified → 50 messages verified), AI usage tracking with strict cost controls, subscription management, and seamless upgrade flows.

## Why

### Business Value
- **Revenue Generation**: Convert 2.5% of free users to $12/month premium (target: $300 MRR from 1,000 visitors)
- **Cost Control**: Keep free tier under $0.15/user/month while providing value
- **User Engagement**: Two-stage verification increases commitment and reduces churn
- **Scalability**: Automated billing, subscription management, and usage monitoring

### User Impact
- **Free Forever Tier**: 15 unverified + 35 verified messages = 50 total free AI messages per month
- **Premium Unlimited**: Unlimited AI coaching, custom goals, advanced analytics, data export
- **Friction-Free Trial**: 7-day premium trial, no card required upfront
- **Transparent Pricing**: Clear value proposition at each stage ($12/mo or $99/yr)

### Integration with Existing Features
- **AI Nutrition Coach**: Currently has no usage limits or cost controls (risk of runaway costs)
- **Authentication**: Supabase auth already handles email verification flow
- **Database**: Migration 010 already created subscription schema
- **User Settings**: Existing settings page needs subscription management section

### Problems This Solves
1. **Runaway AI Costs**: Free tier without limits could bankrupt the app
2. **Low Conversion**: No monetization path for engaged users
3. **Email Verification**: Users don't verify emails (need incentive)
4. **Churn Risk**: Trial users cancel without seeing value (need engagement tracking)

---

## What

### User-Visible Behavior

#### **Stage 1: Sign Up (Immediate Access)**
```
User lands → Signs up → Immediately logged in → Dashboard
- Gets: 15 free AI messages (no email verification required)
- Cost: ~$0.03/user
- No email verification modal on signup (different from current behavior)
```

#### **Stage 2: First 15 Messages (Engagement)**
```
User engages with AI coach → Uses 15 messages over 3-7 days
After 15th message → Full-screen modal: "Verify email to unlock 35 more!"
```

#### **Stage 3: Email Verification (Reward Unlock)**
```
User clicks "Verify Email" → Email sent → User clicks link
Success page: "🎉 You unlocked 35 more messages! (50 total)"
Dashboard shows: "Messages: 16/50" (limit increased from 15 to 50)
```

#### **Stage 4: Using Messages 16-50 (Progressive Urgency)**
```
Progressive urgency banners:
- At 40/50: Yellow banner "10 messages left - Upgrade for unlimited"
- At 45/50: Orange banner "5 messages left!"
- At 49/50: Red pulsing banner "Last message!"
```

#### **Stage 5: Hit 50 Message Limit (Paywall)**
```
Full-screen modal showing:
- User stats (streak, meals logged, AI conversations)
- "Upgrade to Premium for unlimited AI"
- $12/mo or $99/yr pricing
- "Start 7-Day Free Trial" CTA (no card required)
```

#### **Stage 6: 7-Day Premium Trial**
```
Day 1-3: Green banner "⚡ Premium Trial Active! X days left"
Day 4-5: Yellow banner "⏰ Add payment to continue Premium" (modal opens)
Day 6-7: Orange banner "🔥 Last day! Add payment now"

Trial includes: Unlimited AI, all premium features
```

#### **Stage 7: Add Payment Method**
```
User clicks "Add Payment" → Modal shows stats + FOMO
Select: Monthly ($12) or Annual ($99, save $45)
Click "Continue" → Stripe Checkout → Enter card → Subscribe
Success: Redirect to /payment/success with confetti celebration
```

#### **Stage 8: Premium User**
```
Dashboard shows:
- "👑 Premium Member" badge
- "Unlimited AI messages" counter
- Access to all premium features
Settings includes:
- Subscription management
- Payment method update
- Usage statistics
- Cancel subscription option (Customer Portal)
```

### Technical Requirements

1. **AI Message Rate Limiting**
   - Free users: 15 unverified, 50 verified (hard cap)
   - Premium/Trial: Unlimited (soft cap at 1,000/month monitoring)
   - Message length limits: 500 chars free, 2000 chars premium
   - Context window limits: 4 messages free, 10 premium
   - Rate limiting: 10/hour free, 30/hour premium

2. **Email Verification Flow**
   - No verification required at signup (changed from current behavior)
   - Verification prompt triggers at 15/15 messages
   - Verification unlocks 35 additional messages (total 50)
   - Database update: `email_verified_at` + `ai_messages_limit = 50`

3. **Stripe Integration**
   - Create checkout sessions for monthly/annual subscriptions
   - Handle 5 webhook events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
   - Customer Portal for self-service subscription management
   - Trial period setup (7 days, no card required)

4. **Database Operations**
   - Track AI usage in `ai_usage_log` table with cost calculation
   - Update `users` table fields: account_tier, ai_messages_used, stripe_customer_id, trial dates
   - Sync `subscriptions` table with Stripe data
   - Enforce 7-day cooldown for deleted accounts

5. **Cost Monitoring**
   - Log every AI message with token count and estimated cost
   - Calculate cost: (input_tokens * 0.80 + output_tokens * 4.00) / 1,000,000
   - Alert at 500 messages/month, review at 1,000/month
   - Free tier budget: MAX $0.15/user/month

### Success Criteria

- [x] Free users have 15 unverified + 50 verified message limits enforced
- [x] Email verification flow rewards users with 35 additional messages
- [x] Paywall modal appears at 50/50 messages for free users
- [x] 7-day premium trial activates without requiring payment method
- [x] Stripe checkout creates subscriptions and updates database
- [x] Webhooks correctly handle subscription lifecycle events
- [x] Customer Portal allows users to manage subscriptions
- [x] AI message usage logged with cost tracking under $0.15/user/month
- [x] Rate limiting prevents abuse (10/hour free, 30/hour premium)
- [x] All UI components show correct subscription status and limits

---

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Stripe Integration (CRITICAL)
- url: https://docs.stripe.com/payments/checkout/free-trials
  why: "Trial period setup without upfront payment method"

- url: https://docs.stripe.com/customer-management
  why: "Customer Portal integration for self-service subscription management"

- url: https://docs.stripe.com/billing/subscriptions/build-subscriptions
  why: "Complete subscription lifecycle handling"

- url: https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/
  why: "Next.js 15 + Stripe best practices (2025), webhook verification patterns"

- url: https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e
  why: "Latest Next.js 15 webhook implementation with req.text() and constructEvent"

# Stripe MCP Server (TIME SAVER)
- url: https://docs.stripe.com/mcp
  why: "Use MCP to accelerate Phase 5 - saves 8-10 hours on Stripe integration"
  command: "claude mcp add --transport http stripe https://mcp.stripe.com/"

# Rate Limiting
- url: https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj
  why: "Upstash/Redis rate limiting for Next.js API routes"

- url: https://medium.com/@abrar.adam.09/implementing-rate-limiting-in-next-js-api-routes-without-external-packages-7195ca4ef768
  why: "Memory-based rate limiting without external packages (good for MVP)"

# Existing Codebase Files
- file: macro-tracker/supabase/migrations/010_add_subscription_system.sql
  why: "Database schema already created - users extended with subscription fields, subscriptions table, ai_usage_log table, helper functions"

- file: macro-tracker/app/api/ai/chat/route.ts
  why: "Current AI chat implementation - needs usage tracking, rate limiting, and cost controls"

- file: macro-tracker/lib/supabase/server.ts
  why: "Server-side Supabase client pattern for API routes"

- file: macro-tracker/components/AINutritionCoach.tsx
  why: "AI coach UI component - needs message counter, usage display, and upgrade prompts"

- file: macro-tracker/components/auth/SignupForm.tsx
  why: "Current signup flow - needs to remove immediate email verification requirement"

- file: macro-tracker/lib/hooks/useUserSettings.ts
  why: "Pattern for creating custom hooks to fetch and update user data"

- file: api/main.py
  why: "Python backend with JWT authentication pattern, CoachAgentDependencies structure"
```

### Current Codebase Structure

```
macro-tracker/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── chat/
│   │           └── route.ts              # ⚠️ MODIFY: Add usage tracking, rate limiting
│   │   ├── stripe/                       # ✨ CREATE: New Stripe API routes
│   │   │   ├── create-checkout-session/
│   │   │   │   └── route.ts              # ✨ CREATE
│   │   │   ├── webhook/
│   │   │   │   └── route.ts              # ✨ CREATE
│   │   │   └── customer-portal/
│   │   │       └── route.ts              # ✨ CREATE
│   │   ├── subscription/                 # ✨ CREATE: Subscription status API
│   │   │   └── status/
│   │   │       └── route.ts              # ✨ CREATE
│   │   └── ai/
│   │       └── usage/
│   │           └── route.ts              # ✨ CREATE: AI usage stats
│   ├── verify-email/
│   │   └── page.tsx                      # ⚠️ MODIFY: "Unlock 35 more messages"
│   ├── verified/
│   │   └── page.tsx                      # ⚠️ MODIFY: "50 total messages!"
│   ├── start-trial/
│   │   └── page.tsx                      # ✨ CREATE: Trial activation
│   ├── payment/
│   │   ├── success/
│   │   │   └── page.tsx                  # ✨ CREATE: Payment success
│   │   └── cancelled/
│   │       └── page.tsx                  # ✨ CREATE: Payment cancelled
│   └── settings/
│       └── page.tsx                      # ⚠️ MODIFY: Add SubscriptionSection
├── components/
│   ├── AINutritionCoach.tsx              # ⚠️ MODIFY: Add message counter
│   ├── auth/
│   │   └── SignupForm.tsx                # ⚠️ MODIFY: Remove immediate verification
│   ├── settings/
│   │   └── SubscriptionSection.tsx       # ✨ CREATE: Subscription management
│   ├── subscription/                     # ✨ CREATE: New subscription components
│   │   ├── AIMessageCounter.tsx          # ✨ CREATE
│   │   ├── UpgradeTeaser.tsx             # ✨ CREATE
│   │   ├── TrialBanner.tsx               # ✨ CREATE
│   │   ├── PremiumBadge.tsx              # ✨ CREATE
│   │   ├── VerifyEmailPrompt.tsx         # ✨ CREATE
│   │   ├── PaywallModal.tsx              # ✨ CREATE
│   │   ├── AddPaymentModal.tsx           # ✨ CREATE
│   │   └── CancelSubscriptionModal.tsx   # ✨ CREATE
│   └── landing/
│       ├── Pricing.tsx                   # ⚠️ MODIFY: Update pricing display
│       └── PricingComparison.tsx         # ✨ CREATE: Free vs Premium table
├── lib/
│   ├── hooks/
│   │   ├── useSubscription.ts            # ✨ CREATE: Subscription hook
│   │   ├── useAIUsage.ts                 # ✨ CREATE: AI usage hook
│   │   └── useTrialStatus.ts             # ✨ CREATE: Trial status hook
│   └── stripe/
│       └── client.ts                     # ✨ CREATE: Stripe client utilities
├── types/
│   ├── subscription.ts                   # ✨ CREATE: Subscription types
│   └── database.ts                       # ⚠️ MODIFY: Add subscription types
└── supabase/
    └── migrations/
        └── 010_add_subscription_system.sql  # ✅ ALREADY EXISTS

api/ (Python Backend)
├── main.py                               # ⚠️ MODIFY: Already has usage logging
└── dependencies/
    └── auth.py                           # ✅ ALREADY EXISTS: JWT validation
```

### Database Schema (Already Created in Migration 010)

```sql
-- EXISTING: users table extended with subscription fields
ALTER TABLE users ADD COLUMN:
- email_verified_at TIMESTAMPTZ           -- NULL until verified
- account_tier TEXT                        -- 'free', 'trial', 'premium'
- ai_messages_used INTEGER DEFAULT 0       -- Resets monthly
- ai_messages_limit INTEGER DEFAULT 15     -- 15 unverified, 50 verified, -1 premium
- stripe_customer_id TEXT UNIQUE
- trial_started_at TIMESTAMPTZ
- trial_ends_at TIMESTAMPTZ
- subscription_status TEXT                 -- 'active', 'canceled', 'past_due', etc.
- subscription_current_period_end TIMESTAMPTZ

-- EXISTING: subscriptions table (mirrors Stripe data)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXISTING: ai_usage_log table (cost monitoring)
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message_count INTEGER DEFAULT 1,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  model_name TEXT DEFAULT 'claude-3-5-haiku-20241022',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXISTING: Helper Functions
- can_user_send_ai_message(user_id) → (can_send, reason, messages_remaining)
- increment_ai_message_usage(user_id, input_tokens, output_tokens, model_name)
- get_user_ai_usage_stats(user_id) → (total_messages, total_cost, monthly_messages, monthly_cost)
- is_email_in_cooldown(email) → BOOLEAN
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Next.js 15 Webhook Verification Pattern
// MUST use req.text() to get raw body for Stripe signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();  // ⚠️ NOT req.json() - breaks signature
  const signature = req.headers.get('stripe-signature');

  const event = stripe.webhooks.constructEvent(
    body,           // Raw string body
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  // ... handle event
}

// CRITICAL: Stripe Checkout Trial Setup
// Use subscription_data.trial_period_days for trials
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: {
    trial_period_days: 7,  // ⚠️ Must be under subscription_data
  },
  payment_method_collection: 'if_required',  // No card for trial
  customer: customerId,
  success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/payment/cancelled`,
});

// CRITICAL: Rate Limiting Implementation
// Must initialize rate limiter OUTSIDE handler or limits won't work
// Each request would create fresh limiter = no memory of previous requests
import { RateLimiter } from '@/lib/rate-limiter';

// ✅ CORRECT: Initialize outside
const limiter = new RateLimiter({ window: 3600, max: 10 });

export async function POST(req: NextRequest) {
  const ip = req.ip || 'unknown';
  if (!limiter.check(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // ... handle request
}

// CRITICAL: Supabase Service Role for Backend
// API routes need service_role key to bypass RLS when updating subscription data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ Not anon key
);

// CRITICAL: Message Length Limits
// Claude 3.5 Haiku cost grows with tokens - enforce character limits
const MESSAGE_LIMITS = {
  free: 500,      // ~400 tokens
  premium: 2000   // ~1600 tokens
};

// Validate before sending to AI
if (message.length > limit) {
  return NextResponse.json({
    error: 'Message too long',
    message: `Maximum ${limit} characters for your plan`
  }, { status: 400 });
}

// CRITICAL: Context Window Limits for Cost Control
// Limit conversation history to prevent runaway token costs
const CONTEXT_LIMITS = {
  free: {
    max_history_messages: 4,     // Only last 2 exchanges
    max_context_tokens: 2000,
    max_output_tokens: 300
  },
  premium: {
    max_history_messages: 10,    // Last 5 exchanges
    max_context_tokens: 8000,
    max_output_tokens: 500
  }
};

// Trim conversation history before sending
const trimmedHistory = conversationHistory.slice(-CONTEXT_LIMITS[tier].max_history_messages);
```

---

## Implementation Blueprint

### Phase 1: Cost Control & AI Limits (CRITICAL - Do First)

**Why First?** Without cost controls, free tier could drain budget in days.

#### Task 1.1: Create AI Usage Hook
```typescript
// lib/hooks/useAIUsage.ts
// PATTERN: Mirror useUserSettings.ts structure
export function useAIUsage() {
  const [usage, setUsage] = useState({
    messagesUsed: 0,
    messagesLimit: 15,  // Default unverified
    canSend: true,
    accountTier: 'free',
    emailVerified: false
  });

  // Fetch from /api/ai/usage endpoint
  // Returns: messages_used, messages_limit, can_send, reason, messages_remaining
}
```

#### Task 1.2: Create AI Usage API Route
```typescript
// app/api/ai/usage/route.ts
// GET endpoint to fetch user AI usage stats
// 1. Authenticate user (createServerSupabaseClient)
// 2. Call Supabase function: can_user_send_ai_message(user_id)
// 3. Return usage stats: { messagesUsed, messagesLimit, canSend, reason, messagesRemaining }
```

#### Task 1.3: Create Rate Limiter Utility
```typescript
// lib/rate-limiter.ts
// Simple in-memory rate limiter (no Redis needed for MVP)
// GOTCHA: Initialize OUTSIDE handler or it won't work
export class RateLimiter {
  private requests = new Map<string, { count: number; resetAt: number }>();

  constructor(private config: { window: number; max: number }) {}

  check(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetAt) {
      this.requests.set(identifier, { count: 1, resetAt: now + this.config.window * 1000 });
      return true;
    }

    if (record.count >= this.config.max) {
      return false;  // Rate limit exceeded
    }

    record.count++;
    return true;
  }
}
```

#### Task 1.4: Update AI Chat Route with Limits
```typescript
// app/api/ai/chat/route.ts
// MODIFY existing route to add:
// 1. Rate limiting (10/hour free, 30/hour premium)
// 2. Message length validation (500 chars free, 2000 premium)
// 3. Check can_user_send_ai_message() before processing
// 4. Track usage with increment_ai_message_usage() after response
// 5. Trim conversation history (4 messages free, 10 premium)
```

#### Pseudocode for Task 1.4:
```typescript
// Initialize rate limiters OUTSIDE handler
const freeLimiter = new RateLimiter({ window: 3600, max: 10 });
const premiumLimiter = new RateLimiter({ window: 3600, max: 30 });

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // 2. Get user data (account_tier, ai_messages_used, ai_messages_limit)
  const { data: userData } = await supabase
    .from('users')
    .select('id, account_tier, ai_messages_used, ai_messages_limit, email_verified_at')
    .eq('auth_id', user.id)
    .single();

  // 3. Check email verification
  if (!userData.email_verified_at) {
    return NextResponse.json({
      error: 'Email not verified',
      message: 'Please verify your email to use the AI coach'
    }, { status: 403 });
  }

  // 4. Check rate limit
  const limiter = userData.account_tier === 'premium' ? premiumLimiter : freeLimiter;
  if (!limiter.check(userData.id)) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      message: 'Please wait before sending more messages'
    }, { status: 429 });
  }

  // 5. Check message limit (free tier only)
  if (userData.account_tier === 'free') {
    if (userData.ai_messages_used >= userData.ai_messages_limit) {
      return NextResponse.json({
        error: 'Message limit reached',
        message: 'Upgrade to Premium for unlimited messages',
        upgradeRequired: true
      }, { status: 403 });
    }
  }

  // 6. Validate message length
  const body = await request.json();
  const maxLength = userData.account_tier === 'premium' ? 2000 : 500;
  if (body.message.length > maxLength) {
    return NextResponse.json({
      error: 'Message too long',
      message: `Maximum ${maxLength} characters for your plan`
    }, { status: 400 });
  }

  // 7. Trim conversation history
  const maxHistory = userData.account_tier === 'premium' ? 10 : 4;
  const trimmedHistory = (body.conversation_history || []).slice(-maxHistory);

  // 8. Call Python backend (existing logic)
  const pythonResponse = await fetch(`${pythonUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message: body.message.trim(),
      conversation_history: trimmedHistory,
    }),
  });

  const data = await pythonResponse.json();

  // 9. Track usage (increment message count + log tokens/cost)
  await supabase.rpc('increment_ai_message_usage', {
    p_user_id: userData.id,
    p_input_tokens: data.usage.input_tokens,
    p_output_tokens: data.usage.output_tokens,
    p_model_name: 'claude-3-5-haiku-20241022'
  });

  return NextResponse.json(data);
}
```

**Validation Gate:**
```bash
# Test rate limiting
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "test"}' \
  # Send 11 requests rapidly - 11th should return 429

# Test message limit
# Set user ai_messages_used = 50 in DB
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "test"}' \
  # Should return 403 with upgradeRequired: true

# Test message length
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "'"$(python -c "print('x' * 501)")"'"}' \
  # Should return 400 "Message too long"
```

---

### Phase 2: Email Verification Flow Updates

**Why Now?** Need to reward email verification before building paywall.

#### Task 2.1: Update Signup Form (Remove Immediate Verification)
```typescript
// components/auth/SignupForm.tsx
// MODIFY: Remove email verification requirement
// Current: Throws error if no session (requires email verification)
// New: Allow immediate login, set ai_messages_limit = 15
// PATTERN: Use existing supabase.auth.signUp() call
// CHANGE: Remove session check, allow unverified users to proceed
```

#### Task 2.2: Create Verify Email Prompt Modal
```typescript
// components/subscription/VerifyEmailPrompt.tsx
// CREATE: Full-screen modal triggered at 15/15 messages
// PATTERN: Mirror Dialog structure from components/ui/dialog.tsx
// Show:
// - "You've used all 15 free messages!"
// - "Verify your email to unlock 35 more (50 total)"
// - Big CTA button "Verify Email Now"
// - Small text "Takes 30 seconds"
```

#### Task 2.3: Update Verify Email Page
```typescript
// app/verify-email/page.tsx
// MODIFY: Change messaging to emphasize 35 additional messages
// Current: Generic "verify your email" message
// New: "Check your email to unlock 35 more AI messages!"
```

#### Task 2.4: Update Verified Page
```typescript
// app/verified/page.tsx
// MODIFY: Celebration page with updated messaging
// Show: "🎉 Email Verified! You now have 50 total AI messages per month"
// Add confetti animation (canvas-confetti already installed)
// Update database: ai_messages_limit = 50, email_verified_at = NOW()
```

#### Pseudocode for Task 2.4:
```typescript
// app/verified/page.tsx
'use client';

export default function VerifiedPage() {
  useEffect(() => {
    async function updateUserLimit() {
      // 1. Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Update user limit to 50
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      await supabase
        .from('users')
        .update({ ai_messages_limit: 50 })
        .eq('id', userData.id);

      // 3. Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    updateUserLimit();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1>🎉 Email Verified!</h1>
      <p>You now have 50 total AI messages per month</p>
      <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
    </div>
  );
}
```

**Validation Gate:**
```bash
# Test email verification flow
1. Sign up new user (should NOT require email verification)
2. Send 15 AI messages
3. 15th message should trigger VerifyEmailPrompt modal
4. Click "Verify Email" → Check email
5. Click verification link → Redirected to /verified page
6. Database should show ai_messages_limit = 50
7. Send 16th message (should work now)
```

---

### Phase 3: Dashboard UI Components

#### Task 3.1: Create AI Message Counter
```typescript
// components/subscription/AIMessageCounter.tsx
// CREATE: Color-coded counter with urgency levels
// PATTERN: Use badge component from components/ui/badge.tsx
// Props: messagesUsed, messagesLimit, accountTier
// Colors:
// - Green (0-70%): "text-chart-2 bg-chart-2/10"
// - Yellow (70-90%): "text-amber-500 bg-amber-500/10"
// - Orange (90-98%): "text-orange-500 bg-orange-500/10"
// - Red (98-100%): "text-destructive bg-destructive/10 animate-pulse"
// Premium: "Unlimited ♾️" with gradient styling
```

#### Task 3.2: Integrate Counter into AI Coach
```typescript
// components/AINutritionCoach.tsx
// MODIFY: Add AIMessageCounter to header
// Use useAIUsage() hook to fetch usage data
// Display counter next to AI coach title
// PATTERN: <DialogHeader> already exists, add counter as sibling
```

#### Task 3.3: Create Upgrade Teaser Banner
```typescript
// components/subscription/UpgradeTeaser.tsx
// CREATE: Progressive urgency banner for 40/45/49 messages
// PATTERN: Sticky banner at top of dashboard
// Show at:
// - 40/50: Yellow banner "10 messages left - Upgrade for unlimited"
// - 45/50: Orange banner "5 messages left! Upgrade to Premium"
// - 49/50: Red pulsing banner "Last message! Upgrade now"
// Click → Open PaywallModal
```

#### Task 3.4: Create Premium Badge
```typescript
// components/subscription/PremiumBadge.tsx
// CREATE: Crown icon badge for premium/trial users
// PATTERN: Use Badge component with gradient styling
// Show: "👑 Premium" or "⚡ Trial (X days left)"
// Position: Dashboard header next to user name
```

#### Pseudocode for Task 3.1:
```typescript
// components/subscription/AIMessageCounter.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIMessageCounterProps {
  messagesUsed: number;
  messagesLimit: number;
  accountTier: 'free' | 'trial' | 'premium';
}

export function AIMessageCounter({ messagesUsed, messagesLimit, accountTier }: AIMessageCounterProps) {
  // Premium users show "Unlimited"
  if (accountTier === 'premium' || accountTier === 'trial') {
    return (
      <Badge className="bg-gradient-to-r from-primary via-chart-2 to-chart-3">
        <Sparkles className="w-3 h-3 mr-1" />
        Unlimited Messages
      </Badge>
    );
  }

  // Calculate percentage
  const percentage = (messagesUsed / messagesLimit) * 100;

  // Determine color based on percentage
  const colorClass =
    percentage < 70 ? 'text-chart-2 bg-chart-2/10' :
    percentage < 90 ? 'text-amber-500 bg-amber-500/10' :
    percentage < 98 ? 'text-orange-500 bg-orange-500/10' :
    'text-destructive bg-destructive/10 animate-pulse';

  return (
    <Badge className={cn(colorClass, 'font-mono')}>
      {messagesUsed}/{messagesLimit} messages
    </Badge>
  );
}
```

**Validation Gate:**
```bash
# Test UI components
1. Free user with 10/15 messages → Green counter
2. Free user with 40/50 messages → Yellow banner + yellow counter
3. Free user with 49/50 messages → Red pulsing banner + red counter
4. Trial user → "⚡ Trial (5 days left)" badge + "Unlimited" counter
5. Premium user → "👑 Premium" badge + "Unlimited" counter
```

---

### Phase 4: Paywall & Upgrade Flow

#### Task 4.1: Create Paywall Modal
```typescript
// components/subscription/PaywallModal.tsx
// CREATE: Full-screen modal at 50/50 messages
// PATTERN: Use Dialog from components/ui/dialog.tsx
// Show:
// - User stats (streak, meals logged, AI conversations)
// - "Upgrade to Premium for unlimited AI"
// - Pricing: $12/mo or $99/yr (save $45)
// - CTA: "Start 7-Day Free Trial" (no card required)
// - Secondary CTA: "Maybe Later" (closes modal, can't send more messages)
```

#### Task 4.2: Create Start Trial Page
```typescript
// app/start-trial/page.tsx
// CREATE: Trial activation page
// Flow:
// 1. Show trial benefits and 7-day countdown
// 2. Button "Activate Free Trial"
// 3. Update database:
//    - account_tier = 'trial'
//    - trial_started_at = NOW()
//    - trial_ends_at = NOW() + 7 days
//    - ai_messages_used = 0 (reset)
// 4. Redirect to dashboard with success message
```

#### Task 4.3: Create Trial Banner
```typescript
// components/subscription/TrialBanner.tsx
// CREATE: Trial countdown banner for dashboard
// PATTERN: Sticky banner at top, similar to UpgradeTeaser
// Progressive urgency:
// - Day 1-3: Green "⚡ Premium Trial Active! X days left"
// - Day 4-5: Yellow "⏰ Add payment to continue Premium" (click → AddPaymentModal)
// - Day 6-7: Orange "🔥 Last day! Add payment now" (pulsing)
// Use date-fns to calculate days remaining
```

#### Task 4.4: Create Trial Status Hook
```typescript
// lib/hooks/useTrialStatus.ts
// CREATE: Hook to fetch and track trial status
// PATTERN: Mirror useUserSettings.ts structure
// Returns:
// - isOnTrial: boolean
// - daysRemaining: number
// - trialEndsAt: Date
// - needsPayment: boolean (true if < 3 days left)
```

#### Pseudocode for Task 4.2:
```typescript
// app/start-trial/page.tsx
'use client';

export default function StartTrialPage() {
  const [activating, setActivating] = useState(false);
  const router = useRouter();

  async function activateTrial() {
    setActivating(true);

    try {
      // 1. Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Get user database ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      // 3. Activate trial
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase
        .from('users')
        .update({
          account_tier: 'trial',
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnds.toISOString(),
          ai_messages_used: 0  // Reset usage
        })
        .eq('id', userData.id);

      // 4. Redirect to dashboard with success message
      router.push('/?trial=activated');
    } catch (error) {
      console.error('Failed to activate trial:', error);
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <h1>Start Your 7-Day Premium Trial</h1>
      <ul>
        <li>✅ Unlimited AI messages</li>
        <li>✅ Custom macro goals</li>
        <li>✅ Advanced analytics</li>
        <li>✅ Data export</li>
        <li>✅ Priority support</li>
      </ul>
      <p>No credit card required. Cancel anytime.</p>
      <Button onClick={activateTrial} disabled={activating}>
        {activating ? 'Activating...' : 'Start Free Trial'}
      </Button>
    </div>
  );
}
```

**Validation Gate:**
```bash
# Test paywall and trial flow
1. Free user with 50/50 messages → PaywallModal appears
2. Click "Start 7-Day Free Trial" → Redirect to /start-trial
3. Click "Activate Free Trial" → Database updated, redirect to dashboard
4. Dashboard shows "⚡ Trial (7 days left)" banner
5. Send unlimited AI messages (no limit)
6. Wait 5 days → Banner changes to "⏰ Add payment to continue"
```

---

### Phase 5: Stripe Integration (USE MCP TO ACCELERATE)

**⚠️ CRITICAL: Set up Stripe MCP first to save 8-10 hours**

```bash
# Set up Stripe MCP (3 minutes)
claude mcp add --transport http stripe https://mcp.stripe.com/

# Then ask Claude to:
# 1. Create products: "Create Stripe products for monthly ($12) and annual ($99) plans"
# 2. Generate checkout code: "Generate Next.js API route for Stripe checkout session"
# 3. Generate webhook handler: "Generate webhook handler for subscription events"
```

#### Task 5.1: Set Up Stripe Products (with MCP)
```bash
# Use Stripe MCP to create products
Ask Claude: "Create Stripe products for my subscription tiers:
- Monthly: $12/month
- Annual: $99/year"

# MCP will create products and return IDs
# Add IDs to .env file:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
```

#### Task 5.2: Create Checkout Session API Route (with MCP)
```typescript
// app/api/stripe/create-checkout-session/route.ts
// Use MCP to generate complete route with latest patterns
Ask Claude: "Generate Next.js API route for Stripe checkout session that:
- Accepts plan type (monthly/annual)
- Creates customer if doesn't exist
- Sets up 7-day trial without payment method
- Redirects to success/cancel pages"

// MCP will generate code using latest Stripe API patterns
// Key parameters:
// - mode: 'subscription'
// - subscription_data: { trial_period_days: 7 }
// - payment_method_collection: 'if_required'
// - success_url: /payment/success?session_id={CHECKOUT_SESSION_ID}
// - cancel_url: /payment/cancelled
```

#### Task 5.3: Create Webhook Handler (with MCP)
```typescript
// app/api/stripe/webhook/route.ts
// Use MCP to generate webhook handler with proper verification
Ask Claude: "Generate Stripe webhook handler for Next.js that handles:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed"

// GOTCHA: MCP knows to use req.text() not req.json() for signature verification
// GOTCHA: MCP will include proper error handling and database sync logic
```

#### Task 5.4: Create Customer Portal Route
```typescript
// app/api/stripe/customer-portal/route.ts
// Generate portal redirect endpoint
POST /api/stripe/customer-portal
// 1. Get user's stripe_customer_id
// 2. Create portal session: stripe.billingPortal.sessions.create()
// 3. Return portal URL
```

#### Task 5.5: Test Webhooks Locally
```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted

# Expected: Database updates correctly for each event
```

#### Pseudocode for Task 5.2:
```typescript
// app/api/stripe/create-checkout-session/route.ts
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    // 2. Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('auth_id', user.id)
      .single();

    // 3. Parse request body
    const { planType } = await request.json();  // 'monthly' or 'annual'
    const priceId = planType === 'annual'
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    // 4. Create or retrieve Stripe customer
    let customerId = userData.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: { user_id: userData.id }
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id);
    }

    // 5. Create checkout session with trial
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,  // ⚠️ Must be here, not at root level
      },
      payment_method_collection: 'if_required',  // No card for trial
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled`,
      metadata: {
        user_id: userData.id
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

#### Pseudocode for Task 5.3:
```typescript
// app/api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service_role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // ⚠️ CRITICAL: Use req.text() not req.json() for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;

      if (!userId) break;

      // Update user to premium
      await supabase
        .from('users')
        .update({
          account_tier: 'premium',
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          ai_messages_used: 0  // Reset usage
        })
        .eq('id', userId);

      // Create subscription record
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        });

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      // Update subscription record
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_customer_id', subscription.customer as string);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      // Downgrade user to free
      await supabase
        .from('users')
        .update({
          account_tier: 'free',
          subscription_status: 'canceled',
          ai_messages_limit: 50  // Keep verified limit
        })
        .eq('stripe_customer_id', subscription.customer as string);

      // Update subscription record
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;

      // Update subscription status to past_due
      await supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);

      // TODO: Send email warning user of failed payment
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Validation Gate:**
```bash
# Test Stripe integration end-to-end
1. Start trial (no payment)
2. Click "Add Payment Method" after 5 days
3. Select Monthly plan → Redirects to Stripe Checkout
4. Enter test card: 4242 4242 4242 4242
5. Complete payment → Redirected to /payment/success
6. Database shows:
   - account_tier = 'premium'
   - subscription_status = 'active'
   - stripe_customer_id set
   - subscriptions table has record
7. Test webhook events with Stripe CLI
8. Test Customer Portal:
   - Click "Manage Subscription" in settings
   - Update payment method
   - Cancel subscription
   - Verify database updates correctly
```

---

### Phase 6: Payment Flow Pages

#### Task 6.1: Create Add Payment Modal
```typescript
// components/subscription/AddPaymentModal.tsx
// CREATE: Modal for trial users day 5+
// PATTERN: Dialog with premium gradient styling
// Show:
// - User stats and engagement metrics
// - FOMO messaging: "Don't lose your unlimited AI access"
// - Plan selection: Monthly ($12) or Annual ($99, save $45)
// - CTA: "Continue to Payment" → Calls /api/stripe/create-checkout-session
```

#### Task 6.2: Create Payment Success Page
```typescript
// app/payment/success/page.tsx
// CREATE: Success page with celebration
// PATTERN: Use confetti (canvas-confetti package)
// Show:
// - "🎉 Welcome to Premium!"
// - Subscription details (plan, billing date)
// - CTA: "Go to Dashboard"
// Verify session_id query param, fetch subscription details
```

#### Task 6.3: Create Payment Cancelled Page
```typescript
// app/payment/cancelled/page.tsx
// CREATE: Friendly page for cancelled payments
// Show:
// - "Payment was cancelled"
// - "Your trial is still active for X days"
// - CTA: "Try Again" → Reopens AddPaymentModal
// - Secondary CTA: "Go to Dashboard"
```

#### Pseudocode for Task 6.1:
```typescript
// components/subscription/AddPaymentModal.tsx
'use client';

export function AddPaymentModal({ open, onOpenChange }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);

    try {
      // Call checkout session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: selectedPlan })
      });

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="AI Conversations" value="45" />
            <StatCard label="Meals Logged" value="312" />
            <StatCard label="Current Streak" value="28 days" />
          </div>

          {/* FOMO messaging */}
          <div className="bg-amber-500/10 p-4 rounded-lg">
            <p className="text-amber-500 font-medium">
              Your trial ends in 2 days. Add payment to keep unlimited AI access!
            </p>
          </div>

          {/* Plan selection */}
          <div className="space-y-3">
            <PlanOption
              selected={selectedPlan === 'monthly'}
              onSelect={() => setSelectedPlan('monthly')}
              title="Monthly"
              price="$12/month"
              description="Billed monthly, cancel anytime"
            />
            <PlanOption
              selected={selectedPlan === 'annual'}
              onSelect={() => setSelectedPlan('annual')}
              title="Annual"
              price="$99/year"
              description="Save $45 per year"
              badge="Best Value"
            />
          </div>

          {/* CTA */}
          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-chart-2"
          >
            {loading ? 'Redirecting...' : 'Continue to Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Validation Gate:**
```bash
# Test payment flow
1. Trial user day 5 → AddPaymentModal appears
2. Select "Annual" plan → Click "Continue to Payment"
3. Redirects to Stripe Checkout
4. Complete payment → Redirected to /payment/success
5. Confetti animation plays
6. Dashboard shows "👑 Premium Member" badge
7. Click back button during checkout → Redirected to /payment/cancelled
8. "Try Again" button reopens AddPaymentModal
```

---

### Phase 7: Subscription Management

#### Task 7.1: Create Subscription Section for Settings
```typescript
// components/settings/SubscriptionSection.tsx
// CREATE: Complete subscription management UI
// PATTERN: Card layout like existing settings sections
// Show based on account_tier:
// - Free: Upgrade CTA with benefits list
// - Trial: Days remaining, payment CTA
// - Premium: Plan details, billing date, portal link, cancel option
```

#### Task 7.2: Add to Settings Page
```typescript
// app/settings/page.tsx
// MODIFY: Add SubscriptionSection after ProfileSection
// PATTERN: Existing settings page uses Card grid layout
```

#### Task 7.3: Create Subscription Status API Route
```typescript
// app/api/subscription/status/route.ts
// GET endpoint to fetch user subscription details
// Returns:
// - account_tier, subscription_status
// - trial_ends_at (if on trial)
// - subscription_current_period_end (if premium)
// - stripe_price_id (to determine monthly/annual)
// - cancel_at_period_end
```

#### Task 7.4: Create Subscription Hook
```typescript
// lib/hooks/useSubscription.ts
// CREATE: Hook for subscription data and actions
// PATTERN: Mirror useUserSettings.ts structure
// Methods:
// - fetchSubscription()
// - openCustomerPortal() → Calls /api/stripe/customer-portal
// - cancelSubscription() → Opens CancelSubscriptionModal
```

#### Task 7.5: Create Cancel Subscription Modal
```typescript
// components/subscription/CancelSubscriptionModal.tsx
// CREATE: Retention modal before cancel
// Show:
// - "Are you sure you want to cancel?"
// - What user will lose (unlimited AI, custom goals, etc.)
// - Alternative: "Pause subscription instead" (future feature)
// - CTAs: "Keep Premium" (primary), "Cancel Anyway" (secondary)
// On confirm: Opens Stripe Customer Portal pre-filled to cancel
```

#### Pseudocode for Task 7.1:
```typescript
// components/settings/SubscriptionSection.tsx
'use client';

export function SubscriptionSection() {
  const { subscription, loading } = useSubscription();

  if (loading) return <LoadingSpinner />;

  // Free tier - show upgrade CTA
  if (subscription.accountTier === 'free') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>You're on the Free plan</p>
            <ul className="space-y-2">
              <li>✅ 50 AI messages per month</li>
              <li>❌ Custom macro goals</li>
              <li>❌ Advanced analytics</li>
              <li>❌ Data export</li>
            </ul>
            <Button onClick={() => router.push('/start-trial')}>
              Start 7-Day Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial - show days remaining
  if (subscription.accountTier === 'trial') {
    const daysLeft = Math.ceil(
      (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Premium Trial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Your trial ends in {daysLeft} days</p>
            <Button onClick={handleAddPayment}>
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Premium - show subscription details
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-chart-2" />
          Premium Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">
              {subscription.planType === 'annual' ? 'Annual ($99/year)' : 'Monthly ($12/month)'}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Next billing date</p>
            <p className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenPortal}>
              Manage Subscription
            </Button>
            <Button variant="outline" onClick={handleCancelClick}>
              Cancel Subscription
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Validation Gate:**
```bash
# Test subscription management
1. Free user → Settings shows "Start 7-Day Free Trial" button
2. Trial user → Settings shows "X days remaining" + "Add Payment Method"
3. Premium user → Settings shows plan details + billing date
4. Click "Manage Subscription" → Redirects to Stripe Customer Portal
5. Update payment method in portal → Success
6. Click "Cancel Subscription" → CancelSubscriptionModal appears
7. Click "Cancel Anyway" → Redirects to portal cancel flow
8. Complete cancellation → Database updates account_tier to 'free'
```

---

### Phase 8: Premium Features (Basic Gates)

#### Task 8.1: Update AI Message Counter for Premium
```typescript
// components/subscription/AIMessageCounter.tsx
// MODIFY: Show "Unlimited ♾️" for premium/trial users
// Already implemented in Phase 3, verify it works
```

#### Task 8.2: Create Premium Feature Gate Utility
```typescript
// lib/utils/premium-features.ts
// CREATE: Helper functions to check feature access
export function canAccessFeature(feature: string, accountTier: string): boolean {
  const premiumFeatures = ['custom_goals', 'data_export', 'advanced_analytics'];
  return accountTier === 'premium' || !premiumFeatures.includes(feature);
}
```

#### Task 8.3: Add Premium Badges to Locked Features
```typescript
// MODIFY: MacroGoalsForm.tsx, Settings page, etc.
// Add "👑 Premium" badge to custom goals section
// Show upgrade modal when clicked by free users
```

**Validation Gate:**
```bash
# Test premium feature gates
1. Free user tries to set custom goals → Upgrade modal appears
2. Premium user sets custom goals → Works without prompt
3. Free user tries to export data → Upgrade modal appears
4. Premium user exports data → CSV downloads successfully
```

---

### Phase 9: Landing Page Updates

#### Task 9.1: Create Pricing Comparison Component
```typescript
// components/landing/PricingComparison.tsx
// CREATE: Two-column Free vs Premium table
// Show side-by-side comparison:
// - AI Messages: "50/month" vs "Unlimited"
// - Custom Goals: ❌ vs ✅
// - Data Export: ❌ vs ✅
// - Price: "$0" vs "$12/mo"
```

#### Task 9.2: Update Pricing Section
```typescript
// components/landing/Pricing.tsx
// MODIFY: Replace single pricing card with PricingComparison
// Add CTA buttons: "Sign Up Free" and "Start Trial"
```

#### Task 9.3: Update Hero Messaging
```typescript
// components/landing/Hero.tsx
// MODIFY: Add mention of free tier in hero text
// "Start free with 50 AI messages per month"
```

**Validation Gate:**
```bash
# Test landing page updates
1. Visit landing page → Pricing section shows Free vs Premium comparison
2. Click "Sign Up Free" → Redirects to /signup
3. Click "Start Trial" → Redirects to /start-trial (requires login)
4. Hero text mentions "Start free with 50 AI messages"
```

---

### Phase 10: Analytics & Monitoring

#### Task 10.1: Add Analytics Events
```typescript
// lib/analytics.ts
// CREATE: Analytics event tracking
export function trackEvent(event: string, properties?: Record<string, any>) {
  // Use your analytics service (PostHog, Mixpanel, etc.)
  // Or log to custom table for now
}

// Events to track:
// - signup_completed
// - email_verified
// - ai_limit_reached
// - trial_started
// - payment_added
// - subscription_created
// - subscription_cancelled
```

#### Task 10.2: Create Admin Dashboard (Basic)
```typescript
// app/admin/page.tsx
// CREATE: Basic admin dashboard (protect with auth)
// Show:
// - Total users by tier (free, trial, premium)
// - AI usage stats (total messages, total cost)
// - Conversion funnel metrics
// - Revenue metrics (MRR, churn rate)
```

#### Task 10.3: Set Up Cost Alerts
```typescript
// app/api/cron/cost-monitor/route.ts
// CREATE: Daily cron job to check AI costs
// Alert if:
// - Any user > 500 messages/month
// - Total free tier cost > budget
// - Premium user > 1,000 messages/month (fair use cap)
// Send email/Slack notification
```

**Validation Gate:**
```bash
# Test analytics and monitoring
1. Sign up → Check analytics event "signup_completed" logged
2. Verify email → Check analytics event "email_verified" logged
3. Hit 50 messages → Check analytics event "ai_limit_reached" logged
4. Admin dashboard shows correct user counts by tier
5. Admin dashboard shows AI usage stats and costs
6. Cost monitor alerts when user exceeds 500 messages
```

---

### Phase 11: Email Automation (Optional for MVP)

#### Task 11.1: Set Up Email Service
```bash
# Choose email service: Resend, SendGrid, or Postmark
# Add API key to .env
EMAIL_API_KEY=...
```

#### Task 11.2: Create Email Templates
```typescript
// lib/emails/templates.ts
// CREATE: Email templates for:
// - Welcome email (after signup)
// - Email verification reminder (24hr after signup if not verified)
// - Trial started confirmation
// - Trial ending soon (day 5)
// - Trial ended (downgrade to free)
// - Payment receipt
// - Subscription cancelled confirmation
// - Win-back email (7 days after churn)
```

#### Task 11.3: Integrate Email Sending
```typescript
// Trigger emails from:
// - Signup flow → Welcome email
// - Webhook handler → Receipt, trial notifications
// - Cron jobs → Reminders, win-back campaigns
```

**Validation Gate:**
```bash
# Test email automation
1. Sign up → Receive welcome email
2. Don't verify within 24 hours → Receive verification reminder
3. Start trial → Receive trial confirmation email
4. Trial day 5 → Receive "add payment" reminder email
5. Cancel subscription → Receive cancellation confirmation
```

---

### Phase 12: Testing & QA

#### Task 12.1: End-to-End User Journey Tests
```bash
# Test complete flows:
1. Free Tier Journey:
   - Sign up → Send 15 messages → Verify email prompt
   - Verify email → Send 35 more messages → Paywall modal
   - Start trial → Unlimited messages for 7 days
   - Add payment on day 5 → Become premium
   - Send unlimited messages → Check cost tracking

2. Trial Expiration:
   - Start trial → Don't add payment
   - Wait 7 days → Auto-downgrade to free tier
   - Verify 50 message limit restored

3. Subscription Cancellation:
   - Premium user → Cancel subscription
   - Continue using until period end
   - After period end → Downgrade to free tier

4. Failed Payment:
   - Premium user → Payment fails
   - Status changes to past_due
   - Grace period of 3 days
   - After 3 days → Downgrade to free tier
```

#### Task 12.2: Edge Case Testing
```bash
# Test edge cases:
1. User hits exactly 15/15 messages → Modal appears immediately
2. User tries to send 16th message without verification → Blocked
3. User verifies email mid-conversation → Limit increases to 50
4. User tries multiple accounts with same email → Blocked by cooldown
5. User tries to bypass rate limit with rapid requests → 429 errors
6. User tries extremely long message → Length validation blocks
7. Webhook receives duplicate event → Handled gracefully
8. Webhook receives malformed event → Logs error, returns 200
```

#### Task 12.3: Load Testing
```bash
# Simulate heavy usage:
1. 100 concurrent AI chat requests → Rate limiting works
2. 10 webhook events per second → All processed correctly
3. 1000 users checking usage stats → No DB slowdowns
```

#### Task 12.4: Mobile Responsiveness
```bash
# Test on mobile devices:
1. All modals display correctly
2. Payment flow works on mobile
3. Customer Portal works on mobile
4. AI chat interface responsive
```

#### Task 12.5: Accessibility Audit
```bash
# Check accessibility:
1. All buttons have ARIA labels
2. Keyboard navigation works
3. Screen reader compatibility
4. Color contrast meets WCAG AA standards
```

**Final Validation Checklist:**
- [ ] Free tier stays under $0.15/user/month average
- [ ] Email verification increases limit from 15 to 50
- [ ] Paywall appears at 50/50 messages
- [ ] 7-day trial activates without payment
- [ ] Stripe checkout creates subscriptions correctly
- [ ] All 5 webhook events handled properly
- [ ] Customer Portal works for subscription management
- [ ] Rate limiting prevents abuse
- [ ] Message length limits enforced
- [ ] Context window limits reduce costs
- [ ] Database updates correctly for all flows
- [ ] Mobile experience is smooth
- [ ] Analytics tracks all key events

---

## Integration Points

### Backend (Python FastAPI)
```yaml
ALREADY IMPLEMENTED:
  - JWT authentication in dependencies/auth.py
  - AI usage tracking in main.py
  - CoachAgentDependencies with user_id

NO CHANGES NEEDED:
  - Python backend already logs tokens/usage
  - Next.js API route calls increment_ai_message_usage()
```

### Frontend (Next.js)
```yaml
MODIFY:
  - app/api/ai/chat/route.ts: Add rate limiting, usage tracking
  - components/AINutritionCoach.tsx: Add message counter
  - components/auth/SignupForm.tsx: Remove immediate verification

CREATE:
  - 6 new API routes (Stripe + subscription + usage)
  - 8 new subscription components
  - 3 new custom hooks
  - 5 new pages (trial, payment, etc.)
```

### Database (Supabase)
```yaml
ALREADY IMPLEMENTED:
  - Migration 010 created all tables and functions
  - Helper functions: can_user_send_ai_message, increment_ai_message_usage

USE EXISTING:
  - Call database functions from API routes
  - No new migrations needed
```

---

## Validation Loop

### Level 1: TypeScript Compilation
```bash
# Run in macro-tracker directory
cd macro-tracker
npm run build

# Expected: No type errors
# If errors: Fix type issues in new files
```

### Level 2: Linting
```bash
# Run ESLint
npm run lint

# Expected: No linting errors
# If errors: Fix code style issues
```

### Level 3: Manual Testing (Critical Paths)
```bash
# Test each phase sequentially
1. Phase 1: AI Cost Controls
   - Send 11 messages rapidly → 11th should be rate limited
   - Send 501-char message as free user → Should be blocked
   - Set user to 50/50 messages → Next message should be blocked

2. Phase 2: Email Verification
   - Sign up → Should NOT require verification immediately
   - Send 15 messages → Verification prompt should appear
   - Verify email → Limit should increase to 50

3. Phase 3: Dashboard UI
   - Free user 10/15 → Green counter
   - Free user 40/50 → Yellow banner + counter
   - Premium user → "Unlimited" counter + crown badge

4. Phase 4: Trial Flow
   - Hit 50/50 → Paywall modal appears
   - Start trial → Database updated correctly
   - Trial user → Unlimited messages work

5. Phase 5: Stripe Integration
   - Create checkout session → Redirects to Stripe
   - Complete payment → Webhook fires, DB updates
   - Test all 5 webhook events

6. Phase 6: Payment Pages
   - Success page → Confetti plays
   - Cancelled page → Shows friendly message

7. Phase 7: Subscription Management
   - Open Customer Portal → Works correctly
   - Update payment method → Success
   - Cancel subscription → DB updates

8. Phase 8-12: Remaining Features
   - Premium feature gates work
   - Landing page displays new pricing
   - Analytics events fire correctly
```

### Level 4: Integration Testing
```bash
# Test complete user journeys (see Phase 12)
# Run through all scenarios from signup to premium to cancellation
```

### Level 5: Performance Testing
```bash
# Load test critical endpoints
# Verify rate limiting works under load
# Check database query performance
```

---

## Anti-Patterns to Avoid

- ❌ **Don't skip rate limiting** - Free tier could drain budget without it
- ❌ **Don't trust client-side limits** - Always enforce on server
- ❌ **Don't skip webhook verification** - Anyone can POST to your webhook URL
- ❌ **Don't use req.json() for webhooks** - Breaks Stripe signature verification (use req.text())
- ❌ **Don't initialize rate limiter inside handler** - Creates fresh instance each time = no memory
- ❌ **Don't use anon key for webhook handler** - Needs service_role to bypass RLS
- ❌ **Don't skip trial_period_days in subscription_data** - Won't create trial correctly
- ❌ **Don't forget to reset ai_messages_used on upgrade** - Users expect fresh start
- ❌ **Don't allow unlimited context window for free users** - Token costs grow exponentially
- ❌ **Don't skip Stripe MCP setup** - Will save 8-10 hours on Phase 5

---

## Success Metrics (Post-Launch)

### Week 1-2 (Validation):
- Free signup rate: >30%
- Email verification rate: >50%
- 15-message limit hit rate: >25%
- Cost per free user: <$0.15/month ✅

### Month 1 (Growth):
- Trial start rate: >40% (of users who hit 50 msg limit)
- Trial → Paid conversion: >30%
- Churn rate: <10%
- MRR: $500+

### Month 3 (Scale):
- 1,000+ free users
- 100+ paying users
- $1,200+ MRR
- 60%+ profit margin
- CAC payback: <2 months

---

## Support & Resources

### Stripe Resources
- **Stripe MCP Server:** https://docs.stripe.com/mcp (⚡ USE THIS - saves 8-10 hours)
- **Stripe API Docs:** https://stripe.com/docs/api
- **Webhooks Guide:** https://stripe.com/docs/webhooks
- **Customer Portal:** https://stripe.com/docs/customer-management
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Testing Cards:** https://stripe.com/docs/testing

### Next.js Resources
- **API Routes:** https://nextjs.org/docs/api-routes/introduction
- **Rate Limiting:** https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj

### Supabase Resources
- **Database Functions:** https://supabase.com/docs/guides/database/functions
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

---

## Confidence Score: 9/10

**Strengths:**
- Complete database schema already exists (migration 010)
- Clear implementation path with pseudocode
- Comprehensive cost controls defined
- Stripe MCP integration will accelerate Phase 5
- Existing authentication patterns to follow
- Well-researched best practices from 2024-2025

**Potential Challenges:**
- Rate limiting without Redis (using in-memory for MVP)
- Webhook testing requires Stripe CLI setup
- Email automation is optional (can defer)
- Analytics implementation depends on chosen service

**Why 9/10:**
- All technical patterns validated and researched
- Database schema already created (reduces risk)
- Stripe MCP provides real-time validation during development
- Clear validation gates at each phase
- One-pass implementation is achievable with this level of context

**Estimated Implementation Time:**
- **With Stripe MCP:** 32-40 hours (part-time over 2-3 weeks)
- **Without Stripe MCP:** 40-50 hours (additional 8-10 hours on Phase 5)

**Recommendation:** Set up Stripe MCP before starting Phase 5 to maximize efficiency.
