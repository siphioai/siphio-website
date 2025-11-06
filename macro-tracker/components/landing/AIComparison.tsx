'use client';

import { Card } from '@/components/ui/card';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const comparisons = [
  {
    feature: 'Track your macros',
    withoutAI: true,
    withAI: true
  },
  {
    feature: 'Beautiful charts and graphs',
    withoutAI: true,
    withAI: true
  },
  {
    feature: 'Ask questions about your data',
    withoutAI: false,
    withAI: true
  },
  {
    feature: 'Understand why you went over',
    withoutAI: false,
    withAI: true
  },
  {
    feature: 'Get personalized recommendations',
    withoutAI: false,
    withAI: true
  },
  {
    feature: 'Analyze patterns in your habits',
    withoutAI: false,
    withAI: true
  },
  {
    feature: 'Smart macro adjustments',
    withoutAI: false,
    withAI: true
  }
];

export function AIComparison() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Why the AI Actually Matters
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            It&apos;s not just a chatbot - it&apos;s built into the entire app.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Without AI */}
          <Card className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Without AI</h3>
              <p className="text-sm text-muted-foreground">Other Apps</p>
            </div>
            <div className="space-y-3">
              {comparisons.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.withoutAI ? (
                    <Check className="w-5 h-5 text-chart-2 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={item.withoutAI ? '' : 'text-muted-foreground line-through'}>
                    {item.feature}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* With AI - Highlighted */}
          <Card className="p-6 border-2 border-chart-2 bg-gradient-to-br from-chart-2/5 to-transparent shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-block px-3 py-1 rounded-full bg-chart-2/20 border border-chart-2/30 text-sm font-semibold text-chart-2 mb-2">
                ✨ Recommended
              </div>
              <h3 className="text-2xl font-bold mb-2">With AI</h3>
              <p className="text-sm text-muted-foreground">This App</p>
            </div>
            <div className="space-y-3">
              {comparisons.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.withAI ? (
                    <Check className="w-5 h-5 text-chart-2 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={item.withAI ? 'font-medium' : 'text-muted-foreground line-through'}>
                    {item.feature}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Card className="p-6 bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/30">
            <p className="text-lg font-medium">
              <span className="font-bold">The difference?</span> The AI actually knows YOUR data.
              It&apos;s not giving generic advice - it&apos;s analyzing your specific entries,
              your weight trend, and your goals.
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
