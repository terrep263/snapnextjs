-- Migration: Add Free Promo Columns to Events Table
-- This migration adds columns to support the free Basic event promo feature
-- It is non-breaking: all new columns have safe defaults and existing events are unaffected

-- Add is_free column (tracks if this is a promo event)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

-- Add promo_type column (e.g., 'FREE_BASIC' for this promo)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS promo_type text;

-- Add expires_at column (when the free promo event expires)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add max_photos column (photo limit for promo events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_photos integer;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_free ON public.events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_promo_type ON public.events(promo_type);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON public.events(expires_at);
