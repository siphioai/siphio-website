name: "Landing Page for Macro Tracker App - AI-Integrated Positioning"
description: |

## Purpose
Build a conversion-optimized landing page for the AI-integrated Macro Tracker App positioned as "Track Your Macros. Let AI Do the Rest." - targeting £10/month subscription with 7-day free trial.

## Core Principles
1. **Context is King**: Reuse existing design system exactly - colors, typography, components
2. **Friendly + AI Excitement**: Not overly technical, but highlights AI as the differentiator
3. **Conversion Optimized**: Multiple CTAs, trust signals, objection handling
4. **Component Reuse**: Mirror existing component patterns from main app
5. **Responsive First**: Mobile, tablet, desktop breakpoints

---

## Goal
Create a modern, friendly landing page that converts visitors to free trial signups by showcasing the beautiful macro tracker with the "Oh, it has AI!" excitement moment. The landing page must match the existing app's design system perfectly while being optimized for conversion.

## Why
- **Business value**: Convert website visitors to paying users (£10/month subscription)
- **User impact**: Help fitness enthusiasts discover a beautiful macro tracker with AI assistance
- **Integration**: Seamlessly connects to existing Next.js app and Supabase auth flow
- **Problems this solves**: Provides clear value proposition and reduces friction to trial signup

## What
A single-page landing site with 9 sections:
1. Hero with animated gauges + AI chat bubble
2. AI Feature Showcase ("Meet Your Built-In AI Coach")
3. How It Works (3 steps)
4. Dashboard Preview ("Actually Beautiful to Use")
5. AI Comparison (Why AI Matters)
6. Real AI Examples (chat bubbles)
7. User Personas (Who Is This For)
8. Pricing (Simple, one plan)
9. Final CTA

### Success Criteria
- [ ] Landing page matches existing app design system exactly
- [ ] All 9 sections implemented with correct copy
- [ ] Animated circular gauges from app reused/recreated
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] CTA buttons lead to trial signup flow
- [ ] Page builds without TypeScript errors
- [ ] Performance: Lighthouse score > 90
- [ ] Accessibility: WCAG AA compliance

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window

- url: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
  why: Next.js App Router page creation pattern
  critical: Use app/landing/page.tsx or separate route

- url: https://www.framer.com/motion/introduction/
  why: Scroll-triggered animations for sections
  critical: Use framer-motion for fade-in effects, may need to install

- url: https://recharts.org/en-US/guide
  why: Understanding how existing charts work (for reference)

- url: https://ui.shadcn.com/docs/components
  why: shadcn/ui component API reference
  critical: Button, Card, Badge components already installed

- url: https://lucide.dev/icons/
  why: Icon library used in existing app
  critical: Use Arcon MCP to find appropriate icons

- file: macro-tracker/app/globals.css
  why: Complete design system with CSS variables
  critical: All color values, radius, typography defined here

- file: macro-tracker/components/ui/card.tsx
  why: Card component pattern to mirror
  critical: Uses rounded-xl, border-border/50, shadow-md, hover:shadow-lg

- file: macro-tracker/components/ui/button.tsx
  why: Button variants and sizing
  critical: Primary CTA uses variant="default" size="lg", rounded-xl

- file: macro-tracker/components/graphs/DailyMacroGauges.tsx
  why: Circular progress animation pattern
  critical: SVG-based, stroke-dashoffset, 1000ms transition, drop-shadow filter

- file: macro-tracker/app/page.tsx
  why: Page structure pattern (container, sections, headers)
  critical: Uses min-h-screen, container mx-auto max-w-7xl, space-y-8

- file: PRPs/INITIAL.md
  why: Complete landing page spec with all copy, sections, and design
  critical: Source of truth for all content and structure
