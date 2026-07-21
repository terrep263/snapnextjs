-- ============================================================================
-- Owner identity consolidation  (Audit finding "D — Data consistency")
-- ============================================================================
-- Purpose:
--   Finish consolidating event ownership onto a single column, owner_email.
--   Backing decision (locked): "Owner identity = owner_email only."
--
-- Background:
--   Ownership was historically spread across three columns on `events`:
--     - owner_email : set by paid + unlimited-claim events   (the keeper)
--     - email       : set ONLY by legacy / restricted free-claim events
--     - owner_id    : never written by any application code   (dead)
--   PR #53 already removed all code references to owner_id and standardized
--   the app on owner_email. This script finishes the job at the data layer.
--
-- What this does:
--   Step 1  Backfill owner_email from the legacy `email` column for any row
--           that has an email but no owner_email (the restricted-free events).
--           After this, owner-detection paths keyed on owner_email resolve
--           correctly for every event.
--   Step 2  Drop the unused owner_id column.
--
-- Safety:
--   - Step 1 is idempotent: re-running it changes nothing once backfilled.
--   - Step 2 causes NO data loss: owner_id was never populated (always NULL).
--   - `email` is intentionally KEPT: verifyHostSession() still reads it, and
--     it is the source for the backfill. Not in scope to remove here.
--   - Run in the Supabase SQL editor. Safe to run anytime.
--
-- Reversibility:
--   Step 1 is data-only and harmless.
--   Step 2 (DROP COLUMN) is not auto-reversible, but since owner_id held no
--   data, recreating it is a one-liner if ever needed:
--       ALTER TABLE public.events ADD COLUMN IF NOT EXISTS owner_id text;
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1 — Backfill owner_email from legacy `email`
-- ----------------------------------------------------------------------------
UPDATE public.events
SET    owner_email = email
WHERE  (owner_email IS NULL OR owner_email = '')
  AND  email IS NOT NULL
  AND  email <> '';

-- ----------------------------------------------------------------------------
-- Step 2 — Drop the unused owner_id column
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_events_owner_id;
DROP INDEX IF EXISTS public.idx_events_freebie_unclaimed;  -- references owner_id
ALTER TABLE public.events DROP COLUMN IF EXISTS owner_id;

COMMIT;

-- ============================================================================
-- Verification (run after COMMIT; all three should confirm success)
-- ============================================================================

-- 1) owner_id column is gone (expect 0 rows):
-- SELECT column_name
-- FROM   information_schema.columns
-- WHERE  table_name = 'events' AND column_name = 'owner_id';

-- 2) No event has an email but a missing owner_email (expect 0):
-- SELECT count(*) AS unbackfilled
-- FROM   public.events
-- WHERE  (owner_email IS NULL OR owner_email = '')
--   AND  email IS NOT NULL AND email <> '';

-- 3) Spot-check ownership coverage:
-- SELECT
--   count(*)                                            AS total_events,
--   count(*) FILTER (WHERE owner_email IS NOT NULL
--                     AND owner_email <> '')            AS with_owner_email
-- FROM public.events;
