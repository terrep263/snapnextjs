-- ============================================================================
-- SnapWorxx — RLS lockdown for events & photos (Item 2 of the storage trio)
-- ============================================================================
-- SAFE TO RUN ONLY AFTER the server-side registration route is deployed
-- (PR: fix/uploads-serverside-writes). That route moves the app's photo/event
-- writes to the service role, so the anon key no longer needs INSERT/UPDATE/
-- DELETE. Public galleries still READ via the anon key, so anon SELECT stays.
--
-- What this does:
--   - Keeps anon + authenticated SELECT (galleries read client-side).
--   - Removes anon/authenticated INSERT / UPDATE / DELETE (only the service
--     role, which bypasses RLS, may write).
-- Effect: a leaked anon key can no longer delete events, wipe photos, or
-- inject rows — the core finding in AUDIT_02.
--
-- Run in Supabase SQL editor. Reversible via the rollback block at the bottom.
-- ============================================================================

-- Drop the permissive full-CRUD policies from fix_rls_policies.sql
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;

DROP POLICY IF EXISTS "photos_select_policy" ON photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON photos;
DROP POLICY IF EXISTS "photos_update_policy" ON photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON photos;
DROP POLICY IF EXISTS "Allow all operations on photos" ON photos;

-- Read-only for anon/authenticated. Writes go through the service role only.
CREATE POLICY "events_select_readonly" ON events
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "photos_select_readonly" ON photos
  FOR SELECT TO anon, authenticated USING (true);

-- (No INSERT/UPDATE/DELETE policies for anon/authenticated = those are denied.
--  The service role bypasses RLS entirely, so server routes keep working.)

-- ----------------------------------------------------------------------------
-- VERIFY (should list only the two *_select_readonly SELECT policies):
-- ----------------------------------------------------------------------------
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('events', 'photos')
ORDER BY tablename, cmd;

-- ============================================================================
-- ROLLBACK (re-open full CRUD) — only if uploads/galleries break:
-- ============================================================================
-- CREATE POLICY "events_insert_policy" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
-- CREATE POLICY "events_update_policy" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "events_delete_policy" ON events FOR DELETE TO anon, authenticated USING (true);
-- CREATE POLICY "photos_insert_policy" ON photos FOR INSERT TO anon, authenticated WITH CHECK (true);
-- CREATE POLICY "photos_update_policy" ON photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "photos_delete_policy" ON photos FOR DELETE TO anon, authenticated USING (true);