```

### Current Codebase Tree (relevant parts)
```bash
macro-tracker/
├── app/
│   ├── layout.tsx              # Root layout with DM Sans font
│   ├── page.tsx                # Main app dashboard
│   ├── globals.css             # Design system (READ THIS FIRST)
│   └── auth/
│       └── callback/route.ts   # OAuth callback
├── components/
│   ├── ui/                     # shadcn/ui components (REUSE THESE)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── graphs/
│   │   └── DailyMacroGauges.tsx  # Circular progress pattern
│   ├── MacroGoalsForm.tsx
│   ├── FoodLog.tsx
│   └── FoodSearch.tsx
├── lib/
│   ├── utils/
│   │   └── cn.ts               # Tailwind merge utility
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── package.json                # Dependencies already installed
└── tailwind.config.ts
```

### Desired Codebase Tree (files to be added)
```bash
macro-tracker/
├── app/
│   └── landing/
│       └── page.tsx            # NEW: Landing page route
├── components/
│   └── landing/                # NEW: Landing-specific components
│       ├── Hero.tsx
│       ├── AIFeatureShowcase.tsx
│       ├── HowItWorks.tsx
│       ├── DashboardPreview.tsx
│       ├── AIComparison.tsx
│       ├── AIExamples.tsx
│       ├── PersonaCards.tsx
│       ├── Pricing.tsx
│       ├── FinalCTA.tsx
│       └── AnimatedGauges.tsx  # Simplified version of DailyMacroGauges
└── public/
    └── screenshots/            # NEW: App screenshots (to be added manually)
        ├── dashboard-full.png
        ├── macro-goals-form.png
        └── food-log.png
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Next.js App Router - landing page location options
// Option 1: app/landing/page.tsx (recommended - separate route)
// Option 2: Separate domain/subdomain deployment

// CRITICAL: Framer Motion may not be installed yet
// Check package.json first, if missing: npm install framer-motion
// Import: import { motion } from 'framer-motion'

// CRITICAL: All landing components need 'use client' directive
// Reason: Uses state, animations, click handlers

// CRITICAL: Circular gauges are SVG-based with specific math
// Formula: offset = circumference - (percentage / 100) * circumference
// Circumference: radius * 2 * Math.PI
// Radius: (size - strokeWidth) / 2

// CRITICAL: Design system uses CSS variables
// Access colors via: text-primary, bg-chart-2, border-border/50
// Radius: rounded-xl (12px defined in globals.css as --radius: 0.75rem)

// CRITICAL: Typography hierarchy
// Hero headline: text-5xl (48px) or text-6xl (64px)
// Section headlines: text-3xl (32px) or text-4xl (40px)
// Body: text-base (16px), line-height-relaxed (1.6)

// CRITICAL: Responsive breakpoints (Tailwind defaults)
// Mobile: < 640px (sm)
// Tablet: 640px - 1024px (sm to lg)
// Desktop: > 1024px (lg)

// CRITICAL: Image optimization
// Use Next.js Image component: import Image from 'next/image'
// Requires width/height or fill prop

// CRITICAL: CTA button must link somewhere
// For now: href="#" or onClick={() => alert('Trial signup - to be implemented')}
// Later: Link to /auth/signup or Supabase auth flow

// CRITICAL: Scroll animations best practices
// Use IntersectionObserver or framer-motion's useInView hook
// Stagger animations by 100-200ms for sequential reveals

// CRITICAL: Color consistency
// Primary: #0170B9 (blue) - var(--primary)
// Chart-2: #10B981 (green) - for AI elements
// Chart-3: #F59E0B (amber) - for warnings/highlights
// Chart-4: #8B5CF6 (purple) - for premium features

// CRITICAL: Font family
// DM Sans is loaded in app/layout.tsx via next/font/google
// Applied globally, no need to import again
```

## Implementation Blueprint

### Component Architecture
```typescript
// Landing page structure
app/landing/page.tsx (Server Component, fetches any initial data if needed)
  └─> <LandingPageClient /> (Client Component with animations)
      ├─> <Hero />
      ├─> <AIFeatureShowcase />
      ├─> <HowItWorks />
      ├─> <DashboardPreview />
      ├─> <AIComparison />
      ├─> <AIExamples />
      ├─> <PersonaCards />
      ├─> <Pricing />
      └─> <FinalCTA />
```

### Data Models (None required - static landing page)
```typescript
// No database models needed for landing page
// All content is static copy from INITIAL.md
// Future enhancement: Could add email_signups table for pre-launch

