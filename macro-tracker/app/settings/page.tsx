'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { DisplaySection } from '@/components/settings/DisplaySection';
import { AICoachSection } from '@/components/settings/AICoachSection';
import { SubscriptionSection } from '@/components/settings/SubscriptionSection';
import { DataPrivacySection } from '@/components/settings/DataPrivacySection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <ProfileSection />
          <DisplaySection />
          <AICoachSection />
          <SubscriptionSection />
          <DataPrivacySection />
          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
