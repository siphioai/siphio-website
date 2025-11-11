# Payment & Subscription System - Freemium to Premium Conversion Funnel

## FEATURE OVERVIEW

Implement a complete freemium-to-paid conversion funnel with Stripe integration, two-stage email verification, AI usage tracking with strict cost controls, and subscription management for the Siphio macro tracker application.

---

## 🎯 BUSINESS MODEL

### Tier Structure

**FREE FOREVER**
- **Price:** $0/month
- **AI Messages:**
  - Stage 1 (Unverified): 15 messages/month
  - Stage 2 (Email Verified): 50 messages/month total
- **Cost:** ~$0.066/user/month average (56% under $0.15 budget)
- **Features:** Core tracking, 300k+ food database, basic charts, streak tracking

**PREMIUM**
- **Price:** $12/month or $99/year (save $45)
- **AI Messages:** Unlimited (fair use: monitor at 1,000/month)
- **Cost:** $2-10/user/month (avg $4-6)
- **Margin:** 50-67% blended
- **Features:** Everything in Free + unlimited AI, custom goals, advanced analytics, data export, priority support

---

## 💰 COST CONTROLS (Critical)

### Free Tier Budget: MAX $0.15/user/month

**Claude 3.5 Haiku Pricing:**
- Input: $0.80 per million tokens
- Output: $4.00 per million tokens
- Average cost per message: ~$0.0018

**Protection Strategies:**

1. **Message Limits**
   - Unverified: 15 messages (hard cap)
   - Verified: 50 messages/month (hard cap)
   - Premium: Unlimited (soft cap at 1,000/month)

2. **Message Length Limits**
   ```typescript
   const MESSAGE_LIMITS = {
     free: 500 characters,
     premium: 2000 characters
   };
   ```

3. **Context Window Limits**
   ```typescript
   const CONTEXT_LIMITS = {
     free: {
       max_history_messages: 4,
       max_context_tokens: 2000,
       max_output_tokens: 300
     },
     premium: {
       max_history_messages: 10,
       max_context_tokens: 8000,
       max_output_tokens: 500
     }
   };
   ```

4. **Rate Limiting**
   ```typescript
   const RATE_LIMITS = {
     free: {
       messages_per_hour: 10,
       messages_per_day: 20,
       cooldown_after_burst: 60 // seconds
     },
     premium: {
       messages_per_hour: 30,
       messages_per_day: 200
     }
   };
   ```

5. **Monitoring & Alerts**
   - Flag at 500 messages/month
   - Review at 1,000 messages/month
   - Throttle at 1,500 messages/month (premium only)

---

## 🚀 CONVERSION FUNNEL

### Stage 1: Sign Up (No Email Verification)
```
User lands on site → Signs up → Immediately logged in → Dashboard
Gets: 15 free AI messages (no verification required yet)
Cost: ~$0.03/user
```

### Stage 2: First 15 Messages
```
User engages with AI coach → Uses 15 messages over 3-7 days
After 15th message → Full-screen modal: "Verify email to unlock 35 more!"
Conversion goal: 60% verify email
```

### Stage 3: Email Verification (Reward Unlock)
```
User clicks "Verify Email" → Email sent → User clicks link
Success page: "🎉 You unlocked 35 more messages! (50 total)"
Redirected to dashboard with 50/month limit
Cost: ~$0.09/user (verified users only)
```

### Stage 4: Using Messages 16-50
```
Progressive urgency banners:
- At 40/50: Yellow banner "10 messages left"
- At 45/50: Orange banner "5 messages left!"
- At 49/50: Red pulsing banner "Last message!"
Conversion goal: 40% hit the limit
```

### Stage 5: Hit 50 Message Limit (Paywall)
```
Full-screen modal showing:
- User stats (streak, meals logged, AI convos)
- "Upgrade to Premium for unlimited AI"
- $12/mo or $99/yr pricing
- "Start 7-Day Free Trial" CTA (no card required)
Conversion goal: 50% start trial
```

