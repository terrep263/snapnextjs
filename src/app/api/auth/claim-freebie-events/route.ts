import { getServiceRoleClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint to claim unclaimed freebie events for a user
 * Called when a user logs in or signs up - links their email to freebie events
 * This allows seamless transfer of freebie events to authenticated users
 *
 * Request body:
 * {
 *   "email": "user@email.com",
 *   "userId": "uuid-or-user-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'email and userId are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Find all unclaimed freebie events for this email
    const { data: unclaimedFreebies, error: findError } = await supabase
      .from('events')
      .select('id')
      .eq('owner_email', email)
      .eq('is_freebie', true)
      .is('owner_id', null);

    if (findError) {
      console.error('Error finding unclaimed freebie events:', findError);
      return NextResponse.json(
        { error: 'Failed to find freebie events' },
        { status: 500 }
      );
    }

    if (!unclaimedFreebies || unclaimedFreebies.length === 0) {
      // No events to claim - this is fine, just return success
      return NextResponse.json({
        success: true,
        claimedCount: 0,
        message: 'No unclaimed freebie events for this user',
      });
    }

    const eventIds = unclaimedFreebies.map((e) => e.id);

    // Claim all unclaimed freebie events by setting their owner_id
    const { error: updateError } = await supabase
      .from('events')
      .update({ owner_id: userId })
      .in('id', eventIds);

    if (updateError) {
      console.error('Error claiming freebie events:', updateError);
      return NextResponse.json(
        { error: 'Failed to claim freebie events' },
        { status: 500 }
      );
    }

    console.log(
      `✅ Claimed ${eventIds.length} freebie events for user ${email} (id: ${userId})`
    );

    return NextResponse.json({
      success: true,
      claimedCount: eventIds.length,
      message: `Claimed ${eventIds.length} freebie event(s) for this user`,
    });
  } catch (err) {
    console.error('Unhandled error in claim-freebie-events:', err);
    return NextResponse.json(
      { error: 'Server error', details: String(err) },
      { status: 500 }
    );
  }
}
