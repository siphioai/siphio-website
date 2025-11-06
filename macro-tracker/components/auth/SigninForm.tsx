'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function SigninForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Redirect to dashboard on success
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
      {/* Left side - Welcome back message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:block space-y-8"
      >
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Welcome Back to
            <br />
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Macro Tracker
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your journey to better nutrition and health.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold mb-1">Your AI Coach Awaits</p>
                <p className="text-sm text-muted-foreground">
                  Get personalized insights based on your progress and goals.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-2 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="font-semibold mb-1">Track Your Progress</p>
                <p className="text-sm text-muted-foreground">
                  See your streaks, trends, and achievements at a glance.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Sign in form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="p-8 shadow-2xl border-2 hover:border-primary/30 transition-all duration-300">
          {/* Mobile header */}
          <div className="lg:hidden mb-6 text-center">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold mb-2">Sign In</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
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
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full text-lg py-6 group hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Start your free trial
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
