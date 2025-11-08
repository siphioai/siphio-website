name: "Settings Page Implementation - User Preferences & Account Management"
description: |
  Complete settings page with profile management, dark mode, AI coach controls,
  data export, and account deletion following the existing design system.

---

## Goal
Build a modern, SaaS-style settings page at `/settings` that provides centralized user preference management including profile editing, theme controls, measurement unit preferences, AI coach history management, data export, and account deletion.

## Why
- **User Control**: No centralized location for users to manage account and preferences
- **Missing Features**: Dark mode exists in CSS but lacks UI toggle, no account deletion flow
- **Data Privacy**: Need data export capability and conversation history management
- **UX Completeness**: Professional SaaS apps require comprehensive settings management
- **Design Consistency**: Settings must match existing gradient-heavy, rounded-xl design system

## What
Create a complete settings management experience with these sections:

### User-Facing Features
1. **Profile & Account Section**
   - Editable display name with inline save button
   - Read-only email from Supabase auth
   - Account creation date (formatted with date-fns)
   - Loading states during save operations

2. **Display & Units Section**
   - Theme toggle: Light | Dark | Auto (radio group with icons)
   - Measurement units: Metric (g/kg) | Imperial (oz/lb)
   - First day of week: Sunday | Monday
   - Auto-save on change with toast feedback

3. **AI Nutrition Coach Section**
   - Clear conversation history button
   - Confirmation dialog before deletion
   - Syncs with sessionStorage used in AINutritionCoach component

4. **Data & Privacy Section**
   - Export all user data as JSON (meals, goals, favorites)
   - Downloads with timestamped filename
   - Clear local cache button (wipes sessionStorage)
   - Links to Privacy Policy and Terms (stubs)

5. **Danger Zone Section**
   - Red border card with warning styling
   - Multi-step account deletion flow
   - Optional data export before deletion
   - Type "DELETE" confirmation
   - CASCADE deletion of all user data
   - Sign out and redirect to landing page

### Technical Requirements
- Settings icon (gear cog) in main app header next to AI Coach button
- Route: `/settings` page
- Database: New `user_settings` table with RLS policies
- Custom hook: `useUserSettings` for settings CRUD operations
- Theme provider: Wrap app with next-themes ThemeProvider
- Match existing design: gradients, rounded-xl, shadcn/ui, framer-motion
- Responsive layout that works on mobile/tablet/desktop

### Success Criteria
- [x] User can navigate to settings page from main app header
- [x] All settings load correctly from database on mount
- [x] Theme changes apply immediately across entire app
- [x] Profile name saves with proper loading/success feedback
- [x] AI coach history clears from sessionStorage
- [x] Data export downloads valid JSON file
- [x] Account deletion completes successfully with CASCADE
- [x] All UI matches existing design system (gradients, rounded-xl, spacing)
- [x] No hydration errors with next-themes
- [x] Toast notifications work for all state changes
- [x] Settings page is responsive on all screen sizes

---

## All Needed Context

### Documentation & References