### Stage 6: 7-Day Premium Trial
```
Day 1-3: Green banner "⚡ Premium Trial Active! X days left"
Day 4-5: Yellow banner "⏰ Add payment to continue Premium" (modal opens)
Day 6-7: Orange banner "🔥 Last day! Add payment now"

Trial includes: Unlimited AI, all premium features
Cost during trial: ~$5/user average
Conversion goal: 35% add payment method
```

### Stage 7: Add Payment Method
```
User clicks "Add Payment" → Modal shows stats + FOMO
Select: Monthly ($12) or Annual ($99, save $45)
Click "Continue" → Stripe Checkout → Enter card → Subscribe
Success: Redirect to /payment/success with celebration
```

### Stage 8: Premium User
```
Dashboard shows:
- "👑 Premium Member" badge
- "Unlimited AI messages" counter
- Access to all premium features
Settings includes:
- Subscription management
- Payment method update
- Usage statistics
- Cancel subscription option
```

---

## 📊 EXPECTED ECONOMICS

### Per 1,000 Landing Page Visitors:

```
1,000 visitors (35% signup rate)
  ↓
350 free signups
  - Cost: $105 (350 × $0.30 avg)
  ↓ 40% hit 50 msg limit
140 see upgrade prompt
  ↓ 50% start trial
70 trial users
  - Cost: $350 (70 × $5 avg trial usage)
  ↓ 35% convert to paid
25 premium users @ $12/mo
  - Revenue: $300/mo
  - Cost: $100-150/mo (AI + infrastructure)
  - Profit: $150-200/mo (50-67% margin)

CAC: $455 ÷ 25 = $18.20
Payback Period: 1.5 months ✅
LTV (12 months): $144 → 7.9x CAC ✅
```

---

## 🎨 UI/UX COMPONENTS TO BUILD

### Landing Page Updates (2 components)
1. **PricingComparison.tsx** - Two-column Free vs Premium table
2. **Update Pricing.tsx** - Reflect two-tier messaging

### Dashboard Components (4 new)
3. **AIMessageCounter.tsx** - Color-coded counter with urgency
4. **UpgradeTeaser.tsx** - Progressive urgency banner (40/45/49 messages)
5. **TrialBanner.tsx** - Trial countdown with payment CTA
6. **PremiumBadge.tsx** - Crown icon for premium users

### Modal Components (5 new)
7. **VerifyEmailPrompt.tsx** - After 15 messages, prompt to verify
8. **PaywallModal.tsx** - After 50 messages, upgrade or wait
9. **AddPaymentModal.tsx** - Day 5+ trial, add payment
10. **CancelSubscriptionModal.tsx** - Retention before cancel
11. **ReactivationBanner.tsx** - Win-back churned users

### Settings Components (1 new)
12. **SubscriptionSection.tsx** - Full subscription management

### New Pages (5 pages)
13. **app/start-trial/page.tsx** - Trial activation page
14. **app/payment/success/page.tsx** - Post-payment success
15. **app/payment/cancelled/page.tsx** - Payment cancelled
16. **Update app/verify-email/page.tsx** - "Unlock 35 more messages"
17. **Update app/verified/page.tsx** - Celebrate 50 total messages

### API Routes (6 new/updated)
18. **app/api/stripe/create-checkout-session/route.ts** - Create Stripe checkout
19. **app/api/stripe/webhook/route.ts** - Handle Stripe webhooks
20. **app/api/stripe/customer-portal/route.ts** - Billing portal redirect
21. **app/api/subscription/status/route.ts** - Get user subscription
22. **app/api/ai/usage/route.ts** - Get AI usage stats
23. **Update app/api/ai/chat/route.ts** - Track usage, enforce limits

### Custom Hooks (3 new)
24. **lib/hooks/useSubscription.ts** - Subscription status & actions
25. **lib/hooks/useAIUsage.ts** - AI message counter & limits
26. **lib/hooks/useTrialStatus.ts** - Trial countdown & status

---