// Type for AI chat examples (just for TypeScript)
interface ChatExample {
  userMessage: string;
  aiResponse: string;
}

// Type for feature cards
interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Type for persona cards
interface PersonaCard {
  emoji: string;
  title: string;
  description: string;
}
```

### List of Tasks (in order)

```yaml
Task 1: Setup and Planning
READ PRPs/INITIAL.md:
  - Extract all copy for each section
  - Note color schemes, typography specifications
  - Understand CTA placement requirements

READ macro-tracker/app/globals.css:
  - Understand CSS variables for colors
  - Note radius, typography, spacing values
  - Confirm design system consistency

CHECK package.json for framer-motion:
  - If missing: npm install framer-motion
  - Version: Latest stable (^11.x)

Task 2: Create Landing Page Route
CREATE app/landing/page.tsx:
  - Use 'use client' directive (needs animations/interactions)
  - Import all landing components
  - Create container with proper spacing
  - Use same layout pattern as app/page.tsx (container mx-auto max-w-7xl)
  - Background: bg-background (white)

Structure:
  ```tsx
  'use client';

  export default function LandingPage() {
    return (
      <div className="min-h-screen bg-background">
        <Hero />
        <AIFeatureShowcase />
        {/* ... all sections */}
      </div>
    );
  }
  ```

Task 3: Create Hero Component
CREATE components/landing/Hero.tsx:
  - PATTERN: Full-height section with gradient background
  - COPY: From INITIAL.md Section 1

Key elements:
  - Headline: "Track Your Macros. Let AI Do the Rest."
  - Subheadline with value prop
  - CTA Button (Primary, large)
  - Trust line: "£10/month after 7 days • No credit card required"
  - Animated circular gauges (reuse CircularProgress from DailyMacroGauges.tsx)
  - AI chat bubble peeking from corner

Design specs:
  - Background: bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5
  - Container: max-w-7xl mx-auto px-4 py-16 lg:py-24
  - Grid layout: 2 columns on desktop (text left, visual right)
  - Headline: text-5xl lg:text-6xl font-bold
  - CTA: Button variant="default" size="lg"

Animation:
  - Fade in on load
  - Gauges animate from 0 to sample percentages

Task 4: Create AnimatedGauges Component
CREATE components/landing/AnimatedGauges.tsx:
  - MIRROR: components/graphs/DailyMacroGauges.tsx CircularProgress
  - SIMPLIFY: Remove real-time data, use static demo values

Demo values:
  - Calories: 1850/2200 (84%)
  - Protein: 165/150 (110% - show "Goal Reached!")
  - Carbs: 180/220 (82%)
  - Fat: 58/70 (83%)

  PRESERVE: Same colors, same animation, same styling

Task 5: Create AIFeatureShowcase Component
CREATE components/landing/AIFeatureShowcase.tsx:
  - PATTERN: 3-column grid of feature cards
  - COPY: From INITIAL.md Section 2

Cards:
  1. Ask Questions 💬
  2. Get Smart Summaries 📊
  3. Automatic Optimization 🎯

Design:
  - Card component from ui/card.tsx
  - Icons: Use lucide-react (MessageCircle, BarChart3, Target)
  - Hover effect: scale-105, shadow-lg
  - Chat bubble examples in each card

Chat bubble styling:
  - AI: bg-gradient-to-br from-chart-2/20 to-chart-2/5, rounded-2xl, p-4
  - Border: border border-chart-2/30

Task 6: Create HowItWorks Component
CREATE components/landing/HowItWorks.tsx:
  - PATTERN: 3-step timeline with screenshots
  - COPY: From INITIAL.md Section 3

Steps:
  1. Set Your Goals 🎯
  2. Log Your Food 🍽️
  3. Let AI Guide You 🤖

Design:
  - Vertical timeline on mobile, horizontal on desktop
  - Icons from lucide-react: Target, Utensils, Bot
  - Screenshot placeholders (use placeholder divs for now)
  - Numbers in circles with gradient backgrounds

Animation:
  - Stagger fade-in as user scrolls
  - Use framer-motion viewport trigger

