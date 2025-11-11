'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Zap } from 'lucide-react';

export default function PaymentCancelledPage() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push('/start-trial');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-lg">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center"
          >
            <XCircle className="w-8 h-8 text-muted-foreground" />
          </motion.div>

          {/* Message */}
          <div className="text-center space-y-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
              <p className="text-muted-foreground">
                No worries! Your payment was cancelled and you haven't been charged.
              </p>
            </motion.div>

            {/* Trial Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20"
            >
              <p className="text-sm text-muted-foreground">
                Your free plan is still active, and you can upgrade anytime from your dashboard.
              </p>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              onClick={handleTryAgain}
              className="w-full bg-gradient-to-r from-primary to-chart-2"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-center text-muted-foreground mt-6"
          >
            Need help?{' '}
            <a href="/support" className="underline hover:text-foreground">
              Contact support
            </a>
          </motion.p>
        </Card>
      </motion.div>
    </div>
  );
}
