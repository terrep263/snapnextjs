-- Migration: Create free_event_claims table for admin magic link system
-- This replaces the old freebie@snapworxx.com system with a token-based claim system
-- Created: 2025-11-27

-- Create free_event_claims table
CREATE TABLE IF NOT EXISTS free_event_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  claimed BOOLEAN DEFAULT FALSE NOT NULL,
  claimed_by_user_id TEXT,
  claimed_at TIMESTAMPTZ,
  event_id TEXT,
  created_by_admin_email TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_free_event_claims_token ON free_event_claims(token);

-- Create index on claimed status for admin filtering
CREATE INDEX IF NOT EXISTS idx_free_event_claims_claimed ON free_event_claims(claimed);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_free_event_claims_created_at ON free_event_claims(created_at DESC);

-- Add foreign key constraint to events table (if event_id is set)
-- Note: We use TEXT for event_id to match the events table id type
ALTER TABLE free_event_claims
  ADD CONSTRAINT fk_free_event_claims_event
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE free_event_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read unclaimed, non-expired tokens (for validation)
CREATE POLICY "Anyone can read valid tokens for claiming"
  ON free_event_claims
  FOR SELECT
  USING (
    claimed = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Policy: Service role can do anything (for admin operations)
CREATE POLICY "Service role has full access"
  ON free_event_claims
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE free_event_claims IS 'Stores admin-generated magic links for free event claims. Replaces the old freebie@snapworxx.com system.';
COMMENT ON COLUMN free_event_claims.token IS 'Unique token for the claim link (e.g., used in /claim/[token])';
COMMENT ON COLUMN free_event_claims.claimed IS 'Whether this link has been used';
COMMENT ON COLUMN free_event_claims.claimed_by_user_id IS 'User ID who claimed this link';
COMMENT ON COLUMN free_event_claims.event_id IS 'Event ID created from this claim';
COMMENT ON COLUMN free_event_claims.created_by_admin_email IS 'Admin who generated this link';
COMMENT ON COLUMN free_event_claims.expires_at IS 'Optional expiration date (default 30 days from creation)';
