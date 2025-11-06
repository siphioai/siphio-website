'use client';

import { Button } from '@/components/ui/button';
import { AnimatedGauges } from './AnimatedGauges';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* Gradient background - matches design system */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Track Your Macros. <br />
              <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Let AI Do the Rest.
              </span>
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Beautiful macro tracking with a smart AI coach built right in.
              Set your goals, log your food, and let the AI optimize everything automatically.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 active:scale-95"
                >
                  Start Free Trial
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground self-center">
                £10/month after 7 days • No credit card required
              </p>
            </div>
          </motion.div>

          {/* Right: Animated gauges + AI bubble */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex flex-col gap-6"
          >
            <AnimatedGauges />

            {/* AI chat bubble - positioned below the gauges */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="w-full"
            >
              <div className="bg-gradient-to-br from-chart-2/20 to-chart-2/5 backdrop-blur-sm border border-chart-2/30 rounded-2xl p-4 shadow-xl">
                <p className="text-sm font-medium">
                  💡 You&apos;re 12g away from your protein goal - perfect timing for dinner!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
