import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Handle mock sessions for development
    if (sessionId === 'mock_session_id') {
      const mockEvent = {
        id: 'mock_event_id',
        name: 'Mock Event for Development',
        slug: 'mock-event-dev',
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mock_event_id`,
        eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/mock-event-dev`
      };
      
      return NextResponse.json({ event: mockEvent });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === 'sk_test_your-stripe-secret-key') {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Extract event name from metadata or line items
    const eventName = session.metadata?.eventName || 'Unnamed Event';
    
    // Generate unique event ID and slug
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const eventSlug = eventName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substr(2, 6);

    // Create event in database
    const { data: event, error } = await supabase
      .from('events')
      .insert([
        {
          id: eventId,
          name: eventName,
          slug: eventSlug,
          stripe_session_id: sessionId,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // If database fails, still return success for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Database not available, returning mock success');
        return NextResponse.json({
          event: {
            id: eventId,
            name: eventName,
            slug: eventSlug,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${eventId}`,
            eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`
          }
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create event in database',
          details: error.message,
          hint: 'Make sure the database tables are created. Run the SQL from database_schema.sql in your Supabase dashboard.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      event: {
        id: eventId,
        name: eventName,
        slug: eventSlug,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${eventId}`,
        eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        hint: 'Check server logs and ensure Stripe and Supabase are properly configured'
      },
      { status: 500 }
    );
  }
}