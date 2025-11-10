import { NextRequest, NextResponse } from 'next/server';

/**
 * Lead Capture API
 * Stores user information for follow-up
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, eventType, budget, notes } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    console.log('📧 New lead captured:', { email, name, eventType, budget });

    // TODO: Store in database or CRM
    // For now, just log and return success

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      lead: {
        email,
        name,
        eventType,
        budget,
        notes,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
