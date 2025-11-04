-- SnapWorxx Affiliate System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Affiliate users table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Can be email or username
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 60.00, -- 60% commission rate
    program_expires_at TIMESTAMP WITH TIME ZONE, -- Program expires 90 days after registration
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    paid_earnings DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate referrals tracking
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    event_id TEXT, -- References events table
    customer_email TEXT NOT NULL,
    referral_code TEXT NOT NULL,
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Affiliate payouts tracking
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT DEFAULT 'paypal' CHECK (method IN ('paypal', 'stripe', 'bank', 'manual')),
    reference_id TEXT, -- PayPal transaction ID, etc.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Add referral_code to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_events_referral_code ON events(referral_code);

-- RLS Policies
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can read affiliate codes" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can read own data" ON affiliates;
DROP POLICY IF EXISTS "Anyone can create referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Affiliates can read own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Affiliates can read own payouts" ON affiliate_payouts;

-- Public read access for affiliate lookup
CREATE POLICY "Public can read affiliate codes" ON affiliates
    FOR SELECT USING (true);

-- Affiliates can only see their own data
CREATE POLICY "Affiliates can read own data" ON affiliates
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Public can insert referrals (for tracking)
CREATE POLICY "Anyone can create referrals" ON affiliate_referrals
    FOR INSERT WITH CHECK (true);

-- Affiliates can read their own referrals
CREATE POLICY "Affiliates can read own referrals" ON affiliate_referrals
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Affiliates can read their own payouts
CREATE POLICY "Affiliates can read own payouts" ON affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Function to update affiliate earnings
CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pending earnings when a new referral is created
    IF TG_OP = 'INSERT' THEN
        UPDATE affiliates 
        SET pending_earnings = pending_earnings + NEW.commission_amount,
            total_earnings = total_earnings + NEW.commission_amount,
            updated_at = NOW()
        WHERE id = NEW.affiliate_id;
    END IF;
    
    -- Update earnings when referral status changes
    IF TG_OP = 'UPDATE' THEN
        -- If status changed from pending to confirmed
        IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
            -- No change needed, already in pending_earnings
            UPDATE affiliates 
            SET updated_at = NOW()
            WHERE id = NEW.affiliate_id;
        END IF;
        
        -- If status changed to paid
        IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
            UPDATE affiliates 
            SET pending_earnings = pending_earnings - NEW.commission_amount,
                paid_earnings = paid_earnings + NEW.commission_amount,
                updated_at = NOW()
            WHERE id = NEW.affiliate_id;
        END IF;
        
        -- If status changed to cancelled
        IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            UPDATE affiliates 
            SET pending_earnings = pending_earnings - NEW.commission_amount,
                total_earnings = total_earnings - NEW.commission_amount,
                updated_at = NOW()
            WHERE id = NEW.affiliate_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for affiliate earnings updates
CREATE TRIGGER affiliate_earnings_trigger
    AFTER INSERT OR UPDATE ON affiliate_referrals
    FOR EACH ROW EXECUTE FUNCTION update_affiliate_earnings();

-- Insert some sample data (optional, for testing)
-- INSERT INTO affiliates (user_id, name, email, referral_code) VALUES
-- ('test@example.com', 'Test Affiliate', 'test@example.com', 'TEST1234');