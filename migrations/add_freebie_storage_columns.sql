-- Migration: Add Missing Columns for Freebie Events
-- Adds max_storage_bytes and owner_name columns needed by create-freebie-event API

-- Add max_storage_bytes column (storage limit in bytes for freebie events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999; -- ~1GB default

-- Add owner_name column (who owns/created the event)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);

-- Add comment for documentation
COMMENT ON COLUMN public.events.max_storage_bytes IS 'Maximum storage in bytes for this event. Freebie events get unlimited (999999999 bytes).';
COMMENT ON COLUMN public.events.owner_name IS 'Name of the event owner/creator. Used for freebie events.';
