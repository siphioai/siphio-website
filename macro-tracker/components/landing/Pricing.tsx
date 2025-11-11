'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const freeFeatures = [
  { name: 'Unlimited food logging', included: true },
  { name: 'Real-time macro tracking', included: true },
  { name: 'Beautiful charts and insights', included: true },
  { name: '50 AI messages/month', included: true },
  { name: '300,000+ verified foods', included: true },
  { name: 'Streak tracking', included: true },
];

const premiumFeatures = [
  { name: 'Unlimited food logging', included: true },
  { name: 'Real-time macro tracking', included: true },
  { name: 'Beautiful charts and insights', included: true },
  { name: 'Unlimited AI coaching', included: true },
  { name: '300,000+ verified foods', included: true },
  { name: 'Streak tracking', included: true },
  { name: 'Priority support', included: true },
];

const faqs = [
  {
    question: 'What makes the AI different?',
    answer: 'Unlike generic chatbots, our AI actually knows YOUR specific data - your entries, weight trends, and goals. It gives personalized insights, not generic advice.'
  },
  {
    question: 'Do I have to use the AI?',
    answer: 'Nope! The app works great as a regular macro tracker. The AI is there when you need help understanding your data or want recommendations.'
  },
  {
    question: 'How accurate is the food database?',
    answer: 'We use the USDA-verified database with 300,000+ foods. All nutritional data comes from official sources, ensuring accuracy for your tracking.'
  }
];

export function Pricing() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free, upgrade when you need unlimited AI coaching
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-8 border-2 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-xl text-muted-foreground ml-2">forever</span>
                </div>
                <p className="text-sm text-muted-foreground">Perfect to get started</p>
              </div>

              <div className="mb-8 flex-grow">
                <div className="space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-3 group/feature"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-transform duration-200"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Check className="w-3 h-3 text-foreground" />
                      </motion.div>
                      <span className={`${feature.name === '50 AI messages/month' ? 'font-semibold' : ''} group-hover/feature:text-primary transition-colors duration-200`}>
                        {feature.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="w-full text-lg py-6 mb-4 hover:scale-105 hover:shadow-xl transition-all duration-300 active:scale-95">
                    Get Started Free
                  </Button>
                </Link>

                <p className="text-center text-xs text-muted-foreground">
                  No credit card required
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-8 border-2 border-primary bg-gradient-to-br from-primary/5 to-chart-2/5 shadow-2xl hover:shadow-primary/30 hover:border-primary/70 transition-all duration-300 h-full relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold">$12</span>
                  <span className="text-xl text-muted-foreground ml-2">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground">After 7-day free trial</p>
              </div>

              <div className="space-y-3 mb-8 flex-grow">
                {premiumFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 group/feature"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-chart-2 flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-transform duration-200"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                    <span className={`${feature.name === 'Unlimited AI coaching' ? 'font-bold' : ''} group-hover/feature:text-primary transition-colors duration-200`}>
                      {feature.name}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto">
                <Link href="/signup">
                  <Button size="lg" className="w-full text-lg py-6 mb-4 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 active:scale-95">
                    Start 7-Day Free Trial
                  </Button>
                </Link>

                <p className="text-center text-xs text-muted-foreground">
                  Card required • Not charged until trial ends
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <Card className="p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer">
                  <h4 className="font-bold mb-2 group-hover:text-primary transition-colors">{faq.question}</h4>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
