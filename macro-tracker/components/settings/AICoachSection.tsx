'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function AICoachSection() {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    try {
      setClearing(true);

      // Clear from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ai-coach-conversation');
      }

      // Trigger a custom event to notify the AI Coach component to refresh
      window.dispatchEvent(new CustomEvent('ai-coach-clear'));

      // Close dialog first
      setShowClearDialog(false);

      // Wait for dialog to close, then show notification
      setTimeout(() => {
        // Show beautiful success notification
        toast.custom((t) => (
          <div className="bg-gradient-to-r from-chart-2/10 to-chart-3/10 border-2 border-chart-2/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-md animate-scale-in">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    Conversation History Cleared
                  </p>
                  <Sparkles className="w-4 h-4 text-chart-2 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground">
                  All messages have been permanently removed from your AI coach
                </p>
              </div>
            </div>
          </div>
        ), {
          duration: 4000,
        });
      }, 200); // Small delay to ensure dialog is fully closed

    } catch (error) {
      console.error('Error clearing conversation history:', error);
      setShowClearDialog(false);
      toast.error('Failed to clear conversation history');
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Nutrition Coach</CardTitle>
          <CardDescription>Manage your AI coach settings and data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Clear Conversation History</p>
              <p className="text-xs text-muted-foreground">
                Remove all messages from your AI coach conversation
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              disabled={clearing}
            >
              {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {clearing ? 'Clearing...' : 'Clear'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in your AI coach conversation.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} disabled={clearing}>
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {clearing ? 'Clearing...' : 'Clear History'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
