'use client';

import { Target, Utensils, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    icon: Target,
    title: 'Set Your Goals 🎯',
    description: 'Tell us your target. The AI calculates your perfect macro split.',
    color: 'from-chart-1/20 to-chart-1/5',
    borderColor: 'border-chart-1/30'
  },
  {
    number: 2,
    icon: Utensils,
    title: 'Log Your Food 🍽️',
    description: 'Search from 300,000+ foods and log what you eat. Updates instantly.',
    color: 'from-chart-3/20 to-chart-3/5',
    borderColor: 'border-chart-3/30'
  },
  {
    number: 3,
    icon: Bot,
    title: 'Let AI Guide You 🤖',
    description: 'Ask questions, get summaries, and receive smart recommendations as you go.',
    color: 'from-chart-2/20 to-chart-2/5',
    borderColor: 'border-chart-2/30'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function HowItWorks() {
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
            Three Steps to Better Nutrition
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Number badge */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} border-2 ${step.borderColor} flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="text-2xl font-bold">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} border ${step.borderColor} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-10 h-10" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>

                  {/* Placeholder for screenshot */}
                  <div className={`mt-6 w-full aspect-video rounded-xl bg-gradient-to-br ${step.color} border ${step.borderColor} flex items-center justify-center shadow-lg`}>
                    <p className="text-sm text-muted-foreground">Screenshot placeholder</p>
                  </div>
                </div>

                {/* Connector line (hidden on mobile, shown on desktop) */}
                {step.number < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
