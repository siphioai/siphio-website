-- Create a function to refresh the materialized view
-- This allows us to call it from TypeScript

CREATE OR REPLACE FUNCTION refresh_smart_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_smart_suggestions;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_smart_suggestions() TO authenticated, anon;
