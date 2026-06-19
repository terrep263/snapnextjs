-- Migration: Unrestricted (full-feature, no-limit) accounts
-- Adds an admin-managed allowlist of at most 10 owner emails. Every event an
-- allowlisted account creates is stamped premium + no-limits via the existing
-- claim flow. The 10-account hard cap is enforced server-side (see
-- /api/admin/unrestricted-accounts) and backstopped by the trigger below.
-- Created: 2026-06-18

-- 1. Allowlist table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS unrestricted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  label TEXT,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_admin_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Case-insensitive uniqueness on email (one row per email, ever).
CREATE UNIQUE INDEX IF NOT EXISTS idx_unrestricted_accounts_email
  ON unrestricted_accounts (lower(email));

CREATE INDEX IF NOT EXISTS idx_unrestricted_accounts_active
  ON unrestricted_accounts (active);

-- 2. Hard-cap backstop: never allow more than 10 ACTIVE accounts -----------
-- App code enforces this too; the trigger guarantees it even under races or
-- direct SQL access.
CREATE OR REPLACE FUNCTION enforce_unrestricted_account_cap()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Only count rows that will be active after this write.
  IF NEW.active = TRUE THEN
    SELECT COUNT(*) INTO active_count
    FROM unrestricted_accounts
    WHERE active = TRUE
      AND id <> NEW.id;

    IF active_count >= 10 THEN
      RAISE EXCEPTION 'Unrestricted account cap reached (max 10 active accounts)';
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unrestricted_account_cap ON unrestricted_accounts;
CREATE TRIGGER trg_unrestricted_account_cap
  BEFORE INSERT OR UPDATE ON unrestricted_accounts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_unrestricted_account_cap();

-- 3. RLS: service-role only (mirrors free_event_claims) --------------------
ALTER TABLE unrestricted_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access" ON unrestricted_accounts;
CREATE POLICY "Service role has full access"
  ON unrestricted_accounts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Tag claim links as "unlimited" and bind them to an account -----------
ALTER TABLE free_event_claims
  ADD COLUMN IF NOT EXISTS unlimited BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE free_event_claims
  ADD COLUMN IF NOT EXISTS account_email TEXT;

COMMENT ON TABLE unrestricted_accounts IS 'Admin allowlist of <=10 full-feature, no-limit owner accounts. Cap enforced in app + trigger.';
COMMENT ON COLUMN free_event_claims.unlimited IS 'When true, create-event stamps the resulting event premium + no-limits for account_email.';
COMMENT ON COLUMN free_event_claims.account_email IS 'The unrestricted account this link belongs to (set when unlimited = true).';
