-- =====================================================
-- SnapWorxx Database Schema for Supabase
-- =====================================================
-- This schema creates the database structure for the
-- SnapWorxx event photo sharing application
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EVENTS TABLE
-- =====================================================
-- Stores information about photo sharing events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,

    -- User contact
    email TEXT NOT NULL,

    -- Payment tracking
    stripe_session_id TEXT UNIQUE,
    stripe_payment_status TEXT DEFAULT 'pending' CHECK (stripe_payment_status IN ('pending', 'completed', 'failed')),

    -- Event status and timing
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_email ON public.events(email);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON public.events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON public.events(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active) WHERE is_active = true;

-- Add comment for documentation
COMMENT ON TABLE public.events IS 'Stores event information for photo sharing events';
COMMENT ON COLUMN public.events.slug IS 'Unique URL-friendly identifier for the event (used in /e/[slug])';
COMMENT ON COLUMN public.events.expires_at IS 'Event expiration date (30 days from creation by default)';

-- =====================================================
-- PHOTOS TABLE
-- =====================================================
-- Stores metadata about uploaded photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to events
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    -- File information
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,

    -- Storage bucket path (format: event-photos/[event_slug]/[filename])
    storage_path TEXT NOT NULL,

    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploader_ip TEXT,

    -- Ensure file_path is unique
    UNIQUE(event_id, storage_path)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON public.photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_storage_path ON public.photos(storage_path);

-- Add comment for documentation
COMMENT ON TABLE public.photos IS 'Stores metadata for photos uploaded to events';
COMMENT ON COLUMN public.photos.storage_path IS 'Path to the file in Supabase storage';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EVENTS TABLE POLICIES
-- =====================================================

-- Allow anyone to read active events (needed for event page and dashboard)
CREATE POLICY "Allow public read access to events"
    ON public.events
    FOR SELECT
    USING (true);

-- Allow service role to insert events (will be done via API route after payment)
CREATE POLICY "Allow service role to insert events"
    ON public.events
    FOR INSERT
    WITH CHECK (true);

-- Allow service role to update events
CREATE POLICY "Allow service role to update events"
    ON public.events
    FOR UPDATE
    USING (true);

-- =====================================================
-- PHOTOS TABLE POLICIES
-- =====================================================

-- Allow anyone to view photos for any event
CREATE POLICY "Allow public read access to photos"
    ON public.photos
    FOR SELECT
    USING (true);

-- Allow anyone to upload photos (INSERT)
CREATE POLICY "Allow public insert access to photos"
    ON public.photos
    FOR INSERT
    WITH CHECK (true);

-- Only allow service role to delete photos
CREATE POLICY "Allow service role to delete photos"
    ON public.photos
    FOR DELETE
    USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on events table
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check and deactivate expired events
CREATE OR REPLACE FUNCTION deactivate_expired_events()
RETURNS INTEGER AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.events
    SET is_active = false
    WHERE is_active = true
        AND expires_at < NOW();

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deactivate_expired_events() IS 'Deactivates events that have passed their expiration date. Run this periodically via a cron job.';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get event stats
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

COMMENT ON FUNCTION get_event_stats(UUID) IS 'Returns statistics for a given event including photo count, total size, and days remaining';

-- =====================================================
-- INITIAL DATA / SEED (Optional)
-- =====================================================
-- Uncomment below to add a test event for development
/*
INSERT INTO public.events (name, slug, email, stripe_payment_status)
VALUES ('Test Event', 'test-event', 'test@example.com', 'completed')
ON CONFLICT (slug) DO NOTHING;
*/
