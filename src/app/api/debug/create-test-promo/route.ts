import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Quick endpoint to create test promotion codes for debugging
 * POST /api/debug/create-test-promo
 * 
 * This is for development/debugging only
 */

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey || stripeSecretKey.includes('sk_test_')) {
      return NextResponse.json(
        { error: 'This endpoint only works with live Stripe keys' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    // Create a test coupon
    const coupon = await stripe.coupons.create({
      id: `debug-test-${Date.now()}`,
      percent_off: 25,
      duration: 'forever',
    } as any);

    console.log('Created coupon:', coupon.id);

    // Create a promotion code pointing to that coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `DEBUG${Math.random().toString().slice(2, 6).toUpperCase()}`,
    } as any);

    console.log('Created promo code:', promoCode.code);

    return NextResponse.json({
      success: true,
      coupon: coupon.id,
      code: (promoCode as any).code,
      message: 'Test promotion code created! Try it in checkout.',
      instructions: `Use code: ${(promoCode as any).code} in Stripe checkout`
    });
  } catch (error: any) {
    console.error('Error creating test promo:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
