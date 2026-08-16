-- Harden self-serve free events against abuse.
-- Reversible operations are listed at the bottom of this file.

ALTER TABLE public.free_event_claims
  ADD COLUMN IF NOT EXISTS claim_email_normalized text;

UPDATE public.free_event_claims
SET claim_email_normalized =
  CASE
    WHEN claim_email IS NULL THEN NULL
    WHEN split_part(lower(trim(claim_email)), '@', 2) IN ('gmail.com', 'googlemail.com') THEN
      replace(regexp_replace(split_part(lower(trim(claim_email)), '@', 1), '\+.*$', ''), '.', '')
      || '@' || split_part(lower(trim(claim_email)), '@', 2)
    ELSE
      regexp_replace(split_part(lower(trim(claim_email)), '@', 1), '\+.*$', '')
      || '@' || split_part(lower(trim(claim_email)), '@', 2)
  END
WHERE claim_email IS NOT NULL
  AND claim_email_normalized IS NULL;

DO $$
DECLARE
  idx record;
BEGIN
  FOR idx IN
    SELECT schemaname, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'free_event_claims'
      AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
      AND indexdef ILIKE '%lower%'
      AND indexdef ILIKE '%claim_email%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', idx.schemaname, idx.indexname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_free_event_claims_claim_email_normalized
  ON public.free_event_claims (claim_email_normalized)
  WHERE claim_email_normalized IS NOT NULL
    AND created_at >= '2026-08-16T00:00:00Z'::timestamptz;

CREATE INDEX IF NOT EXISTS idx_free_event_claims_claim_email_normalized
  ON public.free_event_claims (claim_email_normalized);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_date date;

-- Grandfather existing free events so they do not get upload-activation gated.
UPDATE public.events
SET activated_at = COALESCE(activated_at, created_at, now())
WHERE is_free = true
  AND activated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_free_activation
  ON public.events (is_free, activated_at);

CREATE INDEX IF NOT EXISTS idx_events_event_date
  ON public.events (event_date);

COMMENT ON COLUMN public.free_event_claims.claim_email_normalized IS
  'Normalized self-serve free-claim email: lowercased, plus alias removed, Gmail dots removed.';

COMMENT ON COLUMN public.events.activated_at IS
  'For self-serve free events, set when the emailed activation link is clicked. Paid and grandfathered events are not upload-gated by this.';

COMMENT ON COLUMN public.events.event_date IS
  'Stated event date. Free self-serve upload windows are derived from this date.';

-- Rollback notes:
-- DROP INDEX IF EXISTS public.idx_events_event_date;
-- DROP INDEX IF EXISTS public.idx_events_free_activation;
-- DROP INDEX IF EXISTS public.idx_free_event_claims_claim_email_normalized;
-- DROP INDEX IF EXISTS public.uniq_free_event_claims_claim_email_normalized;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS activated_at;
-- ALTER TABLE public.free_event_claims DROP COLUMN IF EXISTS claim_email_normalized;
