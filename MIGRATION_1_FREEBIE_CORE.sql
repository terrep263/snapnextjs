ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