## 🗄️ DATABASE SCHEMA

### Already Exists (Migration 010):
✅ Extended `users` table with subscription fields
✅ `subscriptions` table (mirrors Stripe data)
✅ `deleted_accounts` table (7-day cooldown)
✅ `ai_usage_log` table (cost monitoring)

### Key Fields in `users` table:
```sql
- email_verified_at: TIMESTAMPTZ (null until verified)
- account_tier: TEXT (free, trial, premium)
- ai_messages_used: INTEGER (resets monthly)
- ai_messages_limit: INTEGER (15 unverified, 50 verified, -1 premium)
- stripe_customer_id: TEXT
- trial_started_at: TIMESTAMPTZ
- trial_ends_at: TIMESTAMPTZ
- subscription_status: TEXT
- subscription_current_period_end: TIMESTAMPTZ
```

### Database Functions Available:
- `can_user_send_ai_message(user_id)` - Check if user can send message
- `increment_ai_message_usage(user_id, tokens)` - Track usage & cost
- `is_email_in_cooldown(email)` - Check deletion cooldown

---

## 🔌 STRIPE INTEGRATION

### Required Environment Variables:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
```

### Stripe Webhook Events to Handle:
1. `checkout.session.completed` - User completed payment
   - Update `users.account_tier = 'premium'`
   - Update `users.stripe_customer_id`
   - Create record in `subscriptions` table
   - Reset `ai_messages_used = 0`

2. `customer.subscription.updated` - Subscription changed
   - Update `users.subscription_status`
   - Update `users.subscription_current_period_end`
   - Update `subscriptions` table

3. `customer.subscription.deleted` - Subscription cancelled
   - Update `users.account_tier = 'free'`
   - Update `users.subscription_status = 'canceled'`
   - Keep `subscriptions` record for history

4. `invoice.payment_succeeded` - Successful payment
   - Log in `ai_usage_log` or separate payments table
   - Send receipt email (optional)

5. `invoice.payment_failed` - Failed payment
   - Update `users.subscription_status = 'past_due'`
   - Send warning email
   - Grace period: 3 days before downgrade

### Stripe Customer Portal:
- Enable in Stripe Dashboard → Settings → Customer Portal
- Allow: Update payment method, view invoices, cancel subscription
- Redirect URL: `https://yourdomain.com/settings` (after portal actions)

---

## 🤖 STRIPE MCP SERVER INTEGRATION

### What is Stripe MCP?

The **Stripe Model Context Protocol (MCP)** server enables AI agents (like Claude Code) to interact directly with the Stripe API and knowledge base. This accelerates development by allowing your AI coding assistant to:

- Create products, prices, and subscriptions programmatically
- Search Stripe documentation in real-time
- Generate webhook handlers with correct event signatures
- Debug Stripe integration issues with live API access
- Auto-generate API routes with best practices

**Official Documentation:** https://docs.stripe.com/mcp

### Why Use Stripe MCP for This Project?

1. **Faster Implementation** - AI can create checkout sessions, webhook handlers, and subscription management without you needing to reference docs constantly
2. **Correct API Usage** - MCP ensures you're using the latest Stripe API patterns and avoiding deprecated methods
3. **Real-Time Testing** - AI can query your Stripe account status, list products, and verify webhook configurations
4. **Knowledge Base Access** - Search 10,000+ Stripe docs/support articles instantly during development

### Installation & Setup

#### Option 1: Claude Code (Recommended for This Project)

**Add Stripe MCP to Claude Code:**
```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

This enables Claude Code to access Stripe tools during implementation.

#### Option 2: Local NPM Package (For CI/CD)

**Install locally with API key:**
```bash
npx -y @stripe/mcp --tools=all --api-key=YOUR_STRIPE_SECRET_KEY
```

**Or configure in Claude Desktop** (`~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

### Authentication

#### During Development (OAuth - Recommended)
1. Claude Code will prompt you to authorize via OAuth
2. You'll authenticate once with your Stripe account
3. OAuth provides granular permissions and session management
4. Revoke access anytime in Stripe Dashboard → Settings → MCP

