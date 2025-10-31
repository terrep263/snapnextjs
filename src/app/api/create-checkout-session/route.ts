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
      price 
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
      // Return a mock success URL for development
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
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
      metadata: {
        eventName,
        eventDate: eventDate || '',
        emailAddress,
        yourName: yourName || '',
        package: selectedPackage,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: errorMessage,
        hint: 'Make sure your Stripe secret key is properly configured in environment variables'
      },
      { status: 500 }
    );
  }
}
