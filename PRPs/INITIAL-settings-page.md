## FEATURE:

Modern SaaS-style settings page for the macro tracker app with profile management, display preferences, AI coach controls, and account deletion.

**Problem:**
- No centralized place for users to manage their account and preferences
- No way to delete account or export data
- Dark mode exists in CSS but has no toggle UI
- No user control over AI coach conversation history
- Missing measurement unit preferences (metric vs imperial)

**Solution:**
- Create a dedicated `/settings` route with a professional settings page
- Add settings icon (gear cog) to main app header next to AI Coach button
- Implement sections: Profile & Account, Display & Units, AI Coach, Data & Privacy
- Enable dark mode toggle with next-themes library
- Allow users to clear AI coach conversation history
- Provide account deletion flow with data export option
- Match existing design system: gradients, rounded-xl, shadcn/ui components

**Expected Behavior After Implementation:**
- User clicks settings gear icon → Navigates to `/settings` page
- Settings page displays all user info and preferences in organized sections
- User can toggle dark mode → Theme applies immediately across app
- User can clear AI coach history → SessionStorage cleared, toast confirmation
- User can delete account → Confirmation dialog, optional data export, CASCADE delete
- All changes saved to Supabase with loading states and success feedback
- Settings page uses same visual style as rest of app (gradients, cards, animations)

## EXAMPLES:

**Current Implementation:**
- `macro-tracker/app/page.tsx` - Main app layout with header pattern to follow
- `macro-tracker/app/globals.css` - Dark mode CSS variables already defined
- `macro-tracker/components/ui/card.tsx` - Card component with gradient patterns
- `macro-tracker/components/ui/button.tsx` - Button variants and styles
- `macro-tracker/components/ui/input.tsx` - Input component with focus states
- `macro-tracker/components/MacroGoalsForm.tsx` - Dialog pattern with save/loading states
- `macro-tracker/components/AINutritionCoach.tsx` - AI coach with sessionStorage conversation
- `macro-tracker/components/auth/SignupForm.tsx` - Form pattern with validation and icons

**Key Implementation Patterns:**
- Card-based layout with gradient overlays: `bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5`
- Gradient text headers: `bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent`
- Border transitions on hover: `border-border/50 hover:border-primary/30`
- Loading states: Spinner + text (e.g., "Saving...")
- Success feedback: Toast notifications with `sonner` library
- Icons from `lucide-react` (Settings, User, Palette, Bot, Database, Trash2, Download)
- Rounded-xl (12px) borders throughout
- Framer Motion for entrance animations

**Database Schema:**
- `users` table: id, auth_id, email, name, created_at
- Need to add settings storage (see OTHER CONSIDERATIONS)

## DOCUMENTATION:

**Next.js & React:**
- Next.js App Router: https://nextjs.org/docs/app
- React Hooks: useState, useEffect, useRouter

**UI Libraries:**
- shadcn/ui components: https://ui.shadcn.com/
- Radix UI primitives: https://www.radix-ui.com/
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide icons: https://lucide.dev/icons/

**Dark Mode:**
- next-themes: https://github.com/pacocoursey/next-themes
- Implementation guide: https://ui.shadcn.com/docs/dark-mode/next

**Backend:**
- Supabase client: https://supabase.com/docs/reference/javascript/introduction
- Supabase auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

**Existing Codebase Files to Reference:**
- `macro-tracker/app/page.tsx` - Main app layout
- `macro-tracker/app/layout.tsx` - Root layout with font loading
- `macro-tracker/lib/supabase/client.ts` - Supabase client setup
- `macro-tracker/components/ui/*` - All shadcn components
- `macro-tracker/types/database.ts` - Database type definitions

## OTHER CONSIDERATIONS:

**Implementation Requirements:**
- Create new route: `macro-tracker/app/settings/page.tsx`
- Create settings components: `macro-tracker/components/settings/`
  - `ProfileSection.tsx`
  - `DisplaySection.tsx`
  - `AICoachSection.tsx`
  - `DataPrivacySection.tsx`
  - `DangerZoneSection.tsx`
- Modify `macro-tracker/app/page.tsx` to add settings icon to header
- Install `next-themes` package: `npm install next-themes`
- Update `macro-tracker/app/layout.tsx` to wrap with ThemeProvider
- Create database migration: `macro-tracker/supabase/migrations/009_add_user_settings.sql`
- Create custom hook: `macro-tracker/lib/hooks/useUserSettings.ts`

**Database Schema Changes:**
Add `user_settings` table with RLS policies:

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Display & Units
  theme VARCHAR(10) DEFAULT 'auto', -- 'light' | 'dark' | 'auto'
  measurement_units VARCHAR(10) DEFAULT 'metric', -- 'metric' | 'imperial'
  first_day_of_week INTEGER DEFAULT 0, -- 0 = Sunday, 1 = Monday

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Auto-create settings on user signup
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

**Settings Page Structure:**

```
/settings
├─ Header: ← Back to Dashboard | Settings
├─ Profile & Account Card
│  ├─ Display name (editable input with save button)
│  ├─ Email (read-only from auth)
│  └─ Account created date (formatted with date-fns)
├─ Display & Units Card
│  ├─ Theme toggle: Light | Dark | Auto (radio group)
│  ├─ Measurement units: Metric | Imperial (select)
│  └─ First day of week: Sunday | Monday (select)
├─ AI Nutrition Coach Card
│  ├─ Clear conversation history button
│  └─ Confirmation: "This will delete all messages. Continue?"
├─ Data & Privacy Card
│  ├─ Export all data button (downloads JSON)
│  └─ Clear local cache button (wipes sessionStorage)
└─ Danger Zone Card
   └─ Delete account button with confirmation flow
```

