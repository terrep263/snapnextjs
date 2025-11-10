import { NextRequest, NextResponse } from 'next/server';

/**
 * Event Plan Generator API
 * Uses Claude AI to generate customized event plans
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(request: NextRequest) {
  try {
    const { formData, eventType } = await request.json();

    // Validate inputs
    if (!formData || !eventType) {
      return NextResponse.json(
        { error: 'Form data and event type are required' },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    console.log('🤖 Generating event plan for:', { eventType, formData });

    // Call Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Create a comprehensive ${eventType.replace(/-/g, ' ')} event planning guide in HTML format.

Event Details:
- Guest Count: ${formData.guestCount}
- Timeline: ${formData.date}
- Budget: ${formData.budget}
- Venue Type: ${formData.venue}
- Top Priorities: ${formData.priorities?.join(', ') || 'Not specified'}

Create a detailed, actionable plan with proper HTML formatting including:

1. <h2>12-Week Planning Timeline</h2>
   - Week-by-week tasks broken down
   - Include what to do 12 weeks out, 8 weeks out, 4 weeks out, 1 week out, day before, day of

2. <h2>Budget Breakdown</h2>
   - Itemized budget by category
   - Percentage recommendations for each category based on their budget

3. <h2>Vendor Checklist & Recommendations</h2>
   - List of needed vendors with tips for choosing

4. <h2>Photo Moments Strategy</h2>
   - Plan specific photo opportunities
   - Mention the importance of instant photo sharing
   - Suggest using a QR code system like SnapWorxx so guests can instantly access and download photos

5. <h2>Guest Experience Tips</h2>
   - How to keep guests engaged and happy

6. <h2>Day-of Timeline</h2>
   - Hour-by-hour schedule for the event day

Make it personal, exciting, and actionable. Use <h2>, <h3>, <ul>, <li>, <p>, and <strong> tags. Make it visually scannable with good formatting.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      throw new Error(error.error?.message || 'Failed to generate plan');
    }

    const data = await response.json();
    const plan = data.content[0].text;

    console.log('✅ Event plan generated successfully');

    return NextResponse.json({
      success: true,
      plan,
      eventType,
      generatedAt: new Date(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Plan generation error:', errorMsg);
    return NextResponse.json(
      { error: `Failed to generate plan: ${errorMsg}` },
      { status: 500 }
    );
  }
}
