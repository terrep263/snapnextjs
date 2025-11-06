-- Add promo free basic event columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_type text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_photos integer;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_free ON public.events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_promo_type ON public.events(promo_type);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON public.events(expires_at);