Task 7: Create DashboardPreview Component
CREATE components/landing/DashboardPreview.tsx:
  - PATTERN: Full-width screenshot with callout annotations
  - COPY: From INITIAL.md Section 4

Design:
  - Large Card component
  - Screenshot of main dashboard (use placeholder for now)
  - 4 callout badges pointing to features:
    * ⚡ "Updates the second you log"
    * 📊 "Charts that actually look good"
    * 🔥 "Track streaks and stay consistent"
    * 🤖 "AI chat always ready to help"

  Badge design: Similar to status badges in DailyMacroGauges
  - Gradient background, rounded-full, text-xs font-semibold

Task 8: Create AIComparison Component
CREATE components/landing/AIComparison.tsx:
  - PATTERN: 2-column comparison table
  - COPY: From INITIAL.md Section 5

Comparison:
  - Without AI (Other Apps) vs With AI (This App)
  - Use checkmarks ✅ and crosses ❌
  - Highlight "With AI" column with subtle gradient background

Design:
  - Not a traditional table, use Card components side-by-side
  - Mobile: Stack vertically
  - Desktop: 2 columns with gap

Task 9: Create AIExamples Component
CREATE components/landing/AIExamples.tsx:
  - PATTERN: Chat interface mockup with 3 example conversations
  - COPY: From INITIAL.md Section 6

Examples:
  1. "Am I hitting my protein goals?" → AI response with averages
  2. "Why can't I stick to my carbs on weekends?" → Pattern analysis
  3. "Should I change my goals?" → Personalized recommendation

Design:
  - Chat bubbles (user + AI)
  - User messages: bg-secondary, rounded-2xl, align-right
  - AI messages: bg-gradient-to-br from-chart-2/20 to-chart-2/5, align-left
  - Avatar icons (User icon, Sparkles icon for AI)

Task 10: Create PersonaCards Component
CREATE components/landing/PersonaCards.tsx:
  - PATTERN: 3-column grid of persona cards
  - COPY: From INITIAL.md Section 7

Personas:
  1. Building Muscle 💪
  2. Losing Fat 🔥
  3. Just Eating Better 🥗

Design:
  - Card components with gradient backgrounds
  - Emoji icons at top
  - Short description
  - Hover: lift effect (translateY)

Task 11: Create Pricing Component
CREATE components/landing/Pricing.tsx:
  - PATTERN: Single centered pricing card
  - COPY: From INITIAL.md Section 8

Content:
  - Price: £10 / month
  - Feature list with checkmarks
  - Emphasize "AI coach built in" (bold)
  - CTA: "Start 7-Day Free Trial"
  - Small print: "No credit card required • Cancel anytime"

Design:
  - Large Card with border-2 border-primary
  - Gradient background overlay
  - Button size="lg" full-width on mobile

FAQ below pricing:
  - Accordion or simple Q&A list
  - 3 questions from INITIAL.md

Task 12: Create FinalCTA Component
CREATE components/landing/FinalCTA.tsx:
  - PATTERN: Full-width section with gradient background
  - COPY: From INITIAL.md Section 9

Content:
  - Headline: "Ready to Try It?"
  - Subheadline
  - Large CTA button
  - Trust badges: 💳 No credit card, ⚡ 60 seconds, 🔒 Private

Design:
  - bg-gradient-to-br from-primary/10 to-chart-2/10
  - py-16, text-center
  - Button size="lg" with glow effect on hover

Task 13: Add Scroll Animations
MODIFY all landing components:
  - INJECT framer-motion wrappers
  - PATTERN: motion.div with variants

Animation pattern:
  ```tsx
  import { motion } from 'framer-motion';

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5 }}
    variants={fadeInUp}
  >
    {/* Content */}
  </motion.div>
  ```

Stagger children:
  - Use staggerChildren: 0.1 in parent
  - Each child fades in 100ms apart

Task 14: Responsive Design Refinement
MODIFY all components:
  - TEST on mobile (< 640px)
  - TEST on tablet (640-1024px)
  - TEST on desktop (> 1024px)

Mobile adjustments:
  - Stack grids vertically (grid-cols-1)
  - Reduce padding (px-4 instead of px-8)
  - Smaller headlines (text-4xl instead of text-6xl)
  - Full-width CTAs

