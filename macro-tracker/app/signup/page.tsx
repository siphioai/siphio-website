import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Start Your Free Trial - Macro Tracker',
  description: 'Create your account and start tracking your macros with AI assistance. No credit card required for 7-day trial.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