#### For Production/Autonomous Agents (API Keys)
```bash
# Use restricted API keys for security
export STRIPE_SECRET_KEY=rk_live_...  # Restricted key, not full access

# Pass as bearer token
curl https://mcp.stripe.com/ \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -d '{"jsonrpc": "2.0", "method": "tools/call", ...}'
```

**Security Best Practice:** Use **restricted API keys** that only allow:
- `customers.write`
- `subscriptions.write`
- `checkout_sessions.write`
- `webhook_endpoints.read`

### Available Tools (25+ Stripe API Operations)

The MCP server provides tools across these categories:

| Category | Tools | Use Case in This Project |
|----------|-------|--------------------------|
| **Products & Pricing** | `create_product`, `create_price`, `list_prices` | Create $12/month and $99/year plans |
| **Checkout** | `create_checkout_session` | Generate payment links for trial→paid |
| **Subscriptions** | `create_subscription`, `update_subscription`, `cancel_subscription` | Manage user subscriptions |
| **Customers** | `create_customer`, `retrieve_customer`, `list_customers` | Create Stripe customer on signup |
| **Invoices** | `create_invoice`, `finalize_invoice`, `list_invoices` | Billing history in settings |
| **Refunds** | `create_refund` | Handle refund requests |
| **Webhooks** | `list_webhook_endpoints` | Verify webhook configuration |
| **Knowledge** | `search_stripe_documentation`, `search_stripe_support` | Debug integration issues |

### How This Speeds Up Implementation

#### Example 1: Creating Subscription Products

**Without MCP:**
```
You: "Create monthly and annual subscription products in Stripe"
AI: "Here's how to do it manually... [provides code snippet, may be outdated]"
You: [Copy API key, open Stripe docs, write code, test, debug]
```

**With MCP:**
```
You: "Create $12/month and $99/year subscription products in my Stripe account"
AI: [Uses MCP to call Stripe API directly]
     "Created! Product IDs: prod_abc123, Price IDs: price_monthly_xyz, price_annual_abc"
You: [Products are live, IDs ready to use in .env file]
```

#### Example 2: Debugging Webhook Issues

**Without MCP:**
```
You: "Why isn't my webhook receiving events?"
AI: "Check these 5 things... [generic troubleshooting]"
You: [Manually check Stripe Dashboard, logs, network requests]
```

**With MCP:**
```
You: "Why isn't my webhook receiving events?"
AI: [Uses MCP to query webhook endpoints]
     "Found issue: Your webhook endpoint is set to http://localhost:3000
     but your deployed URL is https://yourdomain.com.
     Current webhook secret: whsec_abc123"
You: [Update webhook URL, problem solved in 30 seconds]
```

#### Example 3: Generating Webhook Handler Code

**Without MCP:**
```
You: "Write a Next.js webhook handler for Stripe"
AI: [Provides code based on training data, might use old patterns]
You: [Code fails, debug for 2 hours, find deprecated method]
```

**With MCP:**
```
You: "Write a Next.js webhook handler for Stripe subscriptions"
AI: [Queries Stripe docs via MCP for latest patterns]
     [Generates code with current best practices]
     [Includes proper event verification, error handling]
You: [Code works first try, uses latest API version]
```

### Integration Workflow for This Project

**Phase 5 (Stripe Integration) becomes much faster:**

1. **Setup Products** (5 min vs 30 min)
   ```
   You: "Create Stripe products for my pricing tiers:
        - Monthly: $12/month
        - Annual: $99/year (save $45)"
   AI + MCP: [Creates products, returns IDs]
   You: [Copy IDs to .env file]
   ```

2. **Generate Checkout Code** (15 min vs 2 hours)
   ```
   You: "Generate checkout session API route for Next.js that:
        - Accepts plan type (monthly/annual)
        - Creates customer if doesn't exist
        - Redirects to success/cancel pages"
   AI + MCP: [Queries latest Stripe docs, generates code]
   You: [Code works immediately]
   ```

