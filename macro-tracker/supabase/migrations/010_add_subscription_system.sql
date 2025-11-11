-- ============================================
-- Payment & Subscription System Migration
-- ============================================
-- This migration adds the complete subscription system including:
-- 1. Email verification fields
-- 2. Account tier and AI usage tracking
-- 3. Stripe subscription management
-- 4. Abuse prevention (deleted accounts cooldown)
-- 5. AI usage cost monitoring

-- ============================================
-- 1. Extend users table with subscription fields
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'free' CHECK (account_tier IN ('free', 'trial', 'premium')),
ADD COLUMN IF NOT EXISTS ai_messages_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_messages_limit INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at) WHERE email_verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_account_tier ON users(account_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add comment
COMMENT ON COLUMN users.email_verified_at IS 'When the user verified their email address';
COMMENT ON COLUMN users.account_tier IS 'User account tier: free (20 AI messages), trial (7 days unlimited), premium (unlimited)';
COMMENT ON COLUMN users.ai_messages_used IS 'Number of AI messages used (resets to 0 when upgrading to trial/premium)';
COMMENT ON COLUMN users.ai_messages_limit IS 'AI message limit for free tier (default 20)';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.trial_started_at IS 'When the user started their trial';
COMMENT ON COLUMN users.trial_ends_at IS 'When the user trial ends (auto-charge after this date)';
COMMENT ON COLUMN users.subscription_status IS 'Current Stripe subscription status';
COMMENT ON COLUMN users.subscription_current_period_end IS 'When the current billing period ends';

-- ============================================
-- 2. Create subscriptions table (mirror Stripe data)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add comment
COMMENT ON TABLE subscriptions IS 'Mirrors Stripe subscription data for fast lookups';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID (price_xxx)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';

-- ============================================
-- 3. Create deleted_accounts table (7-day cooldown)
-- ============================================

CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  can_recreate_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON deleted_accounts(email);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_can_recreate_at ON deleted_accounts(can_recreate_at);

-- Add comment
COMMENT ON TABLE deleted_accounts IS 'Tracks deleted accounts to enforce 7-day cooldown before re-signup';
COMMENT ON COLUMN deleted_accounts.can_recreate_at IS 'Date when this email can be used to create a new account';

-- ============================================
-- 4. Create ai_usage_log table (cost monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 1,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'claude-3-5-haiku-20241022',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_created ON ai_usage_log(user_id, created_at DESC);

-- Add comment
COMMENT ON TABLE ai_usage_log IS 'Logs AI chat usage for cost monitoring and analytics';
COMMENT ON COLUMN ai_usage_log.message_count IS 'Number of messages in this interaction (usually 1)';
COMMENT ON COLUMN ai_usage_log.input_tokens IS 'Number of input tokens used';
COMMENT ON COLUMN ai_usage_log.output_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN ai_usage_log.estimated_cost_usd IS 'Estimated cost in USD (Haiku 3.5: $0.80/$4.00 per million tokens)';
COMMENT ON COLUMN ai_usage_log.model_name IS 'Claude model used for this interaction';

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = subscriptions.user_id));

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Deleted accounts policies (service role only)
CREATE POLICY "Service role can manage deleted accounts"
  ON deleted_accounts FOR ALL
  USING (auth.role() = 'service_role');

-- AI usage log policies
CREATE POLICY "Users can view their own AI usage"
  ON ai_usage_log FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = ai_usage_log.user_id));

CREATE POLICY "Service role can manage all AI usage logs"
  ON ai_usage_log FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to check if email is in cooldown period
