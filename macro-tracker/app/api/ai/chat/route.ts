/**
 * Next.js API Route for AI Nutrition Coach
 * Handles authentication and proxies requests to Python backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Get Supabase client
    const supabase = await createServerSupabaseClient();

    // 2. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to use the AI coach' },
        { status: 401 }
      );
    }

    // 3. Get user_id from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found', message: 'Could not find your user profile' },
        { status: 404 }
      );
    }

    const userId = (profile as any).id;

    // 4. Parse request body
    const body = await request.json();
    const { message, conversation_history = [] } = body;

    // 5. Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid message', message: 'Message is required and must not be empty' },
        { status: 400 }
      );
    }

    // 6. Call Python backend
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
      },
      body: JSON.stringify({
        user_id: userId,
        message: message.trim(),
        conversation_history,
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
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
