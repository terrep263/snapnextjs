-- Sprint 1: Core Infrastructure & Database Foundation
-- Database Schema Enhancements
-- Run this migration in your Supabase SQL Editor

-- =====================================================
-- 1. Events Table Enhancements
-- =====================================================

-- Add new columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_webhook_received TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_events_stripe_account ON events(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_events_payment_status ON events(payment_status);
CREATE INDEX IF NOT EXISTS idx_events_last_webhook ON events(last_webhook_received);

-- =====================================================
-- 2. Webhook Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    webhook_type VARCHAR(100) NOT NULL,
    stripe_event_id VARCHAR(255) UNIQUE,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Create indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_stripe_event ON webhook_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(webhook_type);

-- =====================================================
-- 3. Error Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id TEXT,
    event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    request_data JSONB,
    severity VARCHAR(20) DEFAULT 'error',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_event_id ON error_logs(event_id);

-- =====================================================
-- 4. Comments for Documentation
-- =====================================================

COMMENT ON TABLE webhook_logs IS 'Tracks all Stripe webhook events for audit and debugging';
COMMENT ON TABLE error_logs IS 'Centralized error logging for application monitoring';
COMMENT ON COLUMN events.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN events.last_webhook_received IS 'Timestamp of last webhook received for this event';



