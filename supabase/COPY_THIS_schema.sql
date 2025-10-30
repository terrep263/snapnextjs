-- =====================================================
-- SnapWorxx Database Schema - COPY THIS ENTIRE FILE
-- =====================================================
-- Run this in Supabase SQL Editor (New Query)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_status TEXT DEFAULT 'pending' CHECK (stripe_payment_status IN ('pending', 'completed', 'failed')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_email ON public.events(email);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON public.events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON public.events(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active) WHERE is_active = true;

-- PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploader_ip TEXT,
    UNIQUE(event_id, storage_path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON public.photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_storage_path ON public.photos(storage_path);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Allow public read access to events"
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert events"
    ON public.events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update events"
    ON public.events FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to photos"
    ON public.photos FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to photos"
    ON public.photos FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to delete photos"
    ON public.photos FOR DELETE USING (true);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION deactivate_expired_events()
RETURNS INTEGER AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.events
    SET is_active = false
    WHERE is_active = true AND expires_at < NOW();
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
RETURNS TABLE(
    photo_count BIGINT,
    total_size BIGINT,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(p.id)::BIGINT as photo_count,
        COALESCE(SUM(p.file_size), 0)::BIGINT as total_size,
        GREATEST(0, EXTRACT(DAY FROM (e.expires_at - NOW()))::INTEGER) as days_remaining
    FROM public.events e
    LEFT JOIN public.photos p ON p.event_id = e.id
    WHERE e.id = event_uuid
    GROUP BY e.id, e.expires_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! You should see "Success. No rows returned"
-- Next: Run the storage.sql file
-- =====================================================
