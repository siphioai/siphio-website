# Database Migration Instructions

## Apply the Goal Sync Migration

To enable real-time goal updates in the UI, you need to run the migration that creates triggers to sync `macro_goals` changes to `daily_summary`.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Copy and paste the contents of `supabase/migrations/004_add_goal_sync_trigger.sql`
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. You should see: "Goal sync trigger created successfully"

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
cd macro-tracker
supabase db push
```

This will apply all pending migrations automatically.

### What This Migration Does

This migration creates:

1. **`sync_goals_to_daily_summary()` Function**: Automatically updates the `daily_summary` table whenever goals are changed
2. **Trigger on `macro_goals`**: Fires the sync function when goals are inserted or updated
3. **Enhanced `update_daily_summary()` Function**: Now includes goal targets when meal items change

### How It Works

When you update your macro goals:
1. The new goals are saved to the `macro_goals` table
2. The trigger fires and updates `daily_summary` with the new targets
3. Supabase real-time broadcasts the `daily_summary` change
4. The `useRealtimeMacros` hook receives the update
5. All UI components (gauges, charts) instantly update with new targets

### Verifying the Migration

After running the migration, you can verify it worked by:

1. Open your app at http://localhost:3002
2. Click **Set Goals** and change your calorie target
3. Save the goals
4. Watch the gauges and percentages update in real-time without refreshing!

### Troubleshooting

If the UI doesn't update automatically:

1. Check the browser console for real-time subscription logs
2. Verify the migration ran successfully in Supabase SQL Editor
3. Make sure your `.env.local` has the correct Supabase credentials
4. Try refreshing the page once to reconnect the real-time subscription
