import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log('🔍 Verify-payment called with sessionId:', sessionId);

    if (!sessionId) {
      console.log('❌ No session ID provided');
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
    console.log('💳 Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('📊 Session payment status:', session.payment_status);
    console.log('📧 Customer email:', session.customer_details?.email);

    if (session.payment_status !== 'paid') {
      console.log('❌ Payment not completed, status:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed', payment_status: session.payment_status },
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
    const insertData = {
      id: eventId,
      name: eventName,
      slug: eventSlug,
      stripe_session_id: sessionId,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    
    console.log('📊 About to insert event with data:', JSON.stringify(insertData, null, 2));
    
    const { data: event, error } = await supabase
      .from('events')
      .insert([insertData])
      .select('*') // Select all columns to see exactly what was inserted
      .single();

    console.log('💾 Database insertion result:', { event, error });
    console.log('💾 Full event object returned:', JSON.stringify(event, null, 2));

    if (error) {
      console.error('❌ Database error creating event:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // If database fails, still return success for development
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Database not available, returning mock success (status will be inactive)');
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

    // Event created successfully in database
    console.log('✅ Event created successfully with status:', event?.status);
    console.log('✅ Event ID:', event?.id);
    
    // Double-check the event status by querying it back from the database
    const { data: verifyEvent, error: verifyError } = await supabase
      .from('events')
      .select('id, name, slug, status, created_at')
      .eq('id', eventId)
      .single();
    
    console.log('🔍 Verification query result:', { verifyEvent, verifyError });
    console.log('🔍 Actual status in database:', verifyEvent?.status);

    // Event created successfully - now send confirmation email
    const eventDetails = {
      id: eventId,
      name: eventName,
      slug: eventSlug,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${eventId}`,
      eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`
    };

    // Send email to customer if email is available
    if (session.customer_details?.email) {
      try {
        console.log('📧 Attempting to send email to:', session.customer_details.email);
        
        // Import and call send-email function directly instead of HTTP fetch
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error: emailError } = await resend.emails.send({
          from: 'SnapWorxx <noreply@snapworxx.app>',
          to: session.customer_details.email,
          subject: `Your SnapWorxx Event: ${eventName}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(to right, #9333ea, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                  .link { color: #9333ea; word-break: break-all; }
                  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Your Event is Ready! 🎉</h1>
                  </div>
                  <div class="content">
                    <h2>Event: ${eventName}</h2>
                    <p>Your SnapWorxx event has been created successfully! Here's everything you need to get started:</p>

                    <h3>📱 Event Link</h3>
                    <p>Share this link with your guests to upload and view photos:</p>
                    <p class="link">${eventDetails.eventUrl}</p>

                    <h3>🎛️ Dashboard</h3>
                    <p>Manage your event and download all photos:</p>
                    <a href="${eventDetails.dashboardUrl}" class="button">Go to Dashboard</a>

                    <h3>📷 QR Code</h3>
                    <p>Visit your dashboard to download a QR code that guests can scan to access the event.</p>

                    <p><strong>Event Duration:</strong> Your event will remain active for 30 days.</p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('❌ Failed to send confirmation email:', emailError);
          // Don't fail the whole process if email fails
        } else {
          console.log('✅ Confirmation email sent successfully to:', session.customer_details.email);
          console.log('📧 Email message ID:', data?.id);
        }
      } catch (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
        // Don't fail the whole process if email fails
      }
    } else {
      console.log('No customer email found in session, skipping confirmation email');
    }

    return NextResponse.json({
      event: eventDetails
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