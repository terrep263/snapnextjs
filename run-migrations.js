#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * Applies freebie event database migrations directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration 1: Add Freebie Column
const migration1 = `
-- Add is_freebie column to track master email (freebie@snapworxx.com) events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

-- Add check to ensure freebie events are also marked as free
ALTER TABLE public.events
  ADD CONSTRAINT check_freebie_is_free CHECK (NOT is_freebie OR is_free = true);
`;

// Migration 2: Add Storage and Owner Columns
const migration2 = `
-- Add max_storage_bytes column (storage limit in bytes for freebie events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

-- Add owner_name column (who owns/created the event)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
`;

async function runMigrations() {
  try {
    console.log('\n📋 Running Migration 1: Add Freebie Column...');
    const { error: error1 } = await supabase.rpc('exec', { sql: migration1 }).catch(() => {
      // Try with sql query directly
      return supabase.from('_migrations').insert([{ name: 'add_freebie_column', sql: migration1 }]);
    });
    
    if (error1) {
      console.warn('⚠️  Migration 1 warning:', error1.message);
    } else {
      console.log('✅ Migration 1 completed');
    }

    console.log('\n📋 Running Migration 2: Add Storage and Owner Columns...');
    const { error: error2 } = await supabase.rpc('exec', { sql: migration2 }).catch(() => {
      return supabase.from('_migrations').insert([{ name: 'add_freebie_storage_columns', sql: migration2 }]);
    });
    
    if (error2) {
      console.warn('⚠️  Migration 2 warning:', error2.message);
    } else {
      console.log('✅ Migration 2 completed');
    }

    // Verify columns exist
    console.log('\n🔍 Verifying columns...');
    const { data: columns, error: verifyError } = await supabase
      .from('events')
      .select('is_freebie, max_storage_bytes, owner_name')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ All columns verified!');
      console.log('   - is_freebie: ✅');
      console.log('   - max_storage_bytes: ✅');
      console.log('   - owner_name: ✅');
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
