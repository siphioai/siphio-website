/**
 * Next.js API Route for AI Nutrition Coach
 * Handles authentication, rate limiting, usage tracking, and proxies to Python backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/rate-limiter';

// CRITICAL: Initialize rate limiters OUTSIDE handler to maintain state
// Free tier: 10 messages per hour
const freeLimiter = new RateLimiter({ window: 3600, max: 10 });
// Premium/Trial tier: 30 messages per hour
const premiumLimiter = new RateLimiter({ window: 3600, max: 30 });

// Message length limits to control token costs
const MESSAGE_LIMITS = {
  free: 500,      // ~400 tokens
  premium: 2000,  // ~1600 tokens
};

// Context window limits to prevent runaway costs
const CONTEXT_LIMITS = {
  free: {
    max_history_messages: 4,     // Only last 2 exchanges
  },
  premium: {
    max_history_messages: 10,    // Last 5 exchanges
  },
};

export async function POST(request: NextRequest) {
  try {
    // 1. Get Supabase client
    const supabase = await createServerSupabaseClient();

    // 2. Check authentication and get session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to use the AI coach' },
        { status: 401 }
      );
    }

    // 3. Get session for access token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session', message: 'Please sign in again' },
        { status: 401 }
      );
    }

    // 4. Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, account_tier, ai_messages_used, ai_messages_limit, email_verified_at')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found', message: 'Unable to find user account' },
        { status: 404 }
      );
    }

    // 5. Check email verification
    if (!userData.email_verified_at) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          message: 'Please verify your email to use the AI coach',
          emailVerificationRequired: true,
        },
        { status: 403 }
      );
    }

    // 6. Check rate limit
    const limiter = userData.account_tier === 'premium' || userData.account_tier === 'trial'
      ? premiumLimiter
      : freeLimiter;

    if (!limiter.check(userData.id)) {
      const status = limiter.getStatus(userData.id);
      const minutesUntilReset = Math.ceil((status.resetAt - Date.now()) / 60000);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You've sent too many messages. Please wait ${minutesUntilReset} minutes.`,
          rateLimitExceeded: true,
        },
        { status: 429 }
      );
    }

    // 7. Check message limit (free tier only)
    if (userData.account_tier === 'free') {
      if (userData.ai_messages_used >= userData.ai_messages_limit) {
        return NextResponse.json(
          {
            error: 'Message limit reached',
            message: 'You have reached your monthly message limit. Upgrade to Premium for unlimited messages.',
            upgradeRequired: true,
            messagesUsed: userData.ai_messages_used,
            messagesLimit: userData.ai_messages_limit,
          },
          { status: 403 }
        );
      }
    }

    // 8. Parse request body
    const body = await request.json();
    const { message, conversation_history = [] } = body;

    // 9. Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid message', message: 'Message is required and must not be empty' },
        { status: 400 }
      );
    }

    // 10. Validate message length
    const maxLength = userData.account_tier === 'premium' || userData.account_tier === 'trial'
      ? MESSAGE_LIMITS.premium
      : MESSAGE_LIMITS.free;

    if (message.length > maxLength) {
      return NextResponse.json(
        {
          error: 'Message too long',
          message: `Maximum ${maxLength} characters for your plan. ${
            userData.account_tier === 'free'
              ? 'Upgrade to Premium for longer messages.'
              : ''
          }`,
        },
        { status: 400 }
      );
    }

    // 11. Trim conversation history to control costs
    const maxHistory = userData.account_tier === 'premium' || userData.account_tier === 'trial'
      ? CONTEXT_LIMITS.premium.max_history_messages
      : CONTEXT_LIMITS.free.max_history_messages;

    const trimmedHistory = conversation_history.slice(-maxHistory);

    // 12. Call Python backend
    const pythonUrl = process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:8000'
      : process.env.PYTHON_API_URL;

    if (!pythonUrl) {
      console.error('Python API URL not configured');
      return NextResponse.json(
        { error: 'Configuration error', message: 'Backend service not configured' },
        { status: 500 }
      );
    }

    const pythonResponse = await fetch(`${pythonUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
        conversation_history: trimmedHistory,
      }),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python API error:', errorText);
      return NextResponse.json(
        { error: 'Backend error', message: 'Failed to get response from AI coach' },
        { status: pythonResponse.status }
      );
    }

    const data = await pythonResponse.json();

    // 13. Track usage (increment message count + log tokens/cost)
    // Only track for successful responses
    if (data.usage && data.usage.input_tokens && data.usage.output_tokens) {
      try {
        await supabase.rpc('increment_ai_message_usage', {
          p_user_id: userData.id,
          p_input_tokens: data.usage.input_tokens,
          p_output_tokens: data.usage.output_tokens,
          p_model_name: data.model || 'claude-3-5-haiku-20241022',
        });
      } catch (usageError) {
        // Log error but don't fail the request
        console.error('Failed to track AI usage:', usageError);
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