CREATE OR REPLACE FUNCTION is_email_in_cooldown(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM deleted_accounts
    WHERE email = email_address
    AND can_recreate_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_email_in_cooldown IS 'Check if email is in 7-day cooldown after account deletion';

-- Function to get user AI usage stats
CREATE OR REPLACE FUNCTION get_user_ai_usage_stats(p_user_id UUID)
RETURNS TABLE (
  total_messages INTEGER,
  total_cost_usd DECIMAL,
  messages_this_month INTEGER,
  cost_this_month_usd DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_messages,
    COALESCE(SUM(estimated_cost_usd), 0) as total_cost_usd,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::INTEGER as messages_this_month,
    COALESCE(SUM(estimated_cost_usd) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) as cost_this_month_usd
  FROM ai_usage_log
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_ai_usage_stats IS 'Get AI usage statistics for a user (total and monthly)';

-- Function to check if user can send AI message
CREATE OR REPLACE FUNCTION can_user_send_ai_message(p_user_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  messages_remaining INTEGER
) AS $$
DECLARE
  v_account_tier TEXT;
  v_ai_messages_used INTEGER;
  v_ai_messages_limit INTEGER;
  v_subscription_status TEXT;
  v_email_verified_at TIMESTAMPTZ;
BEGIN
  -- Get user details
  SELECT
    account_tier,
    ai_messages_used,
    ai_messages_limit,
    subscription_status,
    email_verified_at
  INTO
    v_account_tier,
    v_ai_messages_used,
    v_ai_messages_limit,
    v_subscription_status,
    v_email_verified_at
  FROM users
  WHERE id = p_user_id;

  -- Check if email is verified
  IF v_email_verified_at IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Email not verified', 0;
    RETURN;
  END IF;

  -- Premium and trial users have unlimited messages
  IF v_account_tier IN ('premium', 'trial') AND v_subscription_status = 'active' THEN
    RETURN QUERY SELECT TRUE, 'Unlimited messages', -1;
    RETURN;
  END IF;

  -- Free tier users have message limits
  IF v_account_tier = 'free' THEN
    IF v_ai_messages_used >= v_ai_messages_limit THEN
      RETURN QUERY SELECT FALSE, 'Message limit reached', 0;
      RETURN;
    ELSE
      RETURN QUERY SELECT TRUE, 'Free tier', (v_ai_messages_limit - v_ai_messages_used);
      RETURN;
    END IF;
  END IF;

  -- Default: cannot send
  RETURN QUERY SELECT FALSE, 'Unknown account status', 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_user_send_ai_message IS 'Check if user can send an AI message based on tier and limits';

-- Function to increment AI message usage
CREATE OR REPLACE FUNCTION increment_ai_message_usage(
  p_user_id UUID,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_model_name TEXT DEFAULT 'claude-3-5-haiku-20241022'
)
RETURNS VOID AS $$
DECLARE
  v_cost_usd DECIMAL(10, 6);
BEGIN
  -- Calculate cost (Haiku 3.5: $0.80 input / $4.00 output per million tokens)
  v_cost_usd := (p_input_tokens * 0.80 / 1000000.0) + (p_output_tokens * 4.00 / 1000000.0);

  -- Increment message count in users table
  UPDATE users
  SET ai_messages_used = ai_messages_used + 1
  WHERE id = p_user_id;

  -- Log usage
  INSERT INTO ai_usage_log (user_id, input_tokens, output_tokens, estimated_cost_usd, model_name)
  VALUES (p_user_id, p_input_tokens, p_output_tokens, v_cost_usd, p_model_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_ai_message_usage IS 'Increment user AI message count and log usage with cost';

-- ============================================
-- 7. Data Integrity & Cleanup
-- ============================================

-- Cleanup old deleted_accounts records (older than can_recreate_at)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_accounts()
RETURNS void AS $$
BEGIN
  DELETE FROM deleted_accounts
  WHERE can_recreate_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_deleted_accounts IS 'Cleanup deleted_accounts records older than 30 days past cooldown';

-- ============================================
-- 8. Grants (ensure service role has access)
-- ============================================

GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON deleted_accounts TO service_role;
GRANT ALL ON ai_usage_log TO service_role;

GRANT EXECUTE ON FUNCTION is_email_in_cooldown TO service_role;
GRANT EXECUTE ON FUNCTION get_user_ai_usage_stats TO service_role;
GRANT EXECUTE ON FUNCTION can_user_send_ai_message TO service_role;
GRANT EXECUTE ON FUNCTION increment_ai_message_usage TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_deleted_accounts TO service_role;

-- ============================================
-- Migration Complete
-- ============================================

-- Add migration metadata
DO $$
BEGIN
  RAISE NOTICE 'Subscription system migration completed successfully';
  RAISE NOTICE 'New tables: subscriptions, deleted_accounts, ai_usage_log';
  RAISE NOTICE 'Extended users table with 10 new subscription-related columns';
  RAISE NOTICE 'Created 5 helper functions for subscription management';
  RAISE NOTICE 'RLS policies enabled for all new tables';
END $$;
