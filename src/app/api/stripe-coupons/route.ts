import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

/**
 * GET /api/stripe-coupons - List all active coupons
 * POST /api/stripe-coupons - Create a new coupon
 */

export async function GET(request: NextRequest) {
  try {
    // List all coupons in your Stripe account
    const coupons = await stripe.coupons.list({
      limit: 100,
    });

    return NextResponse.json({
      coupons: coupons.data.map(coupon => ({
        id: coupon.id,
        percentOff: coupon.percent_off || null,
        amountOff: coupon.amount_off || null,
        currency: coupon.currency || 'usd',
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months || null,
        redeemBy: coupon.redeem_by || null,
        timesRedeemed: coupon.times_redeemed,
        maxRedemptions: coupon.max_redemptions || null,
      }))
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { couponId, percentOff, amountOff, duration, durationInMonths, maxRedemptions, redeemByDays } = await request.json();

    // Validate input
    if (!couponId) {
      return NextResponse.json(
        { error: 'couponId is required' },
        { status: 400 }
      );
    }

    if (!percentOff && !amountOff) {
      return NextResponse.json(
        { error: 'Either percentOff or amountOff is required' },
        { status: 400 }
      );
    }

    if (percentOff && (percentOff < 0 || percentOff > 100)) {
      return NextResponse.json(
        { error: 'percentOff must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Calculate redeem_by timestamp if provided
    let redeemBy: number | undefined = undefined;
    if (redeemByDays) {
      redeemBy = Math.floor(Date.now() / 1000) + (redeemByDays * 24 * 60 * 60);
    }

    // Create coupon
    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: percentOff,
      amount_off: amountOff,
      currency: amountOff ? 'usd' : undefined,
      duration: duration || 'forever',
      duration_in_months: durationInMonths,
      max_redemptions: maxRedemptions,
      redeem_by: redeemBy,
    } as Stripe.CouponCreateParams);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        percentOff: coupon.percent_off || null,
        amountOff: coupon.amount_off || null,
        currency: coupon.currency || 'usd',
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months || null,
        redeemBy: coupon.redeem_by || null,
        maxRedemptions: coupon.max_redemptions || null,
      }
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    
    if (error.code === 'resource_already_exists') {
      return NextResponse.json(
        { error: `Coupon "${error.param}" already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    );
  }
}
