import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to test token validity
 * GET /api/claim/test-token?token=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        error: 'Token parameter is required',
        usage: '/api/claim/test-token?token=YOUR_TOKEN'
      }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Check if table exists and get token data
    const { data: claimLink, error: queryError } = await supabase
      .from('free_event_claims')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    // Check if table exists by trying a simple query
    const { data: tableCheck, error: tableError } = await supabase
      .from('free_event_claims')
      .select('id')
      .limit(1);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      token: {
        provided: token,
        length: token.length,
        format: 'Base64 URL-safe',
      },
      database: {
        tableExists: !tableError,
        tableError: tableError ? {
          message: tableError.message,
          details: tableError.details,
          hint: tableError.hint,
          code: tableError.code,
        } : null,
        totalRecords: tableCheck?.length || 0,
      },
      tokenQuery: {
        found: !!claimLink,
        error: queryError ? {
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          code: queryError.code,
        } : null,
        data: claimLink ? {
          id: claimLink.id,
          claimed: claimLink.claimed,
          claimed_at: claimLink.claimed_at,
          event_id: claimLink.event_id,
          expires_at: claimLink.expires_at,
          created_at: claimLink.created_at,
          isExpired: claimLink.expires_at ? new Date(claimLink.expires_at) <= new Date() : false,
        } : null,
      },
      validation: {
        canClaim: claimLink && !claimLink.claimed && (!claimLink.expires_at || new Date(claimLink.expires_at) > new Date()),
        reason: !claimLink
          ? 'Token not found in database'
          : claimLink.claimed
          ? 'Token already claimed'
          : claimLink.expires_at && new Date(claimLink.expires_at) <= new Date()
          ? 'Token expired'
          : 'Token is valid',
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    };

    return NextResponse.json(diagnostics);
  } catch (err) {
    return NextResponse.json({
      error: 'Diagnostic test failed',
      details: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }, { status: 500 });
  }
}
