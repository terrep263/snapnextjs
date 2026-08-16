import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { setHostCookie } from '@/lib/host-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL('/free?activation=missing', baseUrl));
  }

  try {
    const supabase = getServiceRoleClient();
    const { data: claim, error: claimError } = await supabase
      .from('free_event_claims')
      .select('token, event_id, claim_email, claim_email_normalized')
      .eq('token', token)
      .not('claim_email', 'is', null)
      .maybeSingle();

    if (claimError || !claim?.event_id) {
      return NextResponse.redirect(new URL('/free?activation=invalid', baseUrl));
    }

    const activatedAt = new Date().toISOString();
    let { data: event, error: eventError } = await supabase
      .from('events')
      .update({ activated_at: activatedAt })
      .eq('id', claim.event_id)
      .eq('is_free', true)
      .is('activated_at', null)
      .select('id, slug, owner_email, email')
      .maybeSingle();

    if (!event && !eventError) {
      const existing = await supabase
        .from('events')
        .select('id, slug, owner_email, email')
        .eq('id', claim.event_id)
        .eq('is_free', true)
        .not('activated_at', 'is', null)
        .maybeSingle();
      event = existing.data;
      eventError = existing.error;
    }

    if (eventError || !event) {
      return NextResponse.redirect(new URL('/free?activation=invalid', baseUrl));
    }

    const hostEmail = event.owner_email || event.email || claim.claim_email;
    if (hostEmail) {
      await setHostCookie(String(hostEmail), process.env.NODE_ENV === 'production');
    }

    return NextResponse.redirect(new URL(`/dashboard/${event.id}?activated=1`, baseUrl));
  } catch (err) {
    console.error('Free event activation failed:', err);
    return NextResponse.redirect(new URL('/free?activation=error', baseUrl));
  }
}
