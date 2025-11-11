'use client';

import { useState, useEffect } from 'react';

export interface AIUsageData {
  messagesUsed: number;
  messagesLimit: number;
  canSend: boolean;
  accountTier: 'free' | 'trial' | 'premium';
  emailVerified: boolean;
  reason?: string;
  messagesRemaining: number;
}

interface UseAIUsageReturn {
  usage: AIUsageData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and track AI usage for the current user
 * Mirrors useUserSettings.ts pattern
 */
export function useAIUsage(): UseAIUsageReturn {
  const [usage, setUsage] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI usage: ${response.statusText}`);
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      console.error('Error fetching AI usage:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}
