-- Add is_freebie column to track master email (freebie@snapworxx.com) events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

-- Note: Constraint already exists if this migration ran before - that's OK!
-- ALTER TABLE public.events ADD CONSTRAINT check_freebie_is_free CHECK (NOT is_freebie OR is_free = true);