Tablet adjustments:
  - 2-column grids where appropriate
  - Maintain most desktop features

Desktop optimizations:
  - Full 3-column grids
  - Larger spacing
  - Animated scroll effects

Task 15: Add Metadata and SEO
MODIFY app/landing/page.tsx:
  - ADD metadata export

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Macro Tracker - AI-Powered Nutrition Tracking',
  description: 'Beautiful macro tracking with a smart AI coach built right in. Track your macros, chat with AI when you need help. £10/month with 7-day free trial.',
  keywords: ['macro tracker', 'AI nutrition', 'meal tracking', 'fitness app'],
  openGraph: {
    title: 'Macro Tracker - Track Your Macros. Let AI Do the Rest.',
    description: 'Beautiful macro tracking with AI coach built in.',
    type: 'website',
  },
};
```

Task 16: Create Placeholder Screenshots
CREATE public/screenshots/ directory:
  - Add placeholder images or use actual screenshots
  - Required: dashboard-full.png, macro-goals.png, food-log.png
  - Optimize: Use Next.js Image component
  - Dimensions: 1200x800 recommended

Task 17: Accessibility Improvements
MODIFY all landing components:
  - ADD aria-labels to CTA buttons
  - ENSURE proper heading hierarchy (h1 → h2 → h3)
  - ADD alt text to all images
  - ENSURE keyboard navigation works
  - TEST with screen reader (NVDA/VoiceOver)

Pattern:
  - Buttons: aria-label="Start your free trial"
  - Images: alt="Macro Tracker dashboard showing real-time progress gauges"
  - Sections: Use semantic HTML (section, article, nav)

Task 18: Performance Optimization
OPTIMIZE landing page:
  - Use Next.js Image for all screenshots
  - Lazy load below-fold sections
  - Minimize JS bundle (check only necessary components are client components)
  - Use font-display: swap for DM Sans
  - Preload critical assets

Check:
  - Run Lighthouse audit
  - Target: Performance > 90, Accessibility > 95
```

### Per-Task Pseudocode

```typescript
// Task 3: Hero Component Structure
// components/landing/Hero.tsx
'use client';

import { Button } from '@/components/ui/button';
import { AnimatedGauges } from './AnimatedGauges';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center">
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
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
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
            className="relative"
          >
            <AnimatedGauges />

            {/* AI chat bubble - peeking from corner */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute bottom-4 right-4 max-w-xs"
            >
              <div className="bg-gradient-to-br from-chart-2/20 to-chart-2/5 backdrop-blur-sm border border-chart-2/30 rounded-2xl p-4 shadow-xl">
                <p className="text-sm font-medium">
                  💡 You're 12g away from your protein goal - perfect timing for dinner!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// CRITICAL: Button must match existing design system
// CRITICAL: Gradients use same pattern as DailyMacroGauges
// CRITICAL: Chat bubble uses chart-2 color (green for AI)


// Task 4: AnimatedGauges Component
// components/landing/AnimatedGauges.tsx
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
        <div key={macro.name} className="relative p-4 rounded-2xl bg-card border border-border/50 shadow-md">
          {/* Icon badge */}
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-chart-2/10 backdrop-blur-sm border border-border/50 flex items-center justify-center text-xl shadow-lg">
            {macro.icon}
          </div>

          <div className="flex flex-col items-center space-y-3">
            {/* Circular progress */}
            <div className="relative">
              <CircularProgress
                percentage={Math.min(macro.percentage, 100)}
                color={macro.color}
                size={120}
                strokeWidth={10}
                animate={animate}
              />
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-3xl font-bold" style={{ color: macro.color }}>
                  {macro.percentage}%
                </div>
              </div>
            </div>

            {/* Macro name and values */}
            <div className="text-center space-y-1">
              <h4 className="font-bold text-base">{macro.name}</h4>
              <div className="text-sm">
                <span className="font-bold" style={{ color: macro.color }}>
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
              <div className="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/30 text-xs font-semibold text-chart-2">
                Goal Reached! 🎉
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// CRITICAL: Colors match exactly - use design system variables
// CRITICAL: Animation duration 1000ms matches existing app
// CRITICAL: Drop shadow with 40% opacity matches existing
```