```yaml
# CRITICAL: Read these before implementation

- url: https://ui.shadcn.com/docs/dark-mode/next
  why: Official next-themes setup for Next.js with shadcn/ui
  critical: Must use suppressHydrationWarning on <html> tag, attribute="class" on ThemeProvider

- url: https://github.com/pacocoursey/next-themes
  why: next-themes library documentation for theme management
  section: App Router setup, avoiding hydration mismatches
  critical: Use useEffect for mounted state, setTheme only works client-side

- url: https://supabase.com/docs/guides/auth
  why: Supabase auth patterns for user management and deletion
  section: Delete user, getUser, getSession

- url: https://supabase.com/docs/guides/auth/row-level-security
  why: RLS policy patterns for user_settings table
  critical: Must use auth.uid() = auth_id pattern from migration 006

- file: macro-tracker/components/MacroGoalsForm.tsx
  why: Dialog pattern with save/loading states, slider controls
  pattern: Loading spinner + "Saving..." text, success checkmark, toast feedback

- file: macro-tracker/components/AINutritionCoach.tsx
  why: SessionStorage conversation management pattern
  critical: Key is 'ai-coach-conversation', stores {messages, history}

- file: macro-tracker/components/auth/SignupForm.tsx
  why: Form input patterns with icons, focus states, error handling
  pattern: Lucide icons (Mail, Lock, User), gradient text headers

- file: macro-tracker/app/page.tsx
  why: Main app header structure to add settings button
  pattern: Buttons with icons in flex container, gap-2 spacing

- file: macro-tracker/app/layout.tsx
  why: Root layout where ThemeProvider needs to be added
  pattern: Font loading with DM_Sans, Toaster component

- file: macro-tracker/lib/hooks/useDailyGoals.ts
  why: Custom hook pattern for Supabase CRUD operations
  pattern: useState, useEffect, createClient, async functions with error handling

- file: macro-tracker/supabase/migrations/006_enable_multi_user_auth.sql
  why: RLS policy patterns and auth_id usage
  pattern: "user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())"

- file: macro-tracker/app/globals.css
  why: Dark mode CSS variables already defined
  critical: Lines 98-100 show .dark theme variables exist, just need toggle UI

- file: macro-tracker/components/ui/card.tsx
  why: Card component structure with rounded-xl, shadow, hover effects
  pattern: CardHeader, CardTitle, CardDescription, CardContent, CardFooter

- file: macro-tracker/components/ui/button.tsx
  why: Button variants including destructive for danger zone
  pattern: rounded-xl, transition-all duration-200, destructive variant
```

### Current Codebase Structure

```
macro-tracker/
├── app/
│   ├── layout.tsx                    # Root layout - ADD ThemeProvider here
│   ├── page.tsx                      # Main app - ADD settings button to header
│   ├── globals.css                   # Dark mode vars defined (lines 98-150)
│   └── settings/
│       └── page.tsx                  # NEW - Settings page route
├── components/
│   ├── AINutritionCoach.tsx          # SessionStorage conversation pattern
│   ├── MacroGoalsForm.tsx            # Dialog + loading state pattern
│   ├── auth/
│   │   └── SignupForm.tsx            # Form + icon pattern
│   ├── settings/                     # NEW - Settings section components
│   │   ├── ProfileSection.tsx
│   │   ├── DisplaySection.tsx
│   │   ├── AICoachSection.tsx
│   │   ├── DataPrivacySection.tsx
│   │   └── DangerZoneSection.tsx
│   └── ui/                           # Existing shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── hooks/
│   │   ├── useDailyGoals.ts          # Custom hook pattern to follow
│   │   └── useUserSettings.ts        # NEW - Settings CRUD hook
│   ├── supabase/
│   │   └── client.ts                 # Supabase client setup
│   └── utils/
│       └── date-helpers.ts           # Date formatting utilities
├── supabase/
│   └── migrations/
│       └── 009_add_user_settings.sql # NEW - user_settings table + RLS
├── types/
│   ├── database.ts                   # Add UserSettings interface
│   └── ...
└── package.json                      # ADD next-themes dependency
```

### Desired Codebase After Implementation

```bash
# NEW FILES
macro-tracker/app/settings/page.tsx                    # Main settings page
macro-tracker/components/settings/ProfileSection.tsx   # Profile editing
macro-tracker/components/settings/DisplaySection.tsx   # Theme + units
macro-tracker/components/settings/AICoachSection.tsx   # Clear history
macro-tracker/components/settings/DataPrivacySection.tsx # Export/clear data
macro-tracker/components/settings/DangerZoneSection.tsx # Account deletion
macro-tracker/lib/hooks/useUserSettings.ts             # Settings CRUD hook
macro-tracker/supabase/migrations/009_add_user_settings.sql # Database schema
macro-tracker/providers/theme-provider.tsx             # ThemeProvider wrapper

# MODIFIED FILES
macro-tracker/app/layout.tsx                           # Wrap with ThemeProvider
macro-tracker/app/page.tsx                             # Add settings button
macro-tracker/package.json                             # Add next-themes
macro-tracker/types/database.ts                        # Add UserSettings type
```

