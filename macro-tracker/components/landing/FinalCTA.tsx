'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const trustBadges = [
  {
    icon: CreditCard,
    text: 'No credit card needed'
  },
  {
    icon: Zap,
    text: 'Start tracking in 60 seconds'
  },
  {
    icon: Lock,
    text: 'Your data stays private'
  }
];

export function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-primary/10 to-chart-2/10">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Ready to Try It?
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            See what it&apos;s like to have AI actually help you hit your goals.
          </p>

          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="text-lg px-12 py-8 shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
              >
                Start Free Trial
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid sm:grid-cols-3 gap-6"
          >
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + 0.1 * index }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{badge.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
