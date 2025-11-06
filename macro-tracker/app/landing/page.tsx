import type { Metadata } from 'next';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { AIFeatureShowcase } from '@/components/landing/AIFeatureShowcase';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { AIComparison } from '@/components/landing/AIComparison';
import { AIExamples } from '@/components/landing/AIExamples';
import { PersonaCards } from '@/components/landing/PersonaCards';
import { Pricing } from '@/components/landing/Pricing';
import { FinalCTA } from '@/components/landing/FinalCTA';

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <AIFeatureShowcase />
      <HowItWorks />
      <DashboardPreview />
      <AIComparison />
      <AIExamples />
      <PersonaCards />
      <Pricing />
      <FinalCTA />
    </div>
  );
}
