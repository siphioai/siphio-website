# Payment & Subscription System - Setup Guide

## Implementation Summary

The complete freemium-to-paid subscription system has been implemented with:

✅ **Phase 1: AI Cost Control & Usage Limits**
- Rate limiting (10/hour free, 30/hour premium)
- Message length limits (500 chars free, 2000 premium)
- Context window limits (4 messages free, 10 premium)
- Usage tracking with token counting and cost calculation

✅ **Phase 2: Email Verification Flow**
- Verify email prompt at 15/15 messages
- Reward: Unlock 35 more messages (50 total)
- Updated verified page with celebration

✅ **Phase 3: Dashboard UI Components**
- AIMessageCounter with color-coded urgency
- UpgradeTeaser banner (progressive urgency)
- PremiumBadge component
- TrialBanner with countdown

✅ **Phase 4: Paywall & Upgrade Flow**
- PaywallModal at 50/50 messages
- Start trial page with 7-day activation
- Trial status tracking hook

✅ **Phase 5: Stripe Integration**
- Checkout session API route
- Webhook handler (5 events)
- Customer portal integration
- Stripe client utilities

✅ **Phase 6: Payment Flow Pages**
- Payment success page with confetti
- Payment cancelled page
- AddPaymentModal for trial users

✅ **Phase 7: Subscription Management**
- SubscriptionSection for settings
- Subscription status API
- useSubscription hook
- Cancel subscription flow

---

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_ for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create products first)
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # Required for webhook handler

# Python API (already configured)
PYTHON_API_URL=http://127.0.0.1:8000 # Development
# PYTHON_API_URL=https://your-api.com # Production
```

---

## Setup Steps

### 1. Set Up Stripe Account

```bash
# 1. Sign up at https://stripe.com
# 2. Get API keys from Dashboard → Developers → API keys
# 3. Copy Test mode keys to .env.local
```

### 2. Create Stripe Products

**Option A: Using Stripe Dashboard**
1. Go to Products → Add Product
2. Create two products:
   - **Monthly Premium**: $12/month recurring
   - **Annual Premium**: $99/year recurring
3. Copy Price IDs to `.env.local`

**Option B: Using Stripe MCP (Recommended)**
```bash
# Install Stripe MCP
claude mcp add --transport http stripe https://mcp.stripe.com/

# Then ask Claude to create products:
# "Create two Stripe products:
# - Monthly Premium: $12/month
# - Annual Premium: $99/year"
```

### 3. Set Up Stripe Webhook

**Development (Local Testing)**
```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Copy webhook signing secret to .env.local
```

**Production**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to production environment variables

### 4. Configure Stripe Customer Portal

1. Go to Settings → Customer Portal
2. Enable features:
   - Update payment method
   - Cancel subscription
   - View billing history
3. Customize branding and messaging

### 5. Database Migration

The database migration `010_add_subscription_system.sql` has already been applied. Verify these exist:

```sql
-- Check users table has subscription fields
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN (
  'account_tier', 'ai_messages_used', 'ai_messages_limit',
  'stripe_customer_id', 'trial_started_at', 'trial_ends_at'
);

-- Check subscriptions table exists
SELECT * FROM subscriptions LIMIT 1;

-- Check AI usage log table exists
SELECT * FROM ai_usage_log LIMIT 1;
```

### 6. Test Stripe Integration

```bash
# Start development server
npm run dev

# Test checkout with test card
# Card number: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

---

## User Journey Testing Checklist

### Free Tier (0-15 messages)
- [ ] New signup gives 15 messages
- [ ] AI chat works for first 15 messages
- [ ] Rate limiting works (10/hour max)
- [ ] Message length limited to 500 chars
- [ ] At 15/15 messages, VerifyEmailPrompt appears

### Email Verification (15-50 messages)
- [ ] VerifyEmailPrompt modal triggers at 15/15
- [ ] Email verification link works
- [ ] Verified page shows celebration
- [ ] Database updates: `ai_messages_limit = 50`
- [ ] Can send messages 16-50

### Approaching Limit (40-50 messages)
- [ ] At 40/50: Yellow UpgradeTeaser banner appears
- [ ] At 45/50: Orange banner with urgency
- [ ] At 49/50: Red pulsing banner
- [ ] AIMessageCounter changes colors accordingly

