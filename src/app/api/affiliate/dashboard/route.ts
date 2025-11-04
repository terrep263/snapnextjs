import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get affiliate data
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    // Get referral data
    const { data: referrals, error: referralsError } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      // Don't fail the request if referrals can't be fetched
    }

    return NextResponse.json({
      affiliate,
      referrals: referrals || []
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}