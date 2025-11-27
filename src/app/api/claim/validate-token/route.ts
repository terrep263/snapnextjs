import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Public endpoint to validate claim tokens
 * GET /api/claim/validate-token?token=xxx
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     valid: boolean,
 *     reason?: string, // If invalid: 'not_found' | 'already_claimed' | 'expired'
 *     token?: string,
 *     expiresAt?: string
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Find claim link by token
    const { data: claimLink, error } = await supabase
      .from('free_event_claims')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !claimLink) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'not_found',
        },
      });
    }

    // Check if already claimed
    if (claimLink.claimed) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          reason: 'already_claimed',
          claimedAt: claimLink.claimed_at,
        },
      });
    }

    // Token is valid (no expiration check)
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        token: claimLink.token,
        expiresAt: null,
      },
    });
  } catch (err) {
    console.error('Unhandled error in validate-token:', err);
    return NextResponse.json(
      { success: false, error: 'Server error', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Public endpoint to mark a token as claimed after event creation
 * POST /api/claim/validate-token
 *
 * Request body:
 * {
 *   token: string,
 *   eventId: string,
 *   userId?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, eventId, userId } = body;

    if (!token || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Token and eventId are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Verify token exists and is not claimed
    const { data: claimLink, error: fetchError } = await supabase
      .from('free_event_claims')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !claimLink) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 404 }
      );
    }

    if (claimLink.claimed) {
      return NextResponse.json(
        { success: false, error: 'Token already claimed' },
        { status: 409 }
      );
    }

    // Check expiration
    if (claimLink.expires_at && new Date(claimLink.expires_at) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token expired' },
        { status: 410 }
      );
    }

    // Mark as claimed
    const { error: updateError } = await supabase
      .from('free_event_claims')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId || null,
        event_id: eventId,
      })
      .eq('token', token);

    if (updateError) {
      console.error('Error marking token as claimed:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to mark token as claimed' },
        { status: 500 }
      );
    }

    console.log(`✅ Token claimed: ${token} -> Event: ${eventId}`);

    return NextResponse.json({
      success: true,
      message: 'Token claimed successfully',
    });
  } catch (err) {
    console.error('Unhandled error in claim token:', err);
    return NextResponse.json(
      { success: false, error: 'Server error', details: String(err) },
      { status: 500 }
    );
  }
}
