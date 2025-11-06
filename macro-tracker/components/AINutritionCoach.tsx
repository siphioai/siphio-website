'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRealtimeMacros } from '@/lib/hooks/useRealtimeMacros';
import { sendChatMessage } from '@/lib/services/nutritionCoach';
import { ChatMessage, QuickAction } from '@/types/chat';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  BarChart,
  Brain,
  BookOpen,
  Target,
  Flame,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';

// Quick actions for users with logged data
const dataQuickActions: QuickAction[] = [
  {
    label: "Today's Progress",
    message: "How am I doing today?",
    icon: TrendingUp,
  },
  {
    label: "Weekly Trends",
    message: "How was my week?",
    icon: BarChart,
  },
  {
    label: "Patterns",
    message: "What are my eating patterns?",
    icon: Brain,
  },
];

// Quick actions for new users (educational)
const educationalQuickActions: QuickAction[] = [
  {
    label: "Learn About Macros",
    message: "Explain macros to me",
    icon: BookOpen,
  },
  {
    label: "Tracking Tips",
    message: "How should I track my food?",
    icon: Target,
  },
  {
    label: "Goal Setting",
    message: "How do I set good macro goals?",
    icon: Flame,
  },
];

interface AINutritionCoachProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AINutritionCoach({ open, onOpenChange }: AINutritionCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { current } = useRealtimeMacros();

  // Load conversation from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      const saved = sessionStorage.getItem('ai-coach-conversation');
      if (saved) {
        try {
          const { messages: savedMessages, history } = JSON.parse(saved);
          setMessages(savedMessages);
          setConversationHistory(history);
        } catch (e) {
          console.error('Failed to load conversation from sessionStorage:', e);
        }
      }
    }
  }, [open]);

  // Save conversation to sessionStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      sessionStorage.setItem(
        'ai-coach-conversation',
        JSON.stringify({
          messages,
          history: conversationHistory,
        })
      );
    }
  }, [messages, conversationHistory]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (open && !loading && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [open, loading, messages.length]);

  // Determine quick actions based on user data
  const hasData = current.calories > 0 || current.protein > 0;
  const quickActions = hasData ? dataQuickActions : educationalQuickActions;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    // Optimistic UI update
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(textToSend, conversationHistory);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setConversationHistory(response.conversation_history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
      setConversationHistory([]);
      setError(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ai-coach-conversation');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col',
          'fixed top-4 right-4 bottom-4 left-auto',
          'h-auto w-full sm:w-[500px] md:w-[600px]',
          '!translate-x-0 !translate-y-0',
          'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
          'rounded-2xl',
          'p-0 gap-0 max-w-none',
          'shadow-2xl border-2 border-primary/20'
        )}
      >
        {/* Enhanced Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-background to-secondary/30 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-md animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  AI Nutrition Coach
                  <span className="text-xs font-normal text-muted-foreground bg-chart-2/20 px-2 py-0.5 rounded-full">
                    Beta
                  </span>
                </div>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  Powered by Claude Sonnet 4.5
                </p>
              </div>
            </DialogTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-muted-foreground hover:text-destructive"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Messages Container with Enhanced Scrolling */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className={cn(
            'flex-1 overflow-y-auto space-y-4 p-6',
            'bg-gradient-to-b from-secondary/10 to-background',
            'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'
          )}
        >
          {messages.length === 0 && (
            <WelcomeMessage
              quickActions={quickActions}
              onQuickAction={handleSend}
              hasData={hasData}
            />
          )}
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLatest={index === messages.length - 1}
            />
          ))}
          {loading && <TypingIndicator />}
          {error && <ErrorMessage error={error} onRetry={() => handleSend(messages[messages.length - 1]?.content)} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="border-t border-border/50 p-4 bg-background/95 backdrop-blur-sm rounded-b-2xl">
          {/* Quick Action Pills (shown when no messages) */}
          {messages.length > 0 && !loading && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {quickActions.slice(0, 3).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.message)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs',
                    'bg-secondary hover:bg-secondary/80 border border-border',
                    'transition-all duration-200 hover:scale-105',
                    'whitespace-nowrap flex-shrink-0'
                  )}
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loading ? "AI is thinking..." : "Ask about your nutrition..."}
              disabled={loading}
              aria-label="Chat message input"
              className={cn(
                'flex-1 bg-secondary/50 border-border/50 focus:border-primary',
                'transition-all duration-200',
                loading && 'opacity-60'
              )}
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className={cn(
                'transition-all duration-200',
                !loading && input.trim() && 'animate-pulse'
              )}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Character count and tips */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            {input.length > 0 && (
              <span className={cn(
                input.length > 900 && 'text-destructive font-semibold'
              )}>
                {input.length}/1000
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced Subcomponents

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        isLatest && 'animate-in'
      )}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-chart-2/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 space-y-2',
          'transition-all duration-200 hover:shadow-md',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg'
            : 'bg-secondary/80 border border-border/50 backdrop-blur-sm'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">You</span>
        </div>
      )}
    </div>
  );
}

interface WelcomeMessageProps {
  quickActions: QuickAction[];
  onQuickAction: (message: string) => void;
  hasData: boolean;
}

function WelcomeMessage({ quickActions, onQuickAction, hasData }: WelcomeMessageProps) {
  return (
    <div className="space-y-6 text-center py-12 animate-in fade-in duration-500">
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-xl">
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent">
          {hasData ? "Let's analyze your progress!" : "Welcome! Let's get started"}
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {hasData
            ? "I have access to your nutrition data and can provide personalized insights about your progress."
            : "I'm here to help you understand nutrition better. Start by selecting a topic below or ask me anything!"}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-2xl mx-auto">
        {quickActions.map((action, index) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.message)}
            style={{ animationDelay: `${index * 100}ms` }}
            className={cn(
              'group relative overflow-hidden',
              'h-auto p-4 rounded-xl',
              'bg-gradient-to-br from-secondary to-secondary/50',
              'border border-border hover:border-primary/50',
              'transition-all duration-300',
              'hover:scale-105 hover:shadow-lg',
              'animate-in fade-in slide-in-from-bottom-4'
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-2/20 to-chart-3/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <action.icon className="w-6 h-6 text-chart-2" />
              </div>
              <span className="text-sm font-semibold">{action.label}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-chart-2/5 transition-all duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-chart-2/20">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-secondary/80 border border-border/50 rounded-2xl px-5 py-3 backdrop-blur-sm">
        <div className="flex gap-1.5">
          <div
            className="w-2.5 h-2.5 bg-chart-2 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <div
            className="w-2.5 h-2.5 bg-chart-3 rounded-full animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '1s' }}
          />
          <div
            className="w-2.5 h-2.5 bg-chart-4 rounded-full animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '1s' }}
          />
        </div>
      </div>
    </div>
  );
}

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
}

function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-9 h-9 rounded-full bg-destructive flex items-center justify-center flex-shrink-0 shadow-md">
        <AlertCircle className="w-5 h-5 text-white" />
      </div>
      <div className="bg-destructive/10 border border-destructive/50 rounded-2xl px-4 py-3 space-y-3 backdrop-blur-sm max-w-[85%]">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-destructive">Something went wrong</p>
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="w-full border-destructive/50 hover:bg-destructive/10"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
