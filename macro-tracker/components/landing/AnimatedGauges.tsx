'use client';

import { useEffect, useState } from 'react';

interface CircularProgressProps {
  percentage: number;
  color: string;
  size: number;
  strokeWidth: number;
  animate?: boolean;
}

function CircularProgress({
  percentage,
  color,
  size,
  strokeWidth,
  animate = false
}: CircularProgressProps) {
  // PATTERN: Copy exact math from DailyMacroGauges.tsx
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animate from 0 to target percentage
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => {
        setDisplayPercentage(percentage);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setDisplayPercentage(percentage);
    }
  }, [percentage, animate]);

  const offset = circumference - (displayPercentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-secondary"
      />
      {/* Progress circle - CRITICAL: Same animation as existing app */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{
          filter: `drop-shadow(0 0 8px ${color}40)` // CRITICAL: Same glow effect
        }}
      />
    </svg>
  );
}

export function AnimatedGauges() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setAnimate(true);
  }, []);

  // DEMO DATA - static values for landing page
  const demoMacros = [
    { name: 'Calories', current: 1850, target: 2200, percentage: 84, color: '#0170B9', icon: '🔥' },
    { name: 'Protein', current: 165, target: 150, percentage: 110, color: '#10B981', icon: '💪' },
    { name: 'Carbs', current: 180, target: 220, percentage: 82, color: '#F59E0B', icon: '🌾' },
    { name: 'Fat', current: 58, target: 70, percentage: 83, color: '#8B5CF6', icon: '🥑' }
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {demoMacros.map((macro) => (
        <div
          key={macro.name}
          className="group relative p-4 rounded-2xl bg-card border border-border/50 shadow-md hover:shadow-xl hover:scale-105 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        >
          {/* Icon badge with hover animation */}
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-chart-2/10 backdrop-blur-sm border border-border/50 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
            {macro.icon}
          </div>

          <div className="flex flex-col items-center space-y-3">
            {/* Circular progress */}
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <CircularProgress
                percentage={Math.min(macro.percentage, 100)}
                color={macro.color}
                size={120}
                strokeWidth={10}
                animate={animate}
              />
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-3xl font-bold transition-all duration-300 group-hover:scale-110" style={{ color: macro.color }}>
                  {macro.percentage}%
                </div>
              </div>
            </div>

            {/* Macro name and values */}
            <div className="text-center space-y-1">
              <h4 className="font-bold text-base group-hover:text-primary transition-colors duration-300">{macro.name}</h4>
              <div className="text-sm">
                <span className="font-bold transition-all duration-300 group-hover:scale-110 inline-block" style={{ color: macro.color }}>
                  {macro.current}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-muted-foreground">{macro.target}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {macro.name === 'Calories' ? 'cal' : 'g'}
                </span>
              </div>
            </div>

            {/* Status badge */}
            {macro.percentage >= 100 && (
              <div className="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/30 text-xs font-semibold text-chart-2 group-hover:bg-chart-2/20 group-hover:border-chart-2/50 transition-all duration-300">
                Goal Reached! 🎉
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
