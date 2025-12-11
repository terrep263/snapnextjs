import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceRoleClient } from '@/lib/supabase';
import ErrorLogger from '@/lib/errorLogger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Log webhook receipt immediately to webhook_logs table
 */
async function logWebhookReceipt(event: Stripe.Event): Promise<void> {
  try {
    const supabase = getServiceRoleClient();

    const { error } = await supabase.from('webhook_logs').insert({
      stripe_event_id: event.id,
      webhook_type: event.type,
      payload: event as any,
      processed: false,
      processing_attempts: 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log webhook receipt:', error);
    }
  } catch (err) {
    console.error('Error logging webhook receipt:', err);
  }
}

/**
 * Process webhook asynchronously after acknowledging receipt
 */
async function processWebhookAsync(event: Stripe.Event): Promise<void> {
  const supabase = getServiceRoleClient();

  try {
    // Begin transaction-like processing
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled webhook type: ${event.type}`);
    }

    // Mark webhook as processed
    const { error: updateError } = await supabase
      .from('webhook_logs')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id);

    if (updateError) {
      console.error('Failed to mark webhook as processed:', updateError);
    }
  } catch (err: any) {
    // Log processing error and update webhook_logs
    const errorMessage = err?.message || 'Unknown error';
    console.error('Webhook processing error:', err);

    await ErrorLogger.logWebhookError(event.id, err as Error, event);

    // Update webhook_logs with error - get current attempts first
    const { data: existing } = await supabase
      .from('webhook_logs')
      .select('processing_attempts')
      .eq('stripe_event_id', event.id)
      .single();

    if (existing) {
      await supabase
        .from('webhook_logs')
        .update({
          processing_attempts: (existing.processing_attempts || 0) + 1,
          last_error: errorMessage,
        })
        .eq('stripe_event_id', event.id);
    } else {
      // If record doesn't exist, create it with error
      await supabase.from('webhook_logs').insert({
        stripe_event_id: event.id,
        webhook_type: event.type,
        payload: event as any,
        processed: false,
        processing_attempts: 1,
        last_error: errorMessage,
        created_at: new Date().toISOString(),
      });
    }
  }
}

/**
 * Handle checkout.session.completed webhook
 */
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<void> {
  const { metadata } = session;
  const eventId = metadata?.event_id;

  if (!eventId) {
    throw new Error('No event_id in session metadata');
  }

  // Update event payment status
  const { error } = await supabase
    .from('events')
    .update({
      payment_status: 'paid',
      stripe_session_id: session.id,
      last_webhook_received: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  console.log(`Event ${eventId} payment confirmed via checkout.session.completed`);

  // Handle affiliate referral if this was an affiliate sale
  if (metadata?.isAffiliateReferral === 'true' && metadata?.affiliateId) {
    try {
      const saleAmount = (session.amount_total || 0) / 100; // Convert from cents
      const commissionRate = 60; // 60% commission
      const commissionAmount = Math.round(saleAmount * (commissionRate / 100) * 100) / 100;

      // Check if affiliate is still active and within 90-day program
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, status, program_expires_at')
        .eq('id', metadata.affiliateId)
        .single();

      if (affiliateError || !affiliate) {
        console.error('Affiliate not found:', metadata.affiliateId);
        return;
      }

      // Check if affiliate program has expired
      const expirationDate = new Date(affiliate.program_expires_at);
      const isExpired = expirationDate < new Date();

      if (affiliate.status !== 'active' || isExpired) {
        console.log(`Affiliate ${metadata.affiliateId} is not active or expired, skipping commission`);
        return;
      }

      // Create affiliate referral record
      const { error: referralError } = await supabase.from('affiliate_referrals').insert({
        affiliate_id: metadata.affiliateId,
        event_id: eventId,
        customer_email: metadata.emailAddress || session.customer_details?.email,
        referral_code: metadata.affiliateReferralCode,
        sale_amount: saleAmount,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        status: 'confirmed',
        stripe_session_id: session.id,
        confirmed_at: new Date().toISOString(),
      });

      if (referralError) {
        console.error('Error creating affiliate referral:', referralError);
      } else {
        console.log(`Affiliate commission created: $${commissionAmount} for affiliate ${metadata.affiliateId}`);
      }
    } catch (error) {
      console.error('Error processing affiliate referral:', error);
      // Don't throw - affiliate processing is non-critical
    }
  }
}

/**
 * Handle payment_intent.succeeded webhook
 */
async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<void> {
  const { metadata } = paymentIntent;
  const eventId = metadata?.event_id;

  if (!eventId) return;

  const { error } = await supabase
    .from('events')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      last_webhook_received: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to update event payment status: ${error.message}`);
  }

  console.log(`Event ${eventId} payment succeeded`);
}

/**
 * Handle payment_intent.payment_failed webhook
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<void> {
  const { metadata } = paymentIntent;
  const eventId = metadata?.event_id;

  if (!eventId) return;

  const { error } = await supabase
    .from('events')
    .update({
      payment_status: 'failed',
      last_webhook_received: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to update event payment status: ${error.message}`);
  }

  // TODO: Send notification to event organizer
  console.log(`Event ${eventId} payment failed`);
}

/**
 * Handle charge.refunded webhook
 */
async function handleRefund(
  charge: Stripe.Charge,
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<void> {
  // Implementation for refund handling
  console.log(`Refund processed for charge: ${charge.id}`);
  // TODO: Update event payment_status to 'refunded' if needed
}

/**
 * Handle invoice.payment_succeeded webhook
 */
async function handleSubscriptionPayment(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<void> {
  // Implementation for subscription payment handling
  console.log(`Subscription payment for invoice: ${invoice.id}`);
  // TODO: Handle subscription renewals if applicable
}

/**
 * Main webhook handler
 * Acknowledges receipt immediately, then processes asynchronously
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      await ErrorLogger.logWebhookError(null, err as Error, { body: body.substring(0, 500) });
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Log webhook receipt immediately (non-blocking)
    logWebhookReceipt(event).catch((err) => {
      console.error('Failed to log webhook receipt:', err);
    });

    // Acknowledge receipt immediately (within 3 seconds requirement)
    const response = NextResponse.json({ received: true });

    // Process webhook asynchronously (don't await)
    processWebhookAsync(event).catch((err) => {
      console.error('Async webhook processing error:', err);
      ErrorLogger.logWebhookError(event.id, err as Error, event);
    });

    return response;
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    await ErrorLogger.logWebhookError(null, error as Error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