### Integration Points
```yaml
ROUTING:
  - Add landing page route: app/landing/page.tsx
  - OR deploy to separate subdomain: landing.macro-tracker.com
  - Consider: Should landing be root (/) and app be /dashboard?

NAVIGATION:
  - From landing → app: Button with href="/dashboard" or "/app"
  - From app → landing: Header link "Marketing Site" (optional)

ANALYTICS (future):
  - Add Plausible or Fathom script to landing layout
  - Track: CTA clicks, scroll depth, time on page
  - Use data-* attributes for event tracking

AUTH FLOW:
  - CTA buttons eventually link to: /auth/signup
  - Implement Supabase Auth UI for trial signup
  - Store trial start date in users table

ENVIRONMENT:
  - No new env vars needed (uses existing Supabase config)
  - Optional: NEXT_PUBLIC_LANDING_URL for canonical URL

FONTS:
  - DM Sans already loaded in app/layout.tsx
  - Applied globally via CSS variable
  - No additional font imports needed

IMAGES:
  - Store screenshots in: public/screenshots/
  - Use Next.js Image component
  - Optimize: quality=90, format=webp
```

## Validation Loop

### Level 1: TypeScript & Build
```bash
# Run these FIRST - fix any errors before proceeding
cd macro-tracker
npm run build

# Expected: No TypeScript errors
# If errors: Read error message, fix types/imports, re-run
```

### Level 2: Visual Inspection
```bash
# Start dev server
npm run dev

# Open in browser: http://localhost:3000/landing

# Manual checklist:
- [ ] Hero section displays with animated gauges
- [ ] All 9 sections render in order
- [ ] CTA buttons styled correctly (blue, rounded-xl, shadow)
- [ ] Scroll animations trigger on viewport enter
- [ ] Responsive: Test mobile (< 640px), tablet, desktop
- [ ] Colors match existing app exactly
- [ ] Typography sizes match specification
- [ ] No layout shift or flickering
```

### Level 3: Design System Consistency Check
```bash
# Compare landing page visually with main app
# Open both: /landing and /dashboard side-by-side

# Verify:
- [ ] Button styles identical (rounded-xl, same padding)
- [ ] Card styles identical (border-border/50, rounded-xl, shadow-md)
- [ ] Colors match (primary blue, chart-2 green, etc.)
- [ ] Typography matches (DM Sans, same sizes)
- [ ] Border radius consistent (12px everywhere)
- [ ] Hover effects similar (scale-105, shadow-lg)
```

### Level 4: Performance & Accessibility
```bash
# Run Lighthouse audit in Chrome DevTools
# Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

# Common fixes:
- Add alt text to all images
- Ensure proper heading hierarchy (h1 → h2 → h3)
- Add aria-labels to CTA buttons
- Optimize images (use WebP, proper sizing)
- Remove unused CSS/JS
```

### Level 5: Responsive Testing
```bash
# Test on multiple devices/viewports
# Chrome DevTools → Device Toolbar

# Test viewports:
- [ ] iPhone SE (375px) - smallest mobile
- [ ] iPhone 14 Pro (393px) - standard mobile
- [ ] iPad (768px) - tablet
- [ ] iPad Pro (1024px) - large tablet
- [ ] Desktop (1280px) - standard desktop
- [ ] Desktop (1920px) - large desktop

# Verify:
- [ ] Text readable (not too small)
- [ ] Buttons touchable (min 44px height)
- [ ] No horizontal scroll
- [ ] Images scale properly
- [ ] Grids stack/reflow correctly
```

### Level 6: Cross-Browser Testing
```bash
# Test in multiple browsers:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

# Known issues to watch for:
- Safari: backdrop-blur may need -webkit prefix
- Firefox: Some Tailwind animations may differ slightly
- Edge: Generally same as Chrome (Chromium-based)
```

