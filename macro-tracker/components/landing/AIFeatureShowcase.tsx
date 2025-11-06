'use client';

import { Card } from '@/components/ui/card';
import { MessageCircle, BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: MessageCircle,
    title: 'Ask Questions 💬',
    description: 'Curious why you went over yesterday? Just ask. The AI knows your data and can explain it.',
    example: 'User: "Why did I exceed my carbs?"\nAI: "Looking at your entries, you had a large pasta dish at lunch (87g carbs) which put you over by 25g."'
  },
  {
    icon: BarChart3,
    title: 'Get Smart Summaries 📊',
    description: 'No more staring at numbers wondering what they mean. Ask for a summary and get instant insights.',
    example: 'User: "How\'s my week looking?"\nAI: "Great! You hit your protein goal 6/7 days this week. Your average was 148g vs 150g target."'
  },
  {
    icon: Target,
    title: 'Automatic Optimization 🎯',
    description: 'The AI watches your progress and suggests macro adjustments when you need them.',
    example: 'AI: "Your weight hasn\'t changed in 2 weeks. Consider increasing calories by 200/day to keep progressing."'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function AIFeatureShowcase() {
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
            Meet Your Built-In AI Coach
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most macro trackers just show you numbers. This one actually helps you understand them.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="p-6 h-full hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-primary/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5">
                      <Icon className="w-6 h-6 text-chart-2" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/30 text-sm whitespace-pre-line">
                    {feature.example}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-lg text-muted-foreground max-w-3xl mx-auto"
        >
          It&apos;s like having a nutrition coach in your pocket, except it&apos;s always available and knows your exact data.
        </motion.p>
      </div>
    </section>
  );
}
