-- SnapWorxx Discount System Setup
-- Run this in your Supabase SQL Editor

-- Create discount_offers table
CREATE TABLE IF NOT EXISTS discount_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    percent_off INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create discount_requests table for logging email requests
CREATE TABLE IF NOT EXISTS discount_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    discount_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add referral_code column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS referral_code TEXT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discount_offers_active ON discount_offers(active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discount_offers_code ON discount_offers(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_discount_requests_email ON discount_requests(email, created_at DESC);

-- Insert a sample discount offer (you can modify this in Supabase UI)
INSERT INTO discount_offers (code, percent_off, active, description)
VALUES ('SNAP20', 20, true, 'New user discount - 20% off first event')
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE discount_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for discount_offers (public read for active offers)
CREATE POLICY "Anyone can view active discount offers" ON discount_offers
    FOR SELECT USING (active = true);

-- Create policies for discount_requests (allow inserts for logging)
CREATE POLICY "Anyone can create discount requests" ON discount_requests
    FOR INSERT WITH CHECK (true);

-- Show current discount offers
SELECT * FROM discount_offers ORDER BY created_at DESC;