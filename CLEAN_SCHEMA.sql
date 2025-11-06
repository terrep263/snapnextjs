-- ============================================
-- CLEAN SCHEMA - SnapNextJS Upload System
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text DEFAULT 'guest@example.com',
  stripe_session_id text UNIQUE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  file_path text NOT NULL,
  size bigint,
  type text,
  is_video boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: DROP OLD POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_update_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;

-- ============================================
-- STEP 4: CREATE POLICIES (allow all access)
-- ============================================

-- Events table policies
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (true);

-- Photos table policies
CREATE POLICY "photos_select_policy" ON public.photos
  FOR SELECT USING (true);

CREATE POLICY "photos_insert_policy" ON public.photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "photos_update_policy" ON public.photos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "photos_delete_policy" ON public.photos
  FOR DELETE USING (true);

-- ============================================
-- STEP 5: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON public.events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at);

-- ============================================
-- STEP 6: VERIFICATION
-- ============================================

-- Check tables
SELECT 'Tables created' as status, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'photos');

-- Check policies
SELECT 'Policies created' as status, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('events', 'photos');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ DATABASE SCHEMA SETUP COMPLETE!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ Tables: events, photos';
  RAISE NOTICE '✅ Policies: 8 total (4 per table)';
  RAISE NOTICE '✅ Indexes: 4 total';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ NEXT STEP: Set up storage policies via UI';
  RAISE NOTICE '✅ See STORAGE_SETUP_GUIDE.md for instructions';
  RAISE NOTICE '✅ ============================================';
END $$;
