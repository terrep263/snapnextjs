import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

/**
 * GET /api/stripe-promotions - List all active promotion codes
 * POST /api/stripe-promotions - Create a new promotion code
 * 
 * Promotion codes are customer-facing codes that apply coupons.
 * Example: "SAVE50" applies the coupon "50-percent-off"
 */

export async function GET(request: NextRequest) {
  try {
    // List all active promotion codes
    const promos = await stripe.promotionCodes.list({
      limit: 100,
      active: true,
    } as any);

    return NextResponse.json({
      promotions: promos.data.map((promo: any) => ({
        id: promo.id,
        code: promo.code,
        couponId: promo.coupon.id,
        couponPercentOff: promo.coupon.percent_off || null,
        couponAmountOff: promo.coupon.amount_off || null,
        active: promo.active,
        timesRedeemed: promo.times_redeemed,
        maxRedemptions: promo.max_redemptions || null,
        expiresAt: promo.expires_at || null,
      }))
    });
  } catch (error) {
    console.error('Error fetching promotion codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, couponId, maxRedemptions, expiresInDays } = await request.json();

    // Validate input
    if (!code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      );
    }

    if (!couponId) {
      return NextResponse.json(
        { error: 'couponId is required' },
        { status: 400 }
      );
    }

    // Calculate expiration timestamp if provided
    let expiresAt: number | undefined = undefined;
    if (expiresInDays) {
      expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
    }

    // Create promotion code
    const promoCode = code.toUpperCase();
    const promo = await stripe.promotionCodes.create({
      coupon: couponId,
      code: promoCode,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt,
    } as any);

    const promoCoupon = (promo as any).coupon || {};
    return NextResponse.json({
      success: true,
      promotion: {
        id: promo.id,
        code: promo.code,
        couponId: promoCoupon.id || couponId,
        couponPercentOff: promoCoupon.percent_off || null,
        couponAmountOff: promoCoupon.amount_off || null,
        active: promo.active,
        maxRedemptions: promo.max_redemptions || null,
        expiresAt: promo.expires_at || null,
      }
    });
  } catch (error: any) {
    console.error('Error creating promotion code:', error);
    
    const requestBody = await request.json();
    const code = requestBody.code;
    
    if (error.code === 'resource_already_exists') {
      return NextResponse.json(
        { error: `Promotion code "${code.toUpperCase()}" already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create promotion code', details: error.message },
      { status: 500 }
    );
  }
}