**Component Details:**

1. **ProfileSection.tsx**
   - Fetch user data from `users` table via Supabase
   - Display name input with inline edit + save button
   - Email from auth (read-only, grayed out)
   - Format `created_at` with `date-fns` (e.g., "November 7, 2024")
   - Loading state while saving name changes
   - Toast success: "Profile updated!"

2. **DisplaySection.tsx**
   - Fetch settings from `user_settings` table
   - Theme: Radio group with icons (Sun, Moon, Monitor)
   - Auto-save on change (no save button needed)
   - Use `useTheme()` from next-themes to apply immediately
   - Measurement units: Select dropdown (Metric g/kg, Imperial oz/lb)
   - First day of week: Select dropdown (Sunday, Monday)
   - Toast success on each change

3. **AICoachSection.tsx**
   - "Clear Conversation History" button
   - Click → Confirmation dialog: "Delete all AI chat messages?"
   - On confirm: `sessionStorage.removeItem('ai-coach-conversation')`
   - Toast success: "Conversation history cleared"
   - Warning text: "Next time you open AI Coach, it will start fresh"

4. **DataPrivacySection.tsx**
   - "Export All Data" button → Fetches all user data (meals, goals, favorites) as JSON
   - Downloads as `macro-tracker-data-{date}.json`
   - "Clear Local Cache" button → Clears sessionStorage
   - Links to Privacy Policy (stub for now: `/privacy`)
   - Links to Terms of Service (stub for now: `/terms`)

5. **DangerZoneSection.tsx**
   - Red border card with warning icon
   - "Delete My Account" button (destructive variant)
   - Multi-step confirmation:
     1. Dialog: "Are you sure? This cannot be undone."
     2. Option: "Export my data first" (downloads JSON then continues)
     3. Final confirm: Type "DELETE" to confirm
     4. Calls Supabase auth delete + CASCADE deletes all user data
   - Redirects to landing page after deletion
   - Toast: "Your account has been deleted"

**Header Modification (page.tsx):**

```tsx
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
    className="h-12 w-12 p-2"
    onClick={() => router.push('/settings')}
  >
    <Settings className="w-full h-full" />
  </Button>

  {/* Macro Goals Form */}
  <MacroGoalsForm />
</div>
```

**Dark Mode Setup (layout.tsx):**

```tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Toaster position="top-right" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Custom Hook (useUserSettings.ts):**

```tsx
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get user_id from users table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user?.id)
      .single();

    // Get settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userData?.id)
      .single();

    setSettings(settingsData);
    setLoading(false);
  }

  async function updateSettings(updates: Partial<UserSettings>) {
    // Update in database
    // Return success/error
  }

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
```

**Performance Considerations:**
- Settings page loads user data once on mount
- Theme changes apply instantly via next-themes (no page reload)
- Auto-save for toggles, manual save for text inputs
- Optimistic UI updates (apply change immediately, revert on error)
- Toast notifications for all state changes
- Export data streams large datasets (don't load all into memory)

**Edge Cases to Handle:**
- User has no settings row yet → Auto-create on first visit
- Network error during save → Show error toast, revert UI
- User deletes account while logged in → Sign out and redirect
- User changes theme while animations running → No conflicts
- Clear AI history while AI coach open → Sync state between components
- Export data with no logged foods → Return empty meals array
- Delete account fails (network error) → Don't sign user out, show error

**Testing Strategy:**
- Test settings page loads without errors
- Test profile name save with loading/success states
- Test theme toggle applies immediately (check localStorage)
- Test measurement unit save updates database
- Test clear AI history removes sessionStorage
- Test export data downloads valid JSON
- Test delete account flow with confirmation
- Test settings page matches design system (gradients, rounded-xl, etc.)
- Test responsive layout on mobile/tablet
- Test back button returns to main app
- Test all toast notifications appear correctly

**Gotchas:**
- next-themes requires `suppressHydrationWarning` on `<html>` tag
- SessionStorage is per-tab, not global (clearing history only affects current tab)
- Account deletion must sign user out BEFORE deleting (Supabase auth requirement)
- Export data should include timestamp in filename for clarity
- Theme toggle needs `useEffect` to avoid hydration mismatch
- Settings fetch needs auth check (redirect to /signin if not logged in)
- CASCADE delete handles all related data automatically (meals, goals, etc.)
- Must use `useRouter()` from `next/navigation`, not `next/router`

**Dependencies to Install:**
```bash
npm install next-themes
```

**File Size Limits:**
- Keep each settings section component under 200 lines
- Main settings page should be under 300 lines
- useUserSettings hook should be under 150 lines
- Total new code: ~1000-1200 lines across all files

**Styling Consistency:**
- Match existing gradient patterns exactly
- Use same spacing: `space-y-8` between cards, `space-y-4` within cards
- Use same border styles: `border-2` for emphasis, `border` for subtle
- Use same rounded corners: `rounded-xl` (12px)
- Use same transitions: `transition-all duration-200`
- Use same shadows: `shadow-sm` default, `hover:shadow-lg` on hover
- Match color scheme: primary, chart-2, chart-3 for gradients
- Use consistent icon sizing: `w-5 h-5` for inline icons
