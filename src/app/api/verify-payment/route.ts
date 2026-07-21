import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';
import { setHostCookie } from '@/lib/host-auth';
import { expiresAtForPackage } from '@/lib/event-lifecycle';

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
      .select('id, name, slug, status, owner_email')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (lookupError || !event) {
      return NextResponse.json(
        { error: 'Event not found for this session' },
        { status: 404 }
      );
    }

    // If still pending, check Stripe and flip pending → paid (idempotent vs webhook)
    if (event.status !== 'active') {
      // status is 'inactive' (pending payment) — verify with Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not completed', payment_status: session.payment_status },
          { status: 400 }
        );
      }

      // Read the purchased tier from the Stripe session metadata (same source
      // the webhook uses) so a webhook that never fires can't leave a premium
      // purchase resolving to basic. Also set the tier-based expiry here. The
      // `status='inactive'` guard makes this idempotent vs the webhook — only
      // whichever path flips the row first writes these values.
      const packageType =
        session.metadata?.package === 'premium' ? 'premium' : 'basic';
      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('events')
        .update({
          status: 'active',
          package: packageType,
          expires_at: expiresAtForPackage(packageType, nowIso),
        })
        .eq('id', event.id)
        .eq('status', 'inactive');

      if (updateError) {
        console.error('Failed to mark event paid:', updateError);
      }

      event.status = 'active';
    }

    // Mint a signed host session for the verified buyer.
    if (event.owner_email) {
      try {
        await setHostCookie(event.owner_email, process.env.NODE_ENV === 'production');
      } catch (e) {
        console.error('Failed to set host session:', e);
      }
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
