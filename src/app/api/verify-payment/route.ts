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

      const { error: updateError, data: updated } = await supabase
        .from('events')
        .update({ status: 'active' })
        .eq('id', event.id)
        .eq('status', 'inactive')
        .select('id')
        .maybeSingle();

      if (updateError) {
        console.error('Failed to mark event paid:', updateError);
      } else if (updated && event.owner_email) {
        // Only send email if THIS request was the one that flipped pending → paid
        resend.emails
          .send({
            from: 'SnapWorxx <noreply@snapworxx.com>',
            to: event.owner_email,
            subject: `Your SnapWorxx Event is Ready: ${event.name}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc;">
                  <div style="max-width:600px;margin:0 auto;background:white;">
                    <div style="background:linear-gradient(to right,#7C3AED,#ec4899);padding:30px;text-align:center;">
                      <h1 style="margin:0;color:white;font-size:24px;">🎉 Your Event is Ready!</h1>
                    </div>
                    <div style="padding:30px;">
                      <p style="font-size:16px;color:#1f2937;">Your SnapWorxx event <strong>${event.name}</strong> has been created successfully!</p>
                      <h3 style="color:#1f2937;">📱 Event Gallery Link</h3>
                      <p style="background:#f3f4f6;padding:12px;border-radius:8px;word-break:break-all;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}" style="color:#7C3AED;">${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}</a>
                      </p>
                      <h3 style="color:#1f2937;">🎛️ Your Dashboard</h3>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${event.id}" style="display:inline-block;background:#7C3AED;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Go to Dashboard →</a>
                      <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
                        <p style="margin:0;color:#92400e;font-size:14px;"><strong>⏰ Note:</strong> Share the gallery link with your guests so they can upload photos. Your event is active for 30 days.</p>
                      </div>
                    </div>
                    <div style="text-align:center;padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                      <p style="color:#6b7280;font-size:14px;margin:0;">© 2025 SnapWorxx. All rights reserved.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          })
          .catch((e) => console.error('Email send failed:', e));
      }
      event.status = 'active';
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