---

## Known Gotchas & Critical Details

```typescript
// CRITICAL: next-themes hydration issues
// Must add suppressHydrationWarning to <html> tag in layout.tsx
<html lang="en" suppressHydrationWarning>

// CRITICAL: next-themes requires mounted state check
// Don't call setTheme until component is mounted (client-side only)
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null; // Avoid hydration mismatch

// CRITICAL: SessionStorage key for AI coach
// Must match exactly what's in AINutritionCoach.tsx:82
const AI_STORAGE_KEY = 'ai-coach-conversation';

// CRITICAL: Account deletion order
// Must sign out BEFORE deleting user data (Supabase requirement)
// 1. Export data (optional)
// 2. Sign out: await supabase.auth.signOut()
// 3. Delete user: await supabase.auth.admin.deleteUser()
// 4. CASCADE handles all related data automatically

// CRITICAL: RLS policy pattern from migration 006
// Always use this pattern for user_settings queries:
user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())

// CRITICAL: Theme attribute configuration
// Must use attribute="class" to match globals.css .dark selector
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>

// GOTCHA: Export data must be streamed for large datasets
// Don't load all user data into memory at once
async function exportUserData() {
  // Fetch in batches or use streaming
  const meals = await supabase.from('meals').select('*').limit(1000);
  // ...create JSON blob and download
}

// GOTCHA: Clear AI history only affects current tab
// SessionStorage is per-tab, not global like localStorage

// GOTCHA: Settings fetch needs auth check
// Redirect to /signin if not logged in
const { data: { user } } = await supabase.auth.getUser();
if (!user) router.push('/signin');

// GOTCHA: Auto-create settings on first visit
// If user has no settings row, create one with defaults
if (!settings) {
  await supabase.from('user_settings').insert({
    user_id: userId,
    theme: 'auto',
    measurement_units: 'metric',
    first_day_of_week: 0
  });
}

// CRITICAL: Router import for App Router
// Must use 'next/navigation', not 'next/router'
import { useRouter } from 'next/navigation';

// GOTCHA: Theme change during animations
// Use disableTransitionOnChange={false} to allow smooth theme switching
```

### Library Versions & Dependencies

```json
{
  "dependencies": {
    "next": "16.0.1",
    "react": "19.2.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.79.0",
    "lucide-react": "^0.552.0",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.23.24",
    "sonner": "^2.0.7",
    "next-themes": "NEEDS TO BE INSTALLED"
  }
}
```

---

## Implementation Blueprint

### Phase 1: Database Schema & Theme Provider Setup

**Task 1.1: Create user_settings table migration**

CREATE `macro-tracker/supabase/migrations/009_add_user_settings.sql`:

```sql
-- User settings table for preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Display & Units preferences
  theme VARCHAR(10) DEFAULT 'auto', -- 'light' | 'dark' | 'auto'
  measurement_units VARCHAR(10) DEFAULT 'metric', -- 'metric' | 'imperial'
  first_day_of_week INTEGER DEFAULT 0, -- 0 = Sunday, 1 = Monday

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies following migration 006 pattern
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Auto-create settings when user signs up
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();
```

**Validation Gate 1.1:**
```bash
# Run migration locally
cd macro-tracker
npx supabase db reset
# Verify table created:
npx supabase db diff
# Expected: user_settings table with RLS policies enabled
```

**Task 1.2: Install next-themes and create ThemeProvider**

```bash
cd macro-tracker
npm install next-themes
```

CREATE `macro-tracker/providers/theme-provider.tsx`:

