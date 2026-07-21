import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { checkRateLimit, incrementRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

const AFFILIATE_LOGIN_RATE_LIMIT = 20; // attempts per hour per IP

export async function POST(request: NextRequest) {
  try {
    // Rate-limit to stop email/code enumeration.
    const rlKey = `affiliate-dash:${getClientIdentifier(request)}`;
    if (!checkRateLimit(rlKey, AFFILIATE_LOGIN_RATE_LIMIT).allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }
    incrementRateLimit(rlKey);

    const supabase = getServiceRoleClient();
    const { email, referralCode } = await request.json();

    if (!email || !referralCode) {
      return NextResponse.json(
        { error: 'Email and referral code are required' },
        { status: 400 }
      );
    }

    // Look up by email, then require the referral code to match. The code is the
    // affiliate's own private credential, so email alone no longer discloses an
    // account (closes the IDOR).
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', String(email).toLowerCase())
      .single();

    // Constant-ish response: same error whether the email or the code is wrong,
    // so an attacker can't distinguish "no such affiliate" from "wrong code".
    if (
      affiliateError ||
      !affiliate ||
      !affiliate.referral_code ||
      String(affiliate.referral_code).toLowerCase() !== String(referralCode).toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Invalid email or referral code' },
        { status: 401 }
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
      referrals: referrals || [],
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