3. **Webhook Handler** (30 min vs 3 hours)
   ```
   You: "Generate webhook handler for these events:
        - checkout.session.completed
        - customer.subscription.updated
        - customer.subscription.deleted
        - invoice.payment_failed"
   AI + MCP: [Generates complete webhook handler with verification]
   You: [Deploy, test, works first try]
   ```

4. **Debug Issues** (instant vs hours)
   ```
   You: "Why is my test payment not completing?"
   AI + MCP: [Checks test mode, card details, webhook delivery]
             "You're using production API key with test card numbers"
   You: [Switch to test key, problem solved]
   ```

### Security Best Practices

1. **Use Restricted API Keys**
   ```bash
   # Create restricted key in Stripe Dashboard
   # Only enable required permissions:
   - Read: customers, subscriptions, invoices
   - Write: customers, subscriptions, checkout_sessions
   ```

2. **Enable Human Confirmation**
   - In Claude Code settings, require confirmation before MCP writes to Stripe
   - Review API calls before execution in production

3. **Monitor OAuth Sessions**
   - Check active sessions: Stripe Dashboard → Settings → MCP
   - Revoke unused sessions regularly
   - Each team member should use their own OAuth connection

4. **Environment Separation**
   ```bash
   # Development
   STRIPE_SECRET_KEY=sk_test_...  # Test mode, safe to experiment

   # Production
   STRIPE_SECRET_KEY=rk_live_...  # Restricted key, limited permissions
   ```

5. **Prompt Injection Prevention**
   - Don't expose MCP to user-facing AI (your nutrition coach AI)
   - Only use MCP during development/admin tasks
   - Never pass user input directly to MCP tools

### Limitations & Considerations

**What MCP Can Do:**
- ✅ Create/read/update Stripe resources (products, subscriptions, customers)
- ✅ Search documentation and support articles
- ✅ Debug webhook configurations
- ✅ Generate code with latest API patterns

**What MCP Cannot Do:**
- ❌ Access your database (you still need to write DB update logic)
- ❌ Deploy code (you still need to deploy webhook handlers)
- ❌ Test webhooks end-to-end (you need Stripe CLI for local testing)
- ❌ Handle payment disputes (requires manual review)

### Testing with Stripe MCP

**Verify MCP is working:**
```bash
# After adding MCP to Claude Code, try:
You: "List my Stripe products using MCP"
AI: [Should return your products or empty list if none exist]

You: "Search Stripe docs for 'subscription lifecycle'"
AI: [Should return relevant documentation links and summaries]
```

**Local Webhook Testing (Stripe CLI still needed):**
```bash
# MCP doesn't replace Stripe CLI for local webhook testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

### When to Use MCP vs Manual Implementation

**Use MCP for:**
- Creating test products/prices (fast iteration)
- Generating boilerplate API routes (checkout, webhooks)
- Debugging production issues (query live data)
- Searching docs during implementation
- Verifying webhook configurations

**Do Manually:**
- Complex business logic (MCP generates code, you customize)
- Database synchronization (MCP doesn't access your DB)
- Email sending (integrate with your email service)
- Analytics tracking (connect to your analytics platform)

### Estimated Time Savings with MCP

| Task | Without MCP | With MCP | Savings |
|------|-------------|----------|---------|
| Create products/prices | 30-60 min | 5 min | 85-90% |
| Checkout API route | 2-3 hours | 20-30 min | 85% |
| Webhook handler | 3-4 hours | 30-45 min | 85% |
| Debug webhook issues | 1-2 hours | 5-10 min | 90% |
| Customer portal setup | 1 hour | 10 min | 85% |
| **Total Phase 5** | **8-11 hours** | **1.5-2 hours** | **80%** |

**Expected total project time:**
- **Without MCP:** 40-60 hours
- **With MCP:** 32-50 hours (save 8-10 hours on Stripe integration)

### Support & Resources

- **Documentation:** https://docs.stripe.com/mcp
- **Feedback/Issues:** mcp@stripe.com
- **Stripe API Docs:** https://stripe.com/docs/api
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

### Next Steps with MCP

1. **Add MCP to Claude Code** (1 min)
   ```bash
   claude mcp add --transport http stripe https://mcp.stripe.com/
   ```

2. **Authorize via OAuth** (2 min)
   - Claude Code will prompt for authorization
   - Log in to your Stripe account
   - Grant permissions

3. **Test Connection** (1 min)
   ```
   You: "List my Stripe products"
   AI: [Should successfully query your Stripe account]
   ```

4. **Start Phase 5 Implementation** (with MCP assistance)
   - Create products: "Create monthly ($12) and annual ($99) products"
   - Generate checkout: "Generate Next.js checkout session API route"
   - Build webhook handler: "Generate webhook handler for subscription events"

**You'll know MCP is working when:**
- AI can list your Stripe products
- AI can search Stripe docs in real-time
- AI generates code using latest API patterns
- Debugging questions get specific answers based on your account

---

## 🎨 DESIGN SYSTEM PATTERNS

### Color Coding by Urgency:
```tsx
// Safe zone (green)
className="text-chart-2 bg-chart-2/10"

