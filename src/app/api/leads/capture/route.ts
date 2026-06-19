import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * Lead Capture API
 * Stores user information in Supabase for follow-up
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { name, email, source, eventType, formData } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 New lead captured:', { name, email, eventType, source });

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingLead) {
      console.log('⚠️ Lead already exists:', email);
      return NextResponse.json({
        success: true,
        message: 'Lead already in system',
        data: existingLead,
      });
    }

    // Insert new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        source: source || 'event-planner',
        event_type: eventType,
        event_details: formData || {},
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('✅ Lead saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      data,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Lead capture error:', errorMsg);
    return NextResponse.json(
      { error: `Failed to capture lead: ${errorMsg}` },
      { status: 500 }
    );
  }
}