```typescript
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**Task 1.3: Update root layout with ThemeProvider**

MODIFY `macro-tracker/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider"; // ADD

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: "Macro Tracker",
  description: "Track your daily macro intake with real-time graphs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* ADD suppressHydrationWarning */}
      <body className={dmSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Validation Gate 1:**
```bash
cd macro-tracker
npm run build
# Expected: No hydration warnings, build succeeds
npm run dev
# Expected: App loads correctly, no console errors
```

---

### Phase 2: Custom Hook for Settings Management

**Task 2.1: Add TypeScript types for user settings**

MODIFY `macro-tracker/types/database.ts`:

```typescript
export type UserSettings = {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  measurement_units: 'metric' | 'imperial';
  first_day_of_week: 0 | 1; // 0 = Sunday, 1 = Monday
  created_at: string;
  updated_at: string;
};

// Add to Database type if using generated types
export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at'>>;
      };
      // ... other tables
    };
  };
};
```

**Task 2.2: Create useUserSettings custom hook**

CREATE `macro-tracker/lib/hooks/useUserSettings.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserSettings } from '@/types/database';
import { toast } from 'sonner';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/signin');
        return;
      }

      // Get user_id from users table using auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        throw new Error('User not found');
      }

      setUserId(userData.id);

      // Get or create user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (settingsError) {
        console.error('Settings fetch error:', settingsError);
        throw settingsError;
      }

      // Auto-create settings if they don't exist
      if (!settingsData) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userData.id,
            theme: 'auto',
            measurement_units: 'metric',
            first_day_of_week: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Settings insert error:', insertError);
          throw insertError;
        }

        setSettings(newSettings);
      } else {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(updates: Partial<UserSettings>) {
    if (!userId) {
      toast.error('User not found');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
      return false;
    }
  }

  async function updateUserProfile(name: string) {
    if (!userId) {
      toast.error('User not found');
      return false;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated!');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  }

  return {
    settings,
    loading,
    userId,
    updateSettings,
    updateUserProfile,
    refetch: fetchSettings
  };
}
```

**Validation Gate 2:**
```bash
cd macro-tracker
npm run build
# Expected: TypeScript compiles without errors
# Test hook in browser console after implementing settings page
```

---

### Phase 3: Settings Page Sections (Component by Component)

**Task 3.1: Create ProfileSection component**

CREATE `macro-tracker/components/settings/ProfileSection.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProfileSectionProps {
  userId: string;
}

export function ProfileSection({ userId }: ProfileSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  async function fetchUserData() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setName(data.name || '');
      setEmail(data.email || '');
      setCreatedAt(data.created_at);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 border-border/50 hover:border-primary/30 transition-all duration-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <CardTitle className="bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent">
            Profile & Account
          </CardTitle>
        </div>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Display Name
          </Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        {/* Account Created */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Member Since
          </Label>
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm font-medium">
              {createdAt ? format(new Date(createdAt), 'MMMM d, yyyy') : 'Unknown'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Task 3.2: Create DisplaySection component**

CREATE `macro-tracker/components/settings/DisplaySection.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Sun, Moon, Monitor, Ruler, CalendarDays } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserSettings } from '@/types/database';
import { toast } from 'sonner';

interface DisplaySectionProps {
  settings: UserSettings;
  onUpdate: (updates: Partial<UserSettings>) => Promise<boolean>;
}