### Paywall (50/50 messages)
- [ ] PaywallModal appears at 50/50 messages
- [ ] Shows user stats (streak, meals, conversations)
- [ ] "Start 7-Day Free Trial" button works
- [ ] "Maybe Later" closes modal but blocks messages

### Trial Activation
- [ ] /start-trial page shows benefits
- [ ] "Activate Free Trial" button works
- [ ] Database updates:
  - `account_tier = 'trial'`
  - `trial_started_at = NOW()`
  - `trial_ends_at = NOW() + 7 days`
  - `ai_messages_used = 0`
- [ ] Dashboard shows "⚡ Trial (7 days left)" badge
- [ ] Unlimited AI messages work

### Trial Period (Days 1-7)
- [ ] Day 1-3: Green TrialBanner "X days left"
- [ ] Day 4-5: Yellow banner "Add payment to continue"
- [ ] Day 6-7: Orange pulsing banner "Last day!"
- [ ] AddPaymentModal opens from banner

### Payment Flow
- [ ] AddPaymentModal shows plan selection
- [ ] Monthly ($12) and Annual ($99) options
- [ ] "Continue to Payment" redirects to Stripe
- [ ] Test card (4242...) completes checkout
- [ ] Redirected to /payment/success with confetti
- [ ] Database updates:
  - `account_tier = 'premium'`
  - `subscription_status = 'active'`
  - `stripe_customer_id` set
- [ ] Subscription record created in `subscriptions` table

### Premium User
- [ ] Dashboard shows "👑 Premium" badge
- [ ] AIMessageCounter shows "Unlimited ♾️"
- [ ] Settings shows subscription details
- [ ] "Manage Subscription" opens Customer Portal
- [ ] Can update payment method in portal
- [ ] Can cancel subscription (with confirmation)

### Subscription Cancellation
- [ ] Cancel confirmation dialog shows what user loses
- [ ] "Keep Premium" closes dialog
- [ ] "Cancel Subscription" opens portal
- [ ] Completing cancellation in portal triggers webhook
- [ ] Database updates: `subscription_status = 'canceled'`
- [ ] User remains premium until period end
- [ ] After period end: Downgrade to free tier

### Webhook Testing
- [ ] `checkout.session.completed` creates subscription
- [ ] `customer.subscription.updated` updates DB
- [ ] `customer.subscription.deleted` downgrades user
- [ ] `invoice.payment_succeeded` confirms payment
- [ ] `invoice.payment_failed` marks as past_due

---

## Integration Points

### Frontend Components to Update

To integrate the subscription system into your app:

1. **Dashboard/Home Page**
```tsx
import { useAIUsage } from '@/lib/hooks/useAIUsage';
import { useTrialStatus } from '@/lib/hooks/useTrialStatus';
import { UpgradeTeaser } from '@/components/subscription/UpgradeTeaser';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';

// In your component
const { usage } = useAIUsage();
const { trialStatus } = useTrialStatus();

// Show appropriate banner
{usage && usage.accountTier === 'free' && usage.messagesUsed >= 40 && (
  <UpgradeTeaser
    messagesUsed={usage.messagesUsed}
    messagesLimit={usage.messagesLimit}
    onUpgrade={() => setShowPaywall(true)}
  />
)}

{trialStatus?.isOnTrial && (
  <TrialBanner
    daysRemaining={trialStatus.daysRemaining}
    onAddPayment={() => setShowAddPayment(true)}
  />
)}
```

2. **AI Nutrition Coach Component**
```tsx
import { useAIUsage } from '@/lib/hooks/useAIUsage';
import { AIMessageCounter } from '@/components/subscription/AIMessageCounter';
import { VerifyEmailPrompt } from '@/components/subscription/VerifyEmailPrompt';
import { PaywallModal } from '@/components/subscription/PaywallModal';

// In your component
const { usage } = useAIUsage();

// Show counter in header
<AIMessageCounter
  messagesUsed={usage.messagesUsed}
  messagesLimit={usage.messagesLimit}
  accountTier={usage.accountTier}
/>

// Show verify email prompt at 15/15
{usage.messagesUsed === 15 && !usage.emailVerified && (
  <VerifyEmailPrompt open={true} onOpenChange={() => {}} />
)}

// Show paywall at 50/50
{usage.messagesUsed >= usage.messagesLimit && usage.accountTier === 'free' && (
  <PaywallModal open={true} onOpenChange={() => {}} />
)}
```

