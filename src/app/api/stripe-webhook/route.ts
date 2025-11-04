import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';

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
      apiVersion: '2025-10-29.clover',
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

        // Extract metadata
        const metadata = session.metadata;
        if (metadata) {
          // Handle affiliate referral if this was an affiliate sale
          if (metadata.isAffiliateReferral === 'true' && metadata.affiliateId) {
            try {
              const saleAmount = (session.amount_total || 0) / 100; // Convert from cents
              const commissionRate = 20; // 20% commission
              const commissionAmount = Math.round(saleAmount * (commissionRate / 100) * 100) / 100;

              // Create affiliate referral record
              const supabase = getServiceRoleClient();
              const { error: referralError } = await supabase
                .from('affiliate_referrals')
                .insert({
                  affiliate_id: metadata.affiliateId,
                  event_id: session.id, // Using Stripe session ID as event ID for now
                  customer_email: metadata.emailAddress,
                  referral_code: metadata.affiliateReferralCode,
                  sale_amount: saleAmount,
                  commission_amount: commissionAmount,
                  commission_rate: commissionRate,
                  status: 'confirmed',
                  stripe_session_id: session.id,
                  confirmed_at: new Date().toISOString()
                });

              if (referralError) {
                console.error('Error creating affiliate referral:', referralError);
              } else {
                console.log(`Affiliate commission created: $${commissionAmount} for affiliate ${metadata.affiliateId}`);
              }
            } catch (error) {
              console.error('Error processing affiliate referral:', error);
            }
          }

          // TODO: Create event in database
          console.log('Event name:', metadata.eventName);
          // TODO: Generate unique slug for event
          // TODO: Store event details in Supabase
          // TODO: Send email with dashboard link and QR code
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
