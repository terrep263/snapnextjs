import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';
import { randomUUID, randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const {
      eventName,
      eventDate,
      emailAddress,
      yourName,
      package: selectedPackage,
      price,
      promoCodeId,
      affiliateId,
    } = await request.json();

    if (!eventName || !emailAddress) {
      return NextResponse.json(
        { error: 'Event name and email address are required' },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' });
    const supabase = getServiceRoleClient();

    // Reserve the event row in 'pending' state BEFORE talking to Stripe
    const eventId = randomUUID();
    const slugSuffix = randomBytes(3).toString('hex');
    const eventSlug =
      eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
      '-' + slugSuffix;

    const { error: insertError } = await supabase.from('events').insert({
      id: eventId,
      name: eventName,
      slug: eventSlug,
      owner_email: emailAddress,
      status: 'pending_payment',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to create pending event row:', insertError);
      return NextResponse.json(
        { error: 'Could not initialize event', details: insertError.message },
        { status: 500 }
      );
    }

    const packageName = selectedPackage === 'premium' ? 'Premium Package' : 'Basic Package';

    // Prices sourced from environment variables — never hardcoded
    const premiumPriceCents = parseInt(process.env.STRIPE_PRICE_PREMIUM || '4900', 10);
    const basicPriceCents = parseInt(process.env.STRIPE_PRICE_BASIC || '2900', 10);
    const packagePrice = price || (selectedPackage === 'premium' ? premiumPriceCents : basicPriceCents);

    // Stripe metadata MUST include event_id — both on session and on payment_intent
    const eventMetadata = {
      event_id: eventId,
      eventName,
      eventDate: eventDate || '',
      emailAddress,
      yourName: yourName || '',
      package: selectedPackage,
      ...(affiliateId ? { pushLapAffiliateId: String(affiliateId) } : {}),
    };

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SnapWorxx ${packageName}`,
              description: `Event: ${eventName}`,
            },
            unit_amount: packagePrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/create`,
      customer_email: emailAddress,
      allow_promotion_codes: true,
      client_reference_id: affiliateId || undefined,
      metadata: eventMetadata,
      payment_intent_data: { metadata: eventMetadata },
    };

    if (promoCodeId) {
      (sessionConfig as any).discounts = [{ promotion_code: promoCodeId }];
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
    } catch (stripeErr) {
      // Roll back the pending row if Stripe rejects
      await supabase.from('events').delete().eq('id', eventId);
      throw stripeErr;
    }

    await supabase
      .from('events')
      .update({ stripe_session_id: session.id })
      .eq('id', eventId);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    );
  }
}
