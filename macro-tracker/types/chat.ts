/**
 * TypeScript types for AI Nutrition Coach chat functionality
 */

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
  conversation_history: any[];  // Pydantic AI format - preserve exact structure
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
