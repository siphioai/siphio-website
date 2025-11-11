'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');

        // Check if already verified
        if (user.email_confirmed_at) {
          router.push('/verified');
        }
      } else {
        // No user, redirect to signup
        router.push('/signup');
      }
    });

    // Listen for auth state changes (email verification)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        router.push('/verified');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Resend error:', error);
        toast.error('Failed to resend verification email. Please try again.');
      } else {
        toast.success('Verification email sent! Check your inbox.');
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);

    try {
      const supabase = createClient();

      // Force refresh the session
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Check verification error:', error);
        toast.error('Failed to check verification status.');
      } else if (user?.email_confirmed_at) {
        toast.success('Email verified! Redirecting...');
        router.push('/verified');
      } else {
        toast.info('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl border-2">
          <div className="text-center space-y-6">
            {/* Animated Mail Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg"
            >
              <Mail className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Check Your Email
              </h1>
              <p className="text-muted-foreground">
                We sent a verification link to
              </p>
              <p className="text-primary font-semibold mt-1">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-muted/50 border text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Open the email and click the verification link
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be automatically redirected to your dashboard
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start tracking your macros and chat with your AI coach!
                </p>
              </div>
            </div>

            {/* Check Verification Button */}
            <Button
              size="lg"
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full text-lg py-6 bg-gradient-to-r from-primary to-chart-2 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
            >
              {isCheckingVerification ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 w-5 h-5" />
                  I've Verified My Email
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>

            {/* Resend Email Section */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Didn't receive the email?
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-4">
              <p className="text-xs text-muted-foreground">
                Check your spam folder if you don't see the email.
                <br />
                The verification link expires in 7 days.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
