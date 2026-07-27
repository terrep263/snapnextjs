import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Acquisition stats for self-serve free claims, grouped by ?src= channel.
 *
 * Answers the only question that matters early: which channel produced claims,
 * which of those claims turned into events that guests actually uploaded to,
 * and which claimers later paid.
 *
 * Aggregated in JS rather than SQL - volumes are in the tens, and this avoids
 * adding a database function for a read-only admin view.
 *
 * GET /api/admin/free-claims-stats
 */

/**
 * Mirrors the check used by the existing admin endpoints: an admin_session
 * cookie or an `Authorization: Bearer admin_*` header.
 */
function isAdminRequest(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ');
    if (cookies.some((c) => c.startsWith('admin_session='))) return true;
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer admin_')) return true;
  return false;
}

interface SourceRow {
  source: string;
  claims: number;
  eventsCreated: number;
  eventsWithPhotos: number;
  photos: number;
  converted: number;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = getServiceRoleClient();

    // Self-serve claims only. Admin-issued links have claim_email null and are
    // not part of channel attribution.
    const { data: claims, error: claimsError } = await supabase
      .from('free_event_claims')
      .select('claim_email, source, event_id, event_date, created_at')
      .not('claim_email', 'is', null)
      .order('created_at', { ascending: false });

    if (claimsError) {
      console.error('Error loading claims:', claimsError);
      return NextResponse.json(
        { success: false, error: 'Failed to load claims' },
        { status: 500 }
      );
    }

    const claimRows = claims ?? [];

    // Emails that have ever paid, so a claim can be marked converted.
    const { data: paidEvents } = await supabase
      .from('events')
      .select('email, owner_email')
      .not('stripe_session_id', 'is', null);

    const paidEmails = new Set<string>();
    for (const e of paidEvents ?? []) {
      if (e.email) paidEmails.add(String(e.email).toLowerCase());
      if (e.owner_email) paidEmails.add(String(e.owner_email).toLowerCase());
    }

    // Photo counts for the events these claims produced.
    const eventIds = claimRows.map((c) => c.event_id).filter(Boolean) as string[];
    const photoCountByEvent = new Map<string, number>();

    if (eventIds.length > 0) {
      const { data: photos } = await supabase
        .from('photos')
        .select('event_id')
        .in('event_id', eventIds);

      for (const p of photos ?? []) {
        const id = String(p.event_id);
        photoCountByEvent.set(id, (photoCountByEvent.get(id) ?? 0) + 1);
      }
    }

    const bySource = new Map<string, SourceRow>();

    for (const claim of claimRows) {
      const source = claim.source || 'direct';
      if (!bySource.has(source)) {
        bySource.set(source, {
          source,
          claims: 0,
          eventsCreated: 0,
          eventsWithPhotos: 0,
          photos: 0,
          converted: 0,
        });
      }
      const row = bySource.get(source)!;

      row.claims += 1;

      if (claim.event_id) {
        row.eventsCreated += 1;
        const count = photoCountByEvent.get(String(claim.event_id)) ?? 0;
        row.photos += count;
        if (count > 0) row.eventsWithPhotos += 1;
      }

      if (claim.claim_email && paidEmails.has(String(claim.claim_email).toLowerCase())) {
        row.converted += 1;
      }
    }

    const sources = Array.from(bySource.values()).sort((a, b) => b.claims - a.claims);

    const totals = sources.reduce<SourceRow>(
      (acc, r) => ({
        source: 'all',
        claims: acc.claims + r.claims,
        eventsCreated: acc.eventsCreated + r.eventsCreated,
        eventsWithPhotos: acc.eventsWithPhotos + r.eventsWithPhotos,
        photos: acc.photos + r.photos,
        converted: acc.converted + r.converted,
      }),
      { source: 'all', claims: 0, eventsCreated: 0, eventsWithPhotos: 0, photos: 0, converted: 0 }
    );

    const recent = claimRows.slice(0, 25).map((c) => ({
      email: c.claim_email,
      source: c.source || 'direct',
      eventDate: c.event_date,
      createdAt: c.created_at,
      photos: c.event_id ? photoCountByEvent.get(String(c.event_id)) ?? 0 : 0,
      converted: c.claim_email
        ? paidEmails.has(String(c.claim_email).toLowerCase())
        : false,
    }));

    return NextResponse.json({ success: true, totals, sources, recent });
  } catch (err) {
    console.error('Unhandled error in free-claims-stats:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
