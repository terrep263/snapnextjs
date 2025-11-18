#!/usr/bin/env node
/**
 * Query Event Information
 * Fetches all data about the steve-s-2025-birthday-qwf1e2 event from Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryEvent() {
  const eventSlug = 'steve-s-2025-birthday-qwf1e2';

  console.log(`🔍 Searching for event: ${eventSlug}\n`);

  try {
    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('slug', eventSlug)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        console.log('❌ Event not found in database\n');
        console.log('This event may only exist in documentation/test files.');
        return;
      }
      throw eventError;
    }

    console.log('✅ EVENT FOUND\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('EVENT DETAILS:');
    console.log('═══════════════════════════════════════════════════');
    console.log(JSON.stringify(event, null, 2));
    console.log('');

    // Get photos for this event
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });

    if (photosError) {
      console.error('⚠️ Error fetching photos:', photosError);
    } else {
      console.log('═══════════════════════════════════════════════════');
      console.log(`PHOTOS: ${photos.length} total`);
      console.log('═══════════════════════════════════════════════════');
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          console.log(`\nPhoto ${index + 1}:`);
          console.log(`  ID: ${photo.id}`);
          console.log(`  Filename: ${photo.filename}`);
          console.log(`  URL: ${photo.url}`);
          console.log(`  Size: ${photo.size ? (photo.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);
          console.log(`  Type: ${photo.type || 'N/A'}`);
          console.log(`  Created: ${photo.created_at}`);
        });
      } else {
        console.log('No photos found for this event.');
      }
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Event URL: https://snapworxx.com/e/${event.slug}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Event Name: ${event.name}`);
    console.log(`Status: ${event.status || 'active'}`);
    console.log(`Created: ${event.created_at}`);
    console.log(`Total Photos: ${photos?.length || 0}`);
    console.log(`Password Protected: ${event.password_hash ? 'Yes' : 'No'}`);
    console.log(`Stripe Session: ${event.stripe_session_id || 'N/A'}`);
    console.log(`Plan Type: ${event.plan_type || 'N/A'}`);
    console.log(`Email: ${event.email || 'N/A'}`);
    console.log(`Header Image: ${event.header_image ? 'Yes' : 'No'}`);
    console.log(`Profile Image: ${event.profile_image ? 'Yes' : 'No'}`);
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

queryEvent();
