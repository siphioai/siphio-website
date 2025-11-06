'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const personas = [
  {
    emoji: '💪',
    title: 'Building Muscle',
    description: 'Track surplus, get AI recommendations on macro adjustments',
    gradient: 'from-chart-2/20 to-chart-2/5',
    borderColor: 'border-chart-2/30'
  },
  {
    emoji: '🔥',
    title: 'Losing Fat',
    description: 'Monitor deficit, let AI suggest tweaks when progress stalls',
    gradient: 'from-chart-5/20 to-chart-5/5',
    borderColor: 'border-chart-5/30'
  },
  {
    emoji: '🥗',
    title: 'Just Eating Better',
    description: 'See what you\'re eating, understand patterns, improve gradually',
    gradient: 'from-chart-3/20 to-chart-3/5',
    borderColor: 'border-chart-3/30'
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

export function PersonaCards() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Whether You&apos;re...
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {personas.map((persona) => (
            <motion.div
              key={persona.title}
              variants={itemVariants}
            >
              <Card className={`p-8 h-full bg-gradient-to-br ${persona.gradient} border-2 ${persona.borderColor} hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">
                    {persona.emoji}
                  </div>
                  <h3 className="text-2xl font-bold">{persona.title}</h3>
                  <p className="text-muted-foreground">{persona.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-lg font-medium"
        >
          No matter your goal, having AI help makes the whole thing easier.
        </motion.p>
      </div>
    </section>
  );
}
