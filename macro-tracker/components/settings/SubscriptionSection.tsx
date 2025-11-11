'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Check, ExternalLink, AlertCircle } from 'lucide-react';
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

/**
 * Complete subscription management UI for settings page
 * Shows different content based on account_tier:
 * - Free: Upgrade CTA with benefits list
 * - Trial: Days remaining, payment CTA
 * - Premium: Plan details, billing date, portal link, cancel option
 */
export function SubscriptionSection() {
  const { subscription, loading, openCustomerPortal } = useSubscription();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open portal:', error);
      setPortalLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false);
    // Open customer portal pre-filled to cancel page
    await openCustomerPortal();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  // Free tier - show upgrade CTA
  if (subscription.accountTier === 'free') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <p className="text-sm">You're on the Free plan</p>
            </div>

            <div className="p-4 rounded-lg bg-muted space-y-3">
              <p className="text-sm font-semibold">Free plan includes:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>50 AI messages per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Basic nutrition tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Visual analytics</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-chart-2/5 border border-primary/20 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                Upgrade to Premium
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Unlimited AI messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Custom macro goals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Data export</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => router.push('/start-trial')}
              className="w-full bg-gradient-to-r from-primary to-chart-2"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start 7-Day Trial
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Card required • Not charged until trial ends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial - show days remaining
  if (subscription.accountTier === 'trial') {
    const daysLeft = subscription.trialEndsAt
      ? Math.ceil(
          (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Premium Trial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                daysLeft <= 2
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-chart-2/10 border-chart-2/30'
              }`}
            >
              <p className="font-medium">
                Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.trialEndsAt &&
                  `Ends on ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={() => router.push('/start-trial')} className="w-full">
                Add Payment Method
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Continue with Premium after trial for $12/month or $99/year
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Premium - show subscription details
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-chart-2" />
            Premium Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Plan Details */}
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-medium">
                  {subscription.subscription?.planType === 'annual'
                    ? 'Annual ($99/year)'
                    : 'Monthly ($12/month)'}
                </span>
              </div>

              {subscription.subscriptionCurrentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {subscription.subscription?.cancelAtPeriodEnd
                      ? 'Active until'
                      : 'Next billing date'}
                  </span>
                  <span className="font-medium">
                    {new Date(subscription.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium capitalize">
                  {subscription.subscription?.cancelAtPeriodEnd ? (
                    <span className="text-orange-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Cancels at period end
                    </span>
                  ) : (
                    <span className="text-chart-2">Active</span>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {portalLoading ? 'Opening...' : 'Manage Subscription'}
              </Button>
              {!subscription.subscription?.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={handleCancelClick} className="w-full">
                  Cancel Subscription
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Manage payment methods, invoices, and billing details in the customer portal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll lose access to:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Unlimited AI messages</li>
                <li>Custom macro goals</li>
                <li>Advanced analytics</li>
                <li>Data export</li>
              </ul>
              <p className="mt-3">
                Your subscription will remain active until{' '}
                {subscription.subscriptionCurrentPeriodEnd &&
                  new Date(subscription.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                , then you'll be downgraded to the Free plan (50 AI messages per month).
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Premium</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive">
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
