import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
      affiliateId // PushLap affiliate tracking ID from frontend
    } = await request.json();

    if (!eventName || !emailAddress) {
      return NextResponse.json(
        { error: 'Event name and email address are required' },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    // Check if Stripe is properly configured
    if (!stripeSecretKey || stripeSecretKey === 'sk_test_your-stripe-secret-key') {
      console.log('Stripe not configured, returning mock success URL');
      return NextResponse.json({ 
        sessionId: 'mock_session_id',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id=mock_session_id&mock=true`
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    const packageName = selectedPackage === 'premium' ? 'Premium Package' : 'Basic Package';
    const packagePrice = price || (selectedPackage === 'premium' ? 4900 : 2900);

    // Prepare line items for Stripe - use full price only
    const lineItems = [
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
      }
    ];

    console.log('Line items for checkout:', JSON.stringify(lineItems, null, 2));
    console.log('Package details:', {
      packageName,
      packagePrice,
      currency: 'usd'
    });

    // Create Stripe checkout session with promotion codes enabled
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems as any,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/create`,
      customer_email: emailAddress,
      allow_promotion_codes: true,
      // PushLap affiliate tracking: client_reference_id is used by PushLap to track conversions
      client_reference_id: affiliateId || undefined,
      metadata: {
        eventName,
        eventDate: eventDate || '',
        emailAddress,
        yourName: yourName || '',
        package: selectedPackage,
        // PushLap affiliate tracking: store affiliate ID in metadata as backup
        ...(affiliateId ? { pushLapAffiliateId: String(affiliateId) } : {}),
      },
    };
    
    // Log affiliate tracking setup for debugging
    if (affiliateId) {
      console.log('🎯 PushLap affiliate tracking configured:', {
        client_reference_id: affiliateId,
        metadata_pushLapAffiliateId: affiliateId
      });
    } else {
      console.log('⚠️ No affiliate ID provided for this checkout');
    }

    // Add promotion code if provided
    if (promoCodeId) {
      (sessionConfig as any).discounts = [
        {
          promotion_code: promoCodeId,
        }
      ];
    }

    console.log('Session config:', {
      mode: sessionConfig.mode,
      allow_promotion_codes: sessionConfig.allow_promotion_codes,
      has_discounts: !!promoCodeId,
      discounts: promoCodeId ? [{ promotion_code: promoCodeId }] : undefined,
      line_items_count: lineItems.length,
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('Checkout session created successfully:', {
      session_id: session.id,
      url: session.url,
      allow_promotion_codes: (session as any).allow_promotion_codes,
      discounts_applied: (session as any).discounts,
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
