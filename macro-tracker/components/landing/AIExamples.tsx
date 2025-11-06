'use client';

import { User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const chatExamples = [
  {
    userMessage: 'Am I hitting my protein goals?',
    aiResponse: 'Looking at the past week, you\'ve averaged 145g protein per day. Your target is 150g, so you\'re hitting 97% - really close! You\'ve hit or exceeded your goal 4 out of 7 days.'
  },
  {
    userMessage: 'Why can\'t I stick to my carbs on weekends?',
    aiResponse: 'I noticed a pattern: on Saturdays and Sundays, you tend to have larger restaurant meals which average 30% more carbs than your weekday meals. Your Friday dinners also tend to be higher. This is common - social eating patterns!'
  },
  {
    userMessage: 'Should I change my goals?',
    aiResponse: 'Your weight has been stable at 82kg for 3 weeks while hitting your targets consistently. If you want to keep gaining muscle, I\'d recommend increasing calories by 200-250/day, mostly from carbs. Want me to suggest a new macro split?'
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
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function AIExamples() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            What You Can Actually Ask
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          {chatExamples.map((example, index) => (
            <motion.div key={index} variants={itemVariants} className="space-y-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="flex items-start gap-3 max-w-md group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-secondary rounded-2xl px-4 py-3 shadow-md hover:shadow-xl hover:bg-secondary/80 transition-all duration-300 cursor-pointer"
                  >
                    <p className="text-sm font-medium">{example.userMessage}</p>
                  </motion.div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* AI message */}
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-2xl group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/80 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/30 rounded-2xl px-4 py-3 shadow-md hover:shadow-xl hover:from-chart-2/30 hover:to-chart-2/10 hover:border-chart-2/50 transition-all duration-300 cursor-pointer"
                  >
                    <p className="text-sm">{example.aiResponse}</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Just talk to it like you&apos;d talk to a coach. It understands context and gives you real answers.
        </motion.p>
      </div>
    </section>
  );
}
