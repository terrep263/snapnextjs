import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { setHostCookie } from '@/lib/host-auth';

/**
 * POST /api/host/session
 * Mint a signed host session for an event, given the owner email.
 * Server-verifies email === event.owner_email OR event.email (same trust level
 * as the existing email-confirm fallback), then issues the signed cookie in
 * place of the unsigned userEmail cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const { eventId, email } = await req.json();
    if (!eventId || !email) {
      return NextResponse.json({ error: 'eventId and email are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data: event } = await supabase
      .from('events')
      .select('id, owner_email, email')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const entered = String(email).toLowerCase().trim();
    const owners = [event.owner_email, event.email]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase());

    if (!owners.includes(entered)) {
      return NextResponse.json({ error: 'Email does not match this event owner' }, { status: 403 });
    }

    await setHostCookie(entered, process.env.NODE_ENV === 'production');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Host session mint error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
