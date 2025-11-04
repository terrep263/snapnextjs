-- Migration to update affiliate system to 60% commission and 90-day expiration
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add program_expires_at column if it doesn't exist
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS program_expires_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Update commission_rate default to 60%
ALTER TABLE affiliates ALTER COLUMN commission_rate SET DEFAULT 60.00;

-- Step 3: Update existing affiliates' commission_rate to 60% if still at default 20%
UPDATE affiliates 
SET commission_rate = 60.00 
WHERE commission_rate = 20.00;

-- Step 4: Set program expiration to 90 days from creation for all active affiliates
UPDATE affiliates 
SET program_expires_at = created_at + INTERVAL '90 days',
    status = CASE 
        WHEN created_at + INTERVAL '90 days' < NOW() THEN 'expired'
        ELSE status 
    END
WHERE program_expires_at IS NULL;

-- Step 5: Update status check constraint to include 'expired'
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_status_check;
ALTER TABLE affiliates ADD CONSTRAINT affiliates_status_check CHECK (status IN ('active', 'suspended', 'inactive', 'expired'));

-- Step 6: Create a function to auto-expire affiliate programs
CREATE OR REPLACE FUNCTION check_affiliate_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if affiliate program has expired
    IF NEW.status != 'expired' AND NEW.program_expires_at < NOW() THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to check expiration on any affiliate update
DROP TRIGGER IF EXISTS affiliate_expiration_check_trigger ON affiliates;
CREATE TRIGGER affiliate_expiration_check_trigger
    BEFORE UPDATE ON affiliates
    FOR EACH ROW EXECUTE FUNCTION check_affiliate_expiration();

-- Step 8: Create function to validate affiliate is still within program before creating referral
CREATE OR REPLACE FUNCTION validate_affiliate_active(affiliate_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_active BOOLEAN;
BEGIN
    SELECT 
        (status = 'active' AND (program_expires_at IS NULL OR program_expires_at > NOW()))
    INTO is_active
    FROM affiliates
    WHERE id = affiliate_id;
    
    RETURN COALESCE(is_active, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add index on program_expires_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_affiliates_program_expires_at ON affiliates(program_expires_at);

-- Verify the changes
SELECT id, name, email, commission_rate, status, created_at, program_expires_at, (program_expires_at - NOW()) as days_remaining
FROM affiliates
ORDER BY created_at DESC;
