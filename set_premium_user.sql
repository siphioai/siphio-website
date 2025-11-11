-- ============================================
-- Set hugemarley1@gmail.com to Premium
-- ============================================

-- Update user to premium tier
UPDATE users
SET
  account_tier = 'premium',
  subscription_status = 'active',
  ai_messages_used = 0,  -- Reset usage
  ai_messages_limit = -1,  -- -1 = unlimited
  email_verified_at = COALESCE(email_verified_at, NOW()),  -- Verify email if not already
  trial_started_at = NULL,  -- Clear trial dates
  trial_ends_at = NULL,
  subscription_current_period_end = NOW() + INTERVAL '1 month',  -- Next billing in 30 days
  stripe_customer_id = 'demo_customer_hugemarley1',  -- Demo customer ID
  updated_at = NOW()
WHERE email = 'hugemarley1@gmail.com';

-- Verify the update
SELECT
  email,
  account_tier,
  subscription_status,
  ai_messages_used,
  ai_messages_limit,
  email_verified_at,
  subscription_current_period_end,
  stripe_customer_id
FROM users
WHERE email = 'hugemarley1@gmail.com';
