import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (sessionId === 'mock_session_id' && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        event: {
          id: 'mock_event_id',
          name: 'Mock Event for Development',
          slug: 'mock-event-dev',
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mock_event_id`,
          eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/mock-event-dev`,
        },
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' });
    const supabase = getServiceRoleClient();

    // Look up the row that create-checkout-session reserved
    const { data: event, error: lookupError } = await supabase
      .from('events')
      .select('id, name, slug, payment_status, owner_email')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (lookupError || !event) {
      return NextResponse.json(
        { error: 'Event not found for this session' },
        { status: 404 }
      );
    }

    // If still pending, check Stripe and flip pending → paid (idempotent vs webhook)
    if (event.payment_status !== 'paid') {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not completed', payment_status: session.payment_status },
          { status: 400 }
        );
      }

      const { error: updateError, data: updated } = await supabase
        .from('events')
        .update({ payment_status: 'paid', status: 'active' })
        .eq('id', event.id)
        .eq('payment_status', 'pending')
        .select('id')
        .maybeSingle();

      if (updateError) {
        console.error('Failed to mark event paid:', updateError);
      } else if (updated && event.owner_email) {
        // Only send email if THIS request was the one that flipped pending → paid
        resend.emails
          .send({
            from: 'SnapWorxx <noreply@snapworxx.app>',
            to: event.owner_email,
            subject: `Your SnapWorxx Event: ${event.name}`,
            html: `<p>Your event <strong>${event.name}</strong> is ready.</p>
                   <p>Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${event.id}</p>
                   <p>Event link: ${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}</p>`,
          })
          .catch((e) => console.error('Email send failed:', e));
      }
      event.payment_status = 'paid';
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${event.id}`,
        eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}`,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
