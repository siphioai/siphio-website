'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Check, Sparkles, AlertCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const benefits = [
  'Unlimited food logging',
  '20 free AI messages',
  '300,000+ verified foods',
  'No credit card required'
];

export function SignupForm() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available');
      return null;
    }

    const token = await executeRecaptcha('signup');
    return token;
  }, [executeRecaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Execute reCAPTCHA
      const recaptchaToken = await handleReCaptchaVerify();
      if (!recaptchaToken) {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }

      // Check if email is in cooldown period (deleted account)
      const { data: cooldownCheck, error: cooldownError } = await supabase.rpc(
        'is_email_in_cooldown',
        { email_address: email.toLowerCase() }
      );

      if (cooldownError) {
        console.error('Cooldown check error:', cooldownError);
        // Continue anyway - don't block signup if function doesn't exist yet
      } else if (cooldownCheck === true) {
        throw new Error(
          'This email was recently used for a deleted account. Please wait 7 days before creating a new account, or use a different email address.'
        );
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/verified`,
        },
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Redirect to email verification page
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
      {/* Left side - Benefits */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:block space-y-8"
      >
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Start Tracking
            <br />
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              With AI Built In
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Beautiful macro tracking with personalized AI insights.
          </p>
        </div>

        <div className="space-y-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-chart-2 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg">{benefit}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/30"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-chart-2 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold mb-1">AI Nutrition Coach</p>
              <p className="text-sm text-muted-foreground">
                Get 20 free AI messages to start. Ask questions, get insights, and receive personalized recommendations.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Shield className="w-4 h-4 text-primary" />
          <span>Protected by reCAPTCHA</span>
        </motion.div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="p-8 shadow-2xl border-2 hover:border-primary/30 transition-all duration-300">
          {/* Mobile header */}
          <div className="lg:hidden mb-6 text-center">
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-sm text-muted-foreground">Start tracking your macros today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                  focusedField === 'name' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                  focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                  focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !executeRecaptcha}
              className="w-full text-lg py-6 group hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating your account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Trust signals */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-chart-2" />
                  <span>20 free AI msgs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-chart-2" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-chart-2" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Sign in link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>

            {/* reCAPTCHA notice */}
            <p className="text-xs text-center text-muted-foreground">
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
                Terms of Service
              </a>{' '}
              apply.
            </p>
          </form>
        </Card>

        {/* Mobile benefits */}
        <div className="lg:hidden mt-6 space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-chart-2" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