## Final Validation Checklist
- [ ] Landing page builds without errors: `npm run build`
- [ ] All 9 sections implemented with correct copy
- [ ] Design matches existing app perfectly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Scroll animations work smoothly
- [ ] CTA buttons styled correctly
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] No console errors or warnings
- [ ] TypeScript strict mode passes
- [ ] Visual comparison with main app confirms consistency
- [ ] All images have alt text
- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## MCP Server Usage During Development

### Supabase MCP
**Use for:**
- Querying existing app database to understand user structure (if needed for auth integration later)
- Creating landing page analytics tables (future enhancement)
- Testing trial signup flow database operations

**Example prompts:**
- "Show me the users table structure from macro tracker database"
- "Create a table for landing page email signups with timestamp and source tracking"
- "Query to count total meals logged (for social proof statistics)"

### shadcn/ui MCP
**Use for:**
- Generating landing page component code quickly
- Understanding Button, Card, Badge component APIs
- Ensuring consistency with existing app components

**Example prompts:**
- "Generate a Hero component with heading, subheadline, and CTA button using shadcn Button"
- "Show me how to create a pricing Card component with shadcn Card and Badge"
- "Create a responsive 3-column grid with shadcn Card for feature showcase"
- "Generate a Dialog component for exit-intent popup"

### Arcon MCP
**Use for:**
- Finding appropriate Lucide icons for landing page sections
- Ensuring icon consistency with existing app

**Example prompts:**
- "Find AI/brain icon from Lucide for AI feature sections"
- "Find checkmark icons from Lucide for feature lists"
- "Find chart/analytics icons from Lucide for dashboard preview callouts"
- "Find trophy/target icon from Lucide for goals section"
- "Find shield/lock icon from Lucide for privacy/security trust badges"
- "Show me messaging/chat icons from Lucide for AI chat examples"

---

## Anti-Patterns to Avoid
- ❌ Don't create new design patterns - reuse existing (Button, Card, etc.)
- ❌ Don't use different colors than design system defines
- ❌ Don't skip 'use client' directive on components with animations/state
- ❌ Don't hardcode CTA links - use placeholder for now, make easily changeable
- ❌ Don't use different border-radius values - always rounded-xl (12px)
- ❌ Don't skip responsive testing - mobile usage is high
- ❌ Don't ignore accessibility - this is a public-facing page
- ❌ Don't use external images without optimization
- ❌ Don't skip metadata/SEO setup
- ❌ Don't create inline styles when Tailwind classes exist

## Copy Source of Truth
**ALL COPY MUST COME FROM:** PRPs/INITIAL.md
- Section headlines
- Subheadlines
- Button text
- Feature descriptions
- AI chat examples
- FAQ answers

**Do not improvise copy** - use exact text from INITIAL.md specification.

---

## Confidence Score: 9/10

**High confidence due to:**
- ✅ Existing design system fully documented (globals.css)
- ✅ Component patterns clear (Button, Card already exist)
- ✅ Copy completely specified (INITIAL.md)
- ✅ Similar patterns exist in app (DailyMacroGauges as reference)
- ✅ No complex data fetching (static landing page)
- ✅ Next.js App Router well-documented
- ✅ All dependencies already installed (except framer-motion)
- ✅ Clear success criteria and validation steps
- ✅ Responsive design patterns established in existing app

**Minor uncertainty:**
- ⚠️ Framer Motion may need installation (check package.json first)
- ⚠️ Screenshot placeholders need to be replaced with actual screenshots manually
- ⚠️ Exact scroll animation timing may need tweaking for best UX
- ⚠️ CTA button doesn't have real auth flow yet (will need future implementation)

**This PRP should result in one-pass implementation success because:**
1. All context is provided (design system, existing patterns, copy)
2. Task breakdown is sequential and detailed
3. Validation gates at each level ensure quality
4. MCP servers available for specific needs (icons, components)
5. Anti-patterns clearly documented
6. Success criteria specific and measurable

**Next steps after implementation:**
1. Take high-quality screenshots of actual dashboard
2. Replace placeholder images in public/screenshots/
3. Implement actual trial signup flow with Supabase Auth
4. Add analytics tracking (Plausible/Fathom)
5. A/B test headlines and CTA copy
6. Monitor conversion rates and iterate
