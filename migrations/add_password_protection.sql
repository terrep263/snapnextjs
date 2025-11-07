-- Migration: Add password protection and limits to events table
-- Adds password_hash column for gallery access control

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_password_hash ON public.events(password_hash);