// Warning (yellow/amber)
className="text-amber-500 bg-amber-500/10"

// Urgent (orange)
className="text-orange-500 bg-orange-500/10"

// Critical (red)
className="text-destructive bg-destructive/10"
```

### Premium Gradient Styling:
```tsx
// Background
className="bg-gradient-to-br from-primary/5 to-chart-2/5"

// Text
className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent"

// Icon container
<div className="bg-gradient-to-br from-chart-2 to-chart-3">
  <Crown className="text-white" />
</div>
```

### Animation Patterns:
```tsx
// Entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// Pulse (urgency)
className="animate-pulse"

// Hover scale
className="hover:scale-105 transition-all duration-300"
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Cost Control & AI Limits (Priority 1)
- [ ] Update `app/api/ai/chat/route.ts` to enforce message limits
- [ ] Add message length validation (500 chars free, 2000 premium)
- [ ] Implement context window limits (4 messages free, 10 premium)
- [ ] Add rate limiting middleware (10/hour free, 30/hour premium)
- [ ] Create `useAIUsage` hook to fetch usage in real-time
- [ ] Test cost controls with heavy usage simulation

### Phase 2: Email Verification Flow (Priority 2)
- [ ] Update `SignupForm.tsx` to remove immediate verification requirement
- [ ] Set new users to `ai_messages_limit = 15` (unverified)
- [ ] Create `VerifyEmailPrompt.tsx` modal (triggers at 15/15)
- [ ] Update `verify-email/page.tsx` messaging ("unlock 35 more")
- [ ] Update `verified/page.tsx` celebration ("50 total messages!")
- [ ] On verification: Update `ai_messages_limit = 50` in DB

### Phase 3: Dashboard UI Components (Priority 3)
- [ ] Create `AIMessageCounter.tsx` with color-coded urgency
- [ ] Integrate counter into `AINutritionCoach.tsx` header
- [ ] Create `UpgradeTeaser.tsx` banner (40/45/49 message thresholds)
- [ ] Add banner to dashboard layout (sticky top position)
- [ ] Create `PremiumBadge.tsx` component
- [ ] Add badge to dashboard header for trial/premium users

### Phase 4: Paywall & Upgrade Flow (Priority 4)
- [ ] Create `PaywallModal.tsx` (triggers at 50/50 messages)
- [ ] Create `app/start-trial/page.tsx` trial activation page
- [ ] Update trial activation logic in backend:
  - Set `account_tier = 'trial'`
  - Set `trial_started_at = NOW()`
  - Set `trial_ends_at = NOW() + 7 days`
  - Reset `ai_messages_used = 0`
- [ ] Create `TrialBanner.tsx` with countdown
- [ ] Add trial banner to dashboard (days 1-7)

