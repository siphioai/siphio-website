-- Enable Realtime for daily_summary table
-- This allows the frontend to receive real-time updates when goals are changed

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE daily_summary;

-- Ensure realtime is enabled for daily_summary
ALTER TABLE daily_summary REPLICA IDENTITY FULL;

SELECT 'Realtime enabled for daily_summary' as status;
