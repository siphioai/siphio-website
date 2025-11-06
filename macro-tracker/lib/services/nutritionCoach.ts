/**
 * API client for AI Nutrition Coach
 * Handles communication with Next.js API route
 */

import { ChatResponse } from '@/types/chat';

/**
 * Send a chat message to the AI nutrition coach
 *
 * @param message - User's message to the coach
 * @param conversationHistory - Previous conversation messages in Pydantic AI format
 * @returns Promise with AI response, updated conversation history, and token usage
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: any[] = []
): Promise<ChatResponse> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get AI response' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