### Phase 5: Stripe Integration (Priority 5) - **USE MCP TO ACCELERATE**
- [ ] **Set up Stripe MCP** (3 min): `claude mcp add --transport http stripe https://mcp.stripe.com/`
- [ ] Set up Stripe account & get API keys
- [ ] **Create products using MCP** (5 min vs 30 min): Ask AI "Create Stripe products for monthly ($12) and annual ($99) plans"
- [ ] Create `app/api/stripe/create-checkout-session/route.ts` (AI + MCP generates with latest patterns)
- [ ] Create `app/api/stripe/webhook/route.ts` (AI + MCP generates with proper verification)
- [ ] Create `app/api/stripe/customer-portal/route.ts` (AI + MCP generates redirect logic)
- [ ] Test webhook locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] **Use MCP to debug** if webhooks fail: "Why isn't my webhook receiving events?"
- [ ] Deploy webhook endpoint & register in Stripe Dashboard

### Phase 6: Payment Flow Pages (Priority 6)
- [ ] Create `AddPaymentModal.tsx` (day 5+ trial)
- [ ] Create `app/payment/success/page.tsx` with celebration
- [ ] Create `app/payment/cancelled/page.tsx`
- [ ] Add confetti animation to success page (framer-motion)
- [ ] Test full payment flow end-to-end

### Phase 7: Subscription Management (Priority 7)
- [ ] Create `SubscriptionSection.tsx` for settings page
- [ ] Add to `app/settings/page.tsx`
- [ ] Create `CancelSubscriptionModal.tsx` retention modal
- [ ] Create `app/api/subscription/status/route.ts`
- [ ] Enable Stripe Customer Portal in Stripe Dashboard
- [ ] Test billing portal redirect flow

### Phase 8: Premium Features (Priority 8)
- [ ] Update `AIMessageCounter` to show "Unlimited" for premium
- [ ] Unlock custom macro goals for premium users
- [ ] Unlock data export for premium users
- [ ] Add "Priority Support" badge to support emails
- [ ] Test premium feature gates

### Phase 9: Landing Page Updates (Priority 9)
- [ ] Create `PricingComparison.tsx` component
- [ ] Update `Pricing.tsx` to show two-tier model
- [ ] Add to landing page
- [ ] Update hero messaging to mention free tier
- [ ] A/B test messaging variants

### Phase 10: Analytics & Monitoring (Priority 10)
- [ ] Add analytics events:
  - `signup_completed`
  - `email_verified`
  - `ai_limit_reached`
  - `trial_started`
  - `payment_added`
  - `subscription_created`
  - `subscription_cancelled`
- [ ] Create admin dashboard for monitoring:
  - Free user AI usage stats
  - Trial conversion rates
  - Churn analysis
  - Revenue metrics
- [ ] Set up alerts for:
  - High AI usage users (>500 msgs/month)
  - Failed payments
  - High churn rate

### Phase 11: Email Automation (Priority 11)
- [ ] Set up email service (Resend, SendGrid, or Postmark)
- [ ] Create email templates:
  - Welcome email (after signup)
  - Email verification reminder (24hr after signup)
  - Trial started confirmation
  - Trial ending soon (day 5)
  - Trial ended (downgrade to free)
  - Payment receipt
  - Subscription cancelled confirmation
  - Win-back email (7 days after churn)
- [ ] Implement email sending in webhook handlers

### Phase 12: Testing & QA (Priority 12)
- [ ] Test full user journey (free → trial → paid)
- [ ] Test edge cases:
  - User cancels during trial
  - Payment fails after trial
  - User hits AI limit exactly
  - User tries to bypass limits (multiple accounts)
- [ ] Load test AI endpoint with rate limiting
- [ ] Test Stripe webhook handling (use Stripe CLI)
- [ ] Test mobile responsiveness of all new components
- [ ] Accessibility audit (ARIA labels, keyboard nav)

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Cost Control is Non-Negotiable**
   - Free tier MUST stay under $0.15/user/month
   - Monitor AI usage daily in first 2 weeks
   - Set up alerts for users exceeding 100 messages/month

