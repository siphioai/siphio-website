'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VerifyEmailPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full-screen modal triggered at 15/15 messages
 * Encourages users to verify email to unlock 35 more messages (50 total)
 */
export function VerifyEmailPrompt({ open, onOpenChange }: VerifyEmailPromptProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setSending(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });

      if (error) {
        console.error('Error sending verification email:', error);
        return;
      }

      setSent(true);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-chart-2 to-chart-3 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            You've used all 15 free messages!
          </DialogTitle>
          <DialogDescription className="text-center text-base space-y-4">
            <p>
              Verify your email to unlock <strong className="text-chart-2">35 more messages</strong>
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-chart-2" />
              <span className="text-sm">50 total AI messages per month</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              onClick={handleVerify}
              disabled={sending}
              className="w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3"
              size="lg"
            >
              {sending ? 'Sending...' : 'Verify Email Now'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Takes 30 seconds
            </p>
          </DialogFooter>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-chart-2/10 rounded-lg text-center">
              <p className="text-sm font-medium text-chart-2">
                Verification email sent!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your inbox and click the link to verify
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
