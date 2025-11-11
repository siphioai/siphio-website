'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function VerifiedPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();

    // Verify user is actually verified
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/signup');
        return;
      }

      if (!user.email_confirmed_at) {
        router.push('/verify-email');
        return;
      }

      // Update email_verified_at and increase message limit to 50
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || '');

          // Update email_verified_at and increase limit to 50 if not already set
          await supabase
            .from('users')
            .update({
              email_verified_at: new Date().toISOString(),
              ai_messages_limit: 50
            })
            .eq('id', profile.id)
            .is('email_verified_at', null);
        }
      } catch (error) {
        console.error('Error updating verification status:', error);
      }
    });
  }, [router]);

  const handleContinue = () => {
    setIsRedirecting(true);

    // Check if user has completed onboarding
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          // Check if user has set their goals
          const todayDate = new Date().toISOString().split('T')[0];
          const { data: goals } = await supabase
            .from('macro_goals')
            .select('id')
            .eq('user_id', profile.id)
            .eq('date', todayDate)
            .single();

          if (goals) {
            // Has goals, go to dashboard
            router.push('/');
          } else {
            // No goals, go to onboarding
            router.push('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding
        router.push('/onboarding');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-2/10 via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl border-2 border-chart-2/20">
          <div className="text-center space-y-6">
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative w-24 h-24 mx-auto"
            >
              {/* Outer glow ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full bg-chart-2"
              />

              {/* Main circle */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
              </div>

              {/* Sparkles */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-chart-3" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute -bottom-2 -left-2"
              >
                <Sparkles className="w-5 h-5 text-chart-2" />
              </motion.div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-2">
                Email Verified!
              </h1>
              {userName && (
                <p className="text-lg text-muted-foreground mb-1">
                  Welcome, <span className="text-foreground font-semibold">{userName}</span>!
                </p>
              )}
              <p className="text-muted-foreground">
                Your account is ready to go.
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-gradient-to-br from-chart-2/5 to-primary/5 border border-chart-2/20 text-left space-y-2"
            >
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-chart-2"></span>
                What's included:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Track unlimited meals and macros</li>
                <li>• Beautiful visual analytics</li>
                <li>• <span className="font-semibold text-chart-2">50 free AI coach messages per month</span></li>
                <li>• Personalized nutrition insights</li>
              </ul>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={isRedirecting}
                className="w-full text-lg py-6 bg-gradient-to-r from-chart-2 to-chart-3 hover:scale-105 hover:shadow-2xl hover:shadow-chart-2/50 transition-all duration-300"
              >
                {isRedirecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>

            {/* Footer Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-muted-foreground"
            >
              You can upgrade to unlimited AI messages anytime
            </motion.p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
