-- Migration v2: Risk Mitigation Updates
-- Run this in Supabase SQL Editor

-- R4 FIX: Create atomic increment function for click tracking
-- This prevents race conditions when multiple users click the same link simultaneously
CREATE OR REPLACE FUNCTION increment_clicks(link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE links SET clicks = clicks + 1 WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION increment_clicks(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_clicks(UUID) TO anon;

-- Add index for faster deleted link filtering (R6 optimization)
CREATE INDEX IF NOT EXISTS idx_links_is_deleted ON links(is_deleted) WHERE is_deleted = false;
