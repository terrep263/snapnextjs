#!/usr/bin/env node
/**
 * Debug: Check Events in Database
 * Verifies if events exist and shows their structure
 */

import { createClient } from '@supabase/supabase-js';

// You need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEvents() {
  console.log('🔍 Checking events in database...\n');

  try {
    // Get all events
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, email, owner_email, slug, created_at, is_free, is_freebie, payment_type, stripe_session_id, promo_type')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching events:', error);
      return;
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 TOTAL EVENTS: ${events?.length || 0}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (!events || events.length === 0) {
      console.log('⚠️  No events found in database');
      console.log('   This is why the admin dashboard shows an empty event log.\n');
      return;
    }

    // Show first 10 events
    console.log('First 10 events:\n');
    events.slice(0, 10).forEach((event, index) => {
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Email: ${event.email}`);
      console.log(`   Created: ${event.created_at}`);
      console.log(`   Type: ${event.is_freebie ? 'Freebie' : event.is_free ? 'Free' : 'Paid'}`);
      console.log('');
    });

    // Show summary by type
    const freebie = events.filter(e => e.is_freebie).length;
    const free = events.filter(e => e.is_free && !e.is_freebie).length;
    const paid = events.filter(e => !e.is_free && !e.is_freebie).length;

    console.log('═══════════════════════════════════════════════════');
    console.log('EVENT TYPE BREAKDOWN:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Freebie Events: ${freebie}`);
    console.log(`Free Events: ${free}`);
    console.log(`Paid Events: ${paid}`);
    console.log(`Total: ${events.length}`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEvents();