2. **Conversion Funnel Tracking**
   - Track every step of funnel with analytics
   - A/B test messaging at each stage
   - Iterate based on drop-off points

3. **Stripe Integration Must Be Bulletproof**
   - Test webhook handling thoroughly
   - Handle edge cases (failed payments, refunds)
   - Never charge without explicit user consent

4. **User Experience is Key**
   - No dark patterns or surprise charges
   - Clear messaging at every step
   - Make cancellation easy (builds trust)

5. **Data Privacy & Security**
   - Never store credit card details (Stripe handles this)
   - Encrypt sensitive user data
   - GDPR compliance (data export, deletion)

---

## 📈 SUCCESS METRICS

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

## 🎯 POST-LAUNCH OPTIMIZATIONS

### Quick Wins (Week 1-4):
1. A/B test paywall modal messaging
2. Test monthly vs annual pricing emphasis
3. Optimize trial length (7 days vs 14 days)
4. Add social proof (user testimonials, stats)

### Medium-Term (Month 2-3):
1. Add referral program (give 1 month free for referrals)
2. Implement win-back campaigns for churned users
3. Add usage-based upsells (buy extra messages for $2/50)
4. Create "power user" tier ($20/mo for truly unlimited)

### Long-Term (Month 4+):
1. Build premium features:
   - AI meal planning
   - Recipe analyzer
   - Barcode scanning (mobile app)
   - Apple Health / Fitbit integrations
2. Launch affiliate program for fitness coaches
3. Create white-label offering for gyms/coaches
4. Explore B2B opportunities (corporate wellness)

---

## 💡 OPEN QUESTIONS & DECISIONS

1. **Annual Plan Discount:** Confirmed $99/year (save $45) ✅
2. **Trial Structure:** 7 days, no card required, payment prompt day 5 ✅
3. **Fair Use Hard Cap:** Never hard-cap, just monitor and reach out ✅
4. **Email Verification Timing:** Two-stage (15 msgs → verify → 35 more) ✅
5. **Rate Limiting Visibility:** Soft limits, friendly cooldown messages ✅

---

## 📚 REFERENCES & RESOURCES

### Stripe Integration
- **Stripe MCP Server:** https://docs.stripe.com/mcp ⭐ (Use this to accelerate Phase 5!)
- Stripe API Documentation: https://stripe.com/docs
- Stripe Webhooks Guide: https://stripe.com/docs/webhooks
- Stripe Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Stripe Testing: https://stripe.com/docs/testing

### AI & Backend
- Claude AI Pricing: https://www.anthropic.com/pricing
- Supabase Auth: https://supabase.com/docs/guides/auth
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

### Frontend & UI
- Framer Motion: https://www.framer.com/motion/
- shadcn/ui: https://ui.shadcn.com/
- Recharts: https://recharts.org/
- Lucide Icons: https://lucide.dev/

---

## 🚀 NEXT STEPS

1. **Review this document** and confirm all decisions ✅
2. **Set up Stripe MCP** (3 minutes):
   ```bash
   claude mcp add --transport http stripe https://mcp.stripe.com/
   ```
3. **Set up Stripe account** and get API keys (test mode first)
4. **Start with Phase 1** (Cost Control & AI Limits) - most critical for margins
5. **Use MCP for Phase 5** (Stripe Integration) - save 8-10 hours
6. Build incrementally, test each phase before moving on
7. Launch with Free + Premium tiers
8. Monitor metrics closely in first 2 weeks
9. Iterate based on user behavior and conversion data

**Estimated Implementation Time:**
- Without MCP: 40-60 hours total
- **With MCP: 32-50 hours** (save 8-10 hours on Stripe integration) ⚡

**Launch Target:** Aim for MVP in 2-3 weeks (working part-time)

---

*Generated with Claude Code - For Siphio Macro Tracker Subscription System*
