'use client';

import { useState, useEffect } from 'react';

export interface TrialStatusData {
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  needsPayment: boolean;
}

interface UseTrialStatusReturn {
  trialStatus: TrialStatusData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and track trial status
 * Returns:
 * - isOnTrial: boolean
 * - daysRemaining: number
 * - trialEndsAt: Date
 * - needsPayment: boolean (true if < 3 days left)
 */
export function useTrialStatus(): UseTrialStatusReturn {
  const [trialStatus, setTrialStatus] = useState<TrialStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trial status: ${response.statusText}`);
      }

      const data = await response.json();

      // Calculate trial status
      const isOnTrial = data.accountTier === 'trial';
      const trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;

      let daysRemaining = 0;
      if (isOnTrial && trialEndsAt) {
        const now = new Date();
        const diffTime = trialEndsAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const needsPayment = isOnTrial && daysRemaining <= 3;

      setTrialStatus({
        isOnTrial,
        daysRemaining,
        trialEndsAt,
        needsPayment,
      });
    } catch (err) {
      console.error('Error fetching trial status:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  return {
    trialStatus,
    loading,
    error,
    refetch: fetchTrialStatus,
  };
}
