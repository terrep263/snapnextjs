import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('events')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError
      }, { status: 500 });
    }

    // Test 2: Check if test event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', 'test')
      .maybeSingle();
    
    // Test 3: Check photos for test event
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', 'test');
    
    // Test 4: Check storage bucket
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    return NextResponse.json({
      success: true,
      tests: {
        connection: { success: !connectionError, error: connectionError },
        event: { 
          success: !eventError, 
          error: eventError,
          data: eventData,
          exists: !!eventData
        },
        photos: { 
          success: !photoError, 
          error: photoError,
          count: photoData?.length || 0,
          data: photoData
        },
        storage: {
          success: !bucketError,
          error: bucketError,
          buckets: buckets?.map(b => b.name) || []
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during database test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}