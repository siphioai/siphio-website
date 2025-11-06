'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, BarChart3, Flame, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const callouts = [
  {
    icon: Zap,
    text: 'Updates the second you log',
    color: 'bg-chart-1/10 text-chart-1 border-chart-1/30'
  },
  {
    icon: BarChart3,
    text: 'Charts that actually look good',
    color: 'bg-chart-3/10 text-chart-3 border-chart-3/30'
  },
  {
    icon: Flame,
    text: 'Track streaks and stay consistent',
    color: 'bg-chart-5/10 text-chart-5 border-chart-5/30'
  },
  {
    icon: Bot,
    text: 'AI chat always ready to help',
    color: 'bg-chart-2/10 text-chart-2 border-chart-2/30'
  }
];

const features = [
  'Real-time macro tracking',
  'Beautiful progress visualizations',
  '300,000+ USDA-verified foods',
  'Streak and consistency tracking',
  'Built-in AI coach'
];

export function DashboardPreview() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Actually Beautiful to Use
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Because you&apos;re more likely to track when the app doesn&apos;t feel like homework.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-2 shadow-2xl">
            {/* Screenshot placeholder */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground mb-2">Dashboard Screenshot</p>
                <p className="text-sm text-muted-foreground">(To be replaced with actual screenshot)</p>
              </div>

              {/* Floating callout badges */}
              {callouts.map((callout, index) => {
                const Icon = callout.icon;
                const positions = [
                  'absolute top-4 left-4',
                  'absolute top-4 right-4',
                  'absolute bottom-4 left-4',
                  'absolute bottom-4 right-4'
                ];
                return (
                  <div key={index} className={positions[index]}>
                    <Badge className={`${callout.color} border shadow-md flex items-center gap-2`}>
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">{callout.text}</span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-chart-2 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
