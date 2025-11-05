import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Promotion code is required' },
        { status: 400 }
      );
    }

    // Find promotion code by its code (what the customer enters)
    const promotionCodeList = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      active: true,
      limit: 1,
    });

    // Check if a valid promotion code was found
    if (promotionCodeList.data.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid promotion code'
      });
    }

    const promoCode = promotionCodeList.data[0] as any;

    // Get the associated coupon details
    const coupon = await stripe.coupons.retrieve(promoCode.coupon?.id || promoCode.coupon);

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        couponId: coupon.id,
      }
    });
  } catch (error) {
    console.error('Error validating promotion code:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Invalid promotion code' 
      },
      { status: 200 }
    );
  }
}