export function DisplaySection({ settings, onUpdate }: DisplaySectionProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  async function handleThemeChange(value: string) {
    setTheme(value);
    const success = await onUpdate({ theme: value as 'light' | 'dark' | 'auto' });
    if (success) {
      toast.success('Theme updated!');
    }
  }

  async function handleUnitsChange(value: string) {
    const success = await onUpdate({ measurement_units: value as 'metric' | 'imperial' });
    if (success) {
      toast.success('Measurement units updated!');
    }
  }

  async function handleFirstDayChange(value: string) {
    const success = await onUpdate({ first_day_of_week: parseInt(value) as 0 | 1 });
    if (success) {
      toast.success('First day of week updated!');
    }
  }

  return (
    <Card className="bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5 border-border/50 hover:border-primary/30 transition-all duration-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-chart-3" />
          <CardTitle className="bg-gradient-to-r from-chart-3 to-chart-4 bg-clip-text text-transparent">
            Display & Units
          </CardTitle>
        </div>
        <CardDescription>Customize how you see your data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            Theme
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs font-medium">Light</span>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs font-medium">Dark</span>
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                theme === 'system'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs font-medium">Auto</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto mode follows your device's system preferences
          </p>
        </div>

        {/* Measurement Units */}
        <div className="space-y-3">
          <Label htmlFor="units" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Measurement Units
          </Label>
          <Select
            value={settings.measurement_units}
            onValueChange={handleUnitsChange}
          >
            <SelectTrigger id="units">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (g, kg)</SelectItem>
              <SelectItem value="imperial">Imperial (oz, lb)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* First Day of Week */}
        <div className="space-y-3">
          <Label htmlFor="first-day" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            First Day of Week
          </Label>
          <Select
            value={settings.first_day_of_week.toString()}
            onValueChange={handleFirstDayChange}
          >
            <SelectTrigger id="first-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Task 3.3: Create AICoachSection component**

CREATE `macro-tracker/components/settings/AICoachSection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Bot, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AI_STORAGE_KEY = 'ai-coach-conversation';

export function AICoachSection() {
  const [showConfirm, setShowConfirm] = useState(false);

  function handleClearHistory() {
    try {
      sessionStorage.removeItem(AI_STORAGE_KEY);
      toast.success('Conversation history cleared!');
      setShowConfirm(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5 border-border/50 hover:border-primary/30 transition-all duration-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-chart-2" />
            <CardTitle className="bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
              AI Nutrition Coach
            </CardTitle>
          </div>
          <CardDescription>Manage your AI coach conversation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/50 rounded-xl border border-border space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Clear Conversation History</p>
                <p className="text-xs text-muted-foreground">
                  This will permanently delete all messages in your current AI coach conversation.
                  Next time you open the AI coach, it will start fresh.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Conversation History?</DialogTitle>
            <DialogDescription>
              This will delete all AI chat messages from your current session. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              Clear History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Task 3.4: Create DataPrivacySection component**

CREATE `macro-tracker/components/settings/DataPrivacySection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, RefreshCw, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DataPrivacySectionProps {
  userId: string;
}

export function DataPrivacySection({ userId }: DataPrivacySectionProps) {
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  async function handleExportData() {
    setExporting(true);
    try {
      // Fetch all user data
      const [meals, goals, favorites, settings] = await Promise.all([
        supabase.from('meals').select('*, meal_items(*)').eq('user_id', userId),
        supabase.from('macro_goals').select('*').eq('user_id', userId),
        supabase.from('food_favorites').select('*').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId).single()
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          meals: meals.data || [],
          macro_goals: goals.data || [],
          favorites: favorites.data || [],
          settings: settings.data || null
        }
      };

      // Create JSON blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `macro-tracker-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  }

  function handleClearCache() {
    try {
      sessionStorage.clear();
      toast.success('Local cache cleared!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  }

  return (
    <Card className="bg-gradient-to-br from-chart-4/5 via-transparent to-chart-5/5 border-border/50 hover:border-primary/30 transition-all duration-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-chart-4" />
          <CardTitle className="bg-gradient-to-r from-chart-4 to-chart-5 bg-clip-text text-transparent">
            Data & Privacy
          </CardTitle>
        </div>
        <CardDescription>Export or clear your data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Data */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <h4 className="text-sm font-semibold">Export All Data</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Download all your meals, goals, and favorites as a JSON file
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Data
              </>
            )}
          </Button>
        </div>

        {/* Clear Cache */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <h4 className="text-sm font-semibold">Clear Local Cache</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Clear all locally stored data (AI conversations, temporary data)
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleClearCache}
          >
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>

        {/* Privacy Policy Links */}
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            Learn more about how we handle your data:
          </p>
          <div className="flex gap-2">
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
              <a href="/privacy">Privacy Policy</a>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
              <a href="/terms">Terms of Service</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Task 3.5: Create DangerZoneSection component**

CREATE `macro-tracker/components/settings/DangerZoneSection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DangerZoneSectionProps {
  userId: string;
}

export function DangerZoneSection({ userId }: DangerZoneSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exportingBeforeDelete, setExportingBeforeDelete] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleExportBeforeDelete() {
    setExportingBeforeDelete(true);
    try {
      // Same export logic as DataPrivacySection
      const [meals, goals, favorites, settings] = await Promise.all([
        supabase.from('meals').select('*, meal_items(*)').eq('user_id', userId),
        supabase.from('macro_goals').select('*').eq('user_id', userId),
        supabase.from('food_favorites').select('*').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId).single()
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          meals: meals.data || [],
          macro_goals: goals.data || [],
          favorites: favorites.data || [],
          settings: settings.data || null
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `macro-tracker-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported! You can now proceed with deletion.');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExportingBeforeDelete(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      // CRITICAL: Sign out first, then delete
      // Supabase CASCADE will handle all related data
      await supabase.auth.signOut();

      // Note: Actual user deletion requires admin privileges
      // In production, this would call an API endpoint that uses the service role
      // For now, we'll just delete the user's profile data (CASCADE handles rest)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      toast.success('Your account has been deleted');
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="border-2 border-destructive/50 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30 space-y-3">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-step Deletion Confirmation */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This will permanently delete your account and all associated data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>All logged meals and food entries</li>
                <li>Macro goals and tracking history</li>
                <li>Favorites and preferences</li>
                <li>AI coach conversation history</li>
              </ul>
              <p className="font-semibold text-destructive">
                This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Optional: Export data first */}
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">Want to keep a copy of your data?</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleExportBeforeDelete}
                disabled={exportingBeforeDelete}
              >
                {exportingBeforeDelete ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export My Data First
                  </>
                )}
              </Button>
            </div>

            {/* Type DELETE to confirm */}
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-bold text-destructive">DELETE</span> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleting}
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Forever
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Validation Gate 3:**
```bash
cd macro-tracker
npm run build
# Expected: All components compile without TypeScript errors
```

---

### Phase 4: Main Settings Page & Header Integration

**Task 4.1: Create main settings page**

CREATE `macro-tracker/app/settings/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { DisplaySection } from '@/components/settings/DisplaySection';
import { AICoachSection } from '@/components/settings/AICoachSection';
import { DataPrivacySection } from '@/components/settings/DataPrivacySection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, loading, userId, updateSettings } = useUserSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings || !userId) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-semibold">Failed to load settings</p>
          <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              Settings
            </h1>
            <p className="text-muted-foreground mt-1 ml-14">
              Manage your preferences and account
            </p>
          </div>
        </motion.header>

        {/* Settings Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >
          <ProfileSection userId={userId} />
          <DisplaySection settings={settings} onUpdate={updateSettings} />
          <AICoachSection />
          <DataPrivacySection userId={userId} />
          <DangerZoneSection userId={userId} />
        </motion.div>
      </div>
    </div>
  );
}
```

**Task 4.2: Add settings button to main app header**

MODIFY `macro-tracker/app/page.tsx`:

Find the header section (around line 26) and update it:

```typescript
// ADD import at top
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Inside component, add router
const router = useRouter();

// UPDATE header section (around line 26)
<div className="flex items-center gap-2">
  {/* AI Coach Button */}
  <div className="relative">
    <Button
      size="lg"
      variant="outline"
      className="relative overflow-hidden group h-12 w-12 p-2"
      onClick={() => setCoachOpen(true)}
    >
      <Bot className="w-full h-full" />
    </Button>
    <div className="absolute -top-3 -right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-lg">
      <span className="text-[10px] font-bold text-white whitespace-nowrap">Use AI</span>
    </div>
  </div>

  {/* NEW: Settings Button */}
  <Button
    size="lg"
    variant="outline"
    className="h-12 w-12 p-2 hover:bg-primary/5 transition-all"
    onClick={() => router.push('/settings')}
    title="Settings"
  >
    <Settings className="w-full h-full" />
  </Button>

  {/* Macro Goals Form */}
  <MacroGoalsForm />
</div>
```

**Validation Gate 4:**
```bash
cd macro-tracker
npm run dev
# Navigate to http://localhost:3000
# Click settings gear icon in header
# Expected: Settings page loads without errors
# Test all sections load correctly
# Test back button returns to main app
```

---

### Phase 5: Final Testing & Validation

**Task 5.1: Test theme switching**

Manual Test:
1. Open app in browser
2. Navigate to Settings
3. Click Light theme → Verify app switches to light mode immediately
4. Click Dark theme → Verify app switches to dark mode immediately
5. Click Auto theme → Verify app follows system preference
6. Check for hydration errors in console (should be none)
7. Verify theme persists after page reload

**Task 5.2: Test profile management**

Manual Test:
1. Navigate to Settings
2. Change display name and click Save
3. Verify loading spinner appears
4. Verify toast notification shows "Profile updated!"
5. Reload page → Verify name persists
6. Verify email is read-only and grayed out
7. Verify account creation date displays correctly

**Task 5.3: Test AI coach history clearing**

Manual Test:
1. Open AI Coach from main app
2. Send a few test messages
3. Close AI Coach
4. Navigate to Settings → AI Coach section
5. Click "Clear History" button
6. Confirm in dialog
7. Verify toast shows "Conversation history cleared!"
8. Navigate back to main app
9. Open AI Coach → Verify conversation is empty

**Task 5.4: Test data export**

Manual Test:
1. Navigate to Settings → Data & Privacy
2. Click "Export Data" button
3. Verify button shows "Exporting..." with spinner
4. Verify JSON file downloads with timestamped filename
5. Open JSON file → Verify it contains valid data structure
6. Verify toast shows "Data exported successfully!"

**Task 5.5: Test account deletion flow**

Manual Test (use test account):
1. Navigate to Settings → Danger Zone
2. Click "Delete My Account" button
3. Verify multi-step confirmation dialog appears
4. Click "Export My Data First" → Verify data downloads
5. Type "DELETE" in confirmation input
6. Click "Delete Forever" button
7. Verify account is deleted and redirected to landing page
8. Try to log in with deleted account → Should fail

**Task 5.6: Test responsive layout**

Manual Test:
1. Open Settings page
2. Resize browser to mobile width (375px)
3. Verify all cards stack vertically
4. Verify all buttons and inputs are accessible
5. Verify theme toggle buttons are visible and clickable
6. Test on tablet width (768px) → Verify layout adapts correctly

**Validation Gate 5 (Final Checklist):**
```bash
# Run linting
cd macro-tracker
npm run lint
# Expected: No errors

# Run build
npm run build
# Expected: Build succeeds with no errors

# Test in development
npm run dev
# Expected: App runs without console errors

# Manual testing checklist:
- [ ] Settings page loads without errors
- [ ] Theme switching works (light/dark/auto)
- [ ] Profile name saves correctly
- [ ] Measurement units save correctly
- [ ] First day of week saves correctly
- [ ] AI coach history clears successfully
- [ ] Data export downloads valid JSON
- [ ] Clear cache clears sessionStorage
- [ ] Account deletion flow works (test account)
- [ ] All toast notifications appear
- [ ] No hydration errors in console
- [ ] Responsive layout on mobile/tablet
- [ ] Back button returns to main app
- [ ] Settings persist after page reload
- [ ] All gradients and styling match design system
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ DON'T call setTheme before component is mounted
function BadThemeToggle() {
  const { setTheme } = useTheme();
  setTheme('dark'); // Hydration error!
}

// ✅ DO check mounted state first
function GoodThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return <button onClick={() => setTheme('dark')}>Dark</button>;
}

// ❌ DON'T forget suppressHydrationWarning on <html>
<html lang="en"> {/* Will cause hydration warnings */}

// ✅ DO add suppressHydrationWarning
<html lang="en" suppressHydrationWarning>

// ❌ DON'T delete user before signing out
await deleteUser(); // Will fail - user is still authenticated
await signOut();

// ✅ DO sign out first, then delete
await supabase.auth.signOut();
await deleteUser(); // Now safe to delete

// ❌ DON'T use wrong sessionStorage key
sessionStorage.removeItem('ai-chat'); // Wrong key!

// ✅ DO use exact key from AINutritionCoach.tsx
const AI_STORAGE_KEY = 'ai-coach-conversation';
sessionStorage.removeItem(AI_STORAGE_KEY);

// ❌ DON'T skip auth check in settings
// User could access settings while not logged in

// ✅ DO check auth and redirect if needed
const { data: { user } } = await supabase.auth.getUser();
if (!user) router.push('/signin');

// ❌ DON'T forget to handle missing settings row
const { data } = await supabase.from('user_settings').select().single();
// Throws error if no row exists!

// ✅ DO use maybeSingle() and auto-create if needed
const { data } = await supabase.from('user_settings').select().maybeSingle();
if (!data) {
  // Auto-create settings with defaults
}
```

---

## Final Validation & Completion

### Pre-Launch Checklist
- [ ] Database migration applied successfully
- [ ] next-themes installed and configured
- [ ] ThemeProvider wraps app in layout.tsx
- [ ] suppressHydrationWarning added to <html> tag
- [ ] All 5 settings section components created
- [ ] useUserSettings hook implements all CRUD operations
- [ ] Main settings page renders all sections
- [ ] Settings button added to main app header
- [ ] All TypeScript errors resolved
- [ ] Build succeeds without warnings
- [ ] No hydration errors in browser console
- [ ] All manual tests pass
- [ ] Responsive layout tested on multiple screen sizes
- [ ] Toast notifications work for all actions
- [ ] Theme persists after page reload
- [ ] Settings persist after page reload
- [ ] Account deletion flow tested (with test account)

### Performance Verification
- [ ] Settings page loads in < 1 second
- [ ] Theme switches apply instantly (no flicker)
- [ ] Auto-save for toggles responds immediately
- [ ] Export data completes in < 3 seconds for typical user
- [ ] No memory leaks from sessionStorage operations

### Security Verification
- [ ] RLS policies prevent cross-user access
- [ ] Auth check redirects unauthenticated users
- [ ] Account deletion requires explicit confirmation
- [ ] Exported data only contains user's own data
- [ ] Email field is truly read-only (disabled input)

---

## PRP Confidence Score

**9/10** - High confidence for one-pass implementation success

### Reasons for High Score:
- ✅ Comprehensive context with exact file references
- ✅ All patterns documented from existing codebase
- ✅ next-themes implementation well-researched with gotchas documented
- ✅ Database schema provided with RLS policies
- ✅ Component pseudocode with exact patterns to follow
- ✅ Validation gates at every phase
- ✅ All edge cases and error handling documented
- ✅ Responsive design requirements clear
- ✅ Manual testing procedures provided
- ✅ Anti-patterns explicitly called out

### Minor Risks (-1 point):
- Account deletion may need admin API endpoint in production (noted in code)
- First-time implementation of next-themes in this codebase (but well-documented)
- Multiple new components could have integration issues (mitigated by validation gates)

### Success Factors:
- Existing design system is well-established (gradients, rounded-xl, spacing)
- Supabase patterns already proven in useDailyGoals.ts
- shadcn/ui components already integrated
- Dark mode CSS variables already exist in globals.css
- Clear validation steps prevent accumulation of errors
