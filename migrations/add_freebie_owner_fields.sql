-- Migration: Add owner fields for freebie events
-- Allows linking freebie events to specific customer emails and user IDs
-- Does NOT affect existing Stripe payment logic

-- Add ownerId column - will be set when customer logs in/signs up
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_id text;

-- Add ownerEmail column - stores the email address assigned by admin when creating freebie
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_email text;

-- Add paymentType column to clarify payment status without changing Stripe logic
-- Values: 'stripe' (paid via Stripe), 'freebie' (complimentary), NULL (legacy events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('stripe', 'freebie', NULL));

-- Create indexes for owner-based queries (used when loading dashboard)
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_owner_email ON public.events(owner_email);
CREATE INDEX IF NOT EXISTS idx_events_payment_type ON public.events(payment_type);

-- Create composite index for claiming freebie events by email
CREATE INDEX IF NOT EXISTS idx_events_freebie_unclaimed 
  ON public.events(owner_email, is_freebie) 
  WHERE is_freebie = true AND owner_id IS NULL;