3. **Settings Page**
```tsx
import { SubscriptionSection } from '@/components/settings/SubscriptionSection';

// Add to your settings page
<SubscriptionSection />
```

### API Routes Already Created

All API routes are implemented:
- ✅ `/api/ai/usage` - Get AI usage stats
- ✅ `/api/ai/chat` - Send AI message (with limits)
- ✅ `/api/subscription/status` - Get subscription details
- ✅ `/api/stripe/create-checkout-session` - Create checkout
- ✅ `/api/stripe/webhook` - Handle Stripe events
- ✅ `/api/stripe/customer-portal` - Open portal

---

## Cost Monitoring

The system tracks costs automatically:

```sql
-- View total AI costs
SELECT
  SUM(estimated_cost_usd) as total_cost,
  COUNT(*) as total_messages
FROM ai_usage_log;

-- View costs by user
SELECT
  u.email,
  u.account_tier,
  COUNT(aul.id) as messages,
  SUM(aul.estimated_cost_usd) as total_cost
FROM users u
LEFT JOIN ai_usage_log aul ON aul.user_id = u.id
GROUP BY u.id, u.email, u.account_tier
ORDER BY total_cost DESC;

-- View average cost per user by tier
SELECT
  u.account_tier,
  COUNT(DISTINCT u.id) as users,
  AVG(monthly_messages) as avg_messages,
  AVG(monthly_cost) as avg_cost_per_user
FROM users u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as monthly_messages,
    SUM(estimated_cost_usd) as monthly_cost
  FROM ai_usage_log
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
) stats ON stats.user_id = u.id
GROUP BY u.account_tier;
```

**Target Metrics:**
- Free tier: < $0.15/user/month average
- Alert if any user > 500 messages/month
- Premium fair use cap: 1,000 messages/month

---

## Troubleshooting

### Webhook Not Receiving Events
```bash
# Check webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET

# Test locally with Stripe CLI
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Check webhook logs in Stripe Dashboard
# Dashboard → Developers → Webhooks → [Your webhook] → Attempts
```

### Database Not Updating
```bash
# Check Supabase service role key is set
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify webhook can connect to Supabase
# Check Supabase logs in dashboard

# Test database function manually
SELECT can_user_send_ai_message('user-id-here');
```

### Rate Limiting Not Working
```javascript
// Rate limiters must be initialized OUTSIDE handler
// ❌ WRONG:
export async function POST(req) {
  const limiter = new RateLimiter({ window: 3600, max: 10 });
  // ...
}

// ✅ CORRECT:
const limiter = new RateLimiter({ window: 3600, max: 10 });
export async function POST(req) {
  // ...
}
```

---

## Production Deployment Checklist

- [ ] Switch to Stripe live mode keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure production webhook events
- [ ] Set up Stripe Customer Portal branding
- [ ] Test complete user journey in production
- [ ] Set up cost monitoring alerts
- [ ] Configure email notifications (optional)
- [ ] Test payment flows with real cards
- [ ] Verify webhook signature validation works
- [ ] Check database RLS policies allow service role

---

## Next Steps (Optional Enhancements)

### Email Automation
- Welcome emails on signup
- Trial ending reminders
- Payment receipts
- Win-back campaigns for churned users

### Analytics
- Track conversion funnel
- Monitor MRR and churn rate
- A/B test pricing and messaging
- User engagement metrics

### Premium Features
- Custom macro goal calculations
- Advanced nutrition analytics
- CSV data export functionality
- Priority AI response times

---

## Support

If you encounter issues:

1. Check Stripe webhook logs
2. Review Supabase logs
3. Test with Stripe test mode
4. Verify environment variables
5. Check database migration applied

**Resources:**
- Stripe Docs: https://stripe.com/docs
- Stripe MCP: https://docs.stripe.com/mcp
- Supabase Functions: https://supabase.com/docs/guides/database/functions
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction
