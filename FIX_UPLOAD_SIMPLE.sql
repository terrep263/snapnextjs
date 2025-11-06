-- =====================================================
-- SIMPLE UPLOAD FIX (No special permissions needed)
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: DATABASE TABLES (You have permission for this)
-- =====================================================

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT 'guest@example.com',
  stripe_session_id text UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  file_path text NOT NULL,
  size bigint,
  type text,
  is_video boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 2: DATABASE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_update_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;

-- Create permissive policies for events
CREATE POLICY "events_select_policy" ON public.events
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "events_insert_policy" ON public.events
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "events_update_policy" ON public.events
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "events_delete_policy" ON public.events
FOR DELETE TO anon, authenticated USING (true);

-- Create permissive policies for photos
CREATE POLICY "photos_select_policy" ON public.photos
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "photos_insert_policy" ON public.photos
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "photos_update_policy" ON public.photos
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "photos_delete_policy" ON public.photos
FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- PART 3: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON public.events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Database setup complete! Now configure storage policies via UI.' as status;
