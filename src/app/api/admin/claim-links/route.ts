import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if request is from authenticated admin
 */
function isAdminRequest(request: Request | NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ');
    const adminSessionCookie = cookies.find(c => c.startsWith('admin_session='));
    if (adminSessionCookie) return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer admin_')) return true;

  return false;
}

/**
 * Admin endpoint to list all claim links
 * GET /api/admin/claim-links
 *
 * Query params:
 * - status: 'all' | 'claimed' | 'unclaimed' | 'expired' (default: 'all')
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     links: Array<ClaimLink>,
 *     total: number,
 *     stats: {
 *       total: number,
 *       claimed: number,
 *       unclaimed: number,
 *       expired: number
 *     }
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = getServiceRoleClient();

    // Build query based on status filter
    let query = supabase
      .from('free_event_claims')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filter
    const now = new Date().toISOString();
    if (status === 'claimed') {
      query = query.eq('claimed', true);
    } else if (status === 'unclaimed') {
      query = query.eq('claimed', false).or(`expires_at.is.null,expires_at.gt.${now}`);
    } else if (status === 'expired') {
      query = query.eq('claimed', false).lt('expires_at', now);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: links, error, count } = await query;

    if (error) {
      console.error('Error fetching claim links:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch claim links' },
        { status: 500 }
      );
    }

    // Get stats
    const { data: statsData } = await supabase
      .from('free_event_claims')
      .select('claimed, expires_at');

    const stats = {
      total: statsData?.length || 0,
      claimed: statsData?.filter(l => l.claimed).length || 0,
      unclaimed: statsData?.filter(l => !l.claimed && (!l.expires_at || new Date(l.expires_at) > new Date())).length || 0,
      expired: statsData?.filter(l => !l.claimed && l.expires_at && new Date(l.expires_at) <= new Date()).length || 0,
    };

    // Format links for response
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapworxx.com';
    const formattedLinks = links?.map(link => ({
      id: link.id,
      token: link.token,
      claimUrl: `${baseUrl}/claim/${link.token}`,
      claimed: link.claimed,
      claimedAt: link.claimed_at,
      claimedByUserId: link.claimed_by_user_id,
      eventId: link.event_id,
      createdByAdmin: link.created_by_admin_email,
      expiresAt: link.expires_at,
      createdAt: link.created_at,
      isExpired: link.expires_at ? new Date(link.expires_at) <= new Date() : false,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        links: formattedLinks,
        total: count || 0,
        stats,
      },
    });
  } catch (err) {
    console.error('Unhandled error in claim-links:', err);
    return NextResponse.json(
      { success: false, error: 'Server error', details: String(err) },
      { status: 500 }
    );
  }
}
