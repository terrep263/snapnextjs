ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_id text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_email text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_type text;

CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);

CREATE INDEX IF NOT EXISTS idx_events_owner_email ON public.events(owner_email);

CREATE INDEX IF NOT EXISTS idx_events_payment_type ON public.events(payment_type);

CREATE INDEX IF NOT EXISTS idx_events_freebie_unclaimed 
  ON public.events(owner_email, is_freebie) 
  WHERE is_freebie = true AND owner_id IS NULL;
