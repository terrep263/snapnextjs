import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Look up the affiliate by referral code
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('id, name, email, referral_code, commission_rate, status')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !affiliate) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or inactive referral code'
      });
    }

    return NextResponse.json({
      valid: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        referralCode: affiliate.referral_code,
        commissionRate: affiliate.commission_rate
      },
      message: 'Valid affiliate code - Stripe coupon will be applied in checkout'
    });

  } catch (error) {
    console.error('Affiliate validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}