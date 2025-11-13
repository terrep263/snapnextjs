/**
 * Freebie Event Claiming - Helper Utilities
 * Automatically claims unclaimed freebie events when users sign up or log in
 */

export async function claimFreebieEventsForUser(
  email: string,
  userId: string
): Promise<{ success: boolean; claimedCount: number; error?: string }> {
  try {
    const response = await fetch('/api/auth/claim-freebie-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        claimedCount: 0,
        error: error.error || 'Failed to claim freebie events',
      };
    }

    const result = await response.json();
    return {
      success: result.success,
      claimedCount: result.claimedCount || 0,
    };
  } catch (err) {
    console.error('Error claiming freebie events:', err);
    return {
      success: false,
      claimedCount: 0,
      error: String(err),
    };
  }
}

/**
 * Should be called in your auth/login success handler
 * Automatically claims freebie events and optionally shows a toast message
 */
export async function handleFreebieClaimingOnAuth(
  email: string,
  userId: string,
  onSuccess?: (count: number) => void
): Promise<void> {
  const result = await claimFreebieEventsForUser(email, userId);

  if (result.success && result.claimedCount > 0) {
    console.log(`✅ Claimed ${result.claimedCount} freebie event(s)`);
    if (onSuccess) {
      onSuccess(result.claimedCount);
    }
  } else if (!result.success) {
    console.error('Failed to claim freebie events:', result.error);
    // Don't show error to user - this is a non-critical operation
  }
}
