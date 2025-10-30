import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';
import { generateUniqueSlug, generateQRCode, getExpirationDate } from '@/lib/utils';
import type { EventInsert } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Payment successful:', session.id);
        console.log('Event name:', session.metadata?.eventName);

        // Extract event details from session
        const eventName = session.metadata?.eventName;
        const customerEmail = session.customer_details?.email;

        if (!eventName || !customerEmail) {
          console.error('Missing event name or customer email in session metadata');
          return NextResponse.json(
            { error: 'Missing required session data' },
            { status: 400 }
          );
        }

        // Generate unique slug for the event
        const slug = await generateUniqueSlug(eventName);
        console.log('Generated slug:', slug);

        // Create event in database
        const supabase = getServiceRoleClient();

        const eventData: EventInsert = {
          name: eventName,
          slug: slug,
          email: customerEmail,
          stripe_session_id: session.id,
          stripe_payment_status: 'completed',
          is_active: true,
          expires_at: getExpirationDate().toISOString(),
        };

        const { data: newEvent, error: dbError } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (dbError || !newEvent) {
          console.error('Failed to create event in database:', dbError);
          return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
          );
        }

        console.log('Event created in database:', newEvent.id);

        // Generate URLs
        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
        const eventUrl = `${appUrl}/e/${slug}`;
        const dashboardUrl = `${appUrl}/dashboard/${newEvent.id}`;

        // Generate QR code
        let qrCodeDataUrl: string;
        try {
          qrCodeDataUrl = await generateQRCode(eventUrl);
          console.log('QR code generated successfully');
        } catch (qrError) {
          console.error('Failed to generate QR code:', qrError);
          // Continue without QR code - email will still be sent
          qrCodeDataUrl = '';
        }

        // Send email with dashboard link and QR code
        try {
          const emailResponse = await fetch(`${appUrl}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: customerEmail,
              eventName: eventName,
              dashboardUrl: dashboardUrl,
              eventUrl: eventUrl,
              qrCodeDataUrl: qrCodeDataUrl,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Failed to send email:', await emailResponse.text());
          } else {
            console.log('Email sent successfully to:', customerEmail);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the webhook if email fails
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
