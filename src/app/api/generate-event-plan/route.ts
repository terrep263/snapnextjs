import { NextRequest, NextResponse } from 'next/server';

/**
 * Event Plan Generator API
 * Uses AI to generate customized event plans
 */

const eventPlanTemplates: Record<string, object> = {
  wedding: {
    title: 'Wedding Planning Timeline',
    phases: [
      {
        phase: '6-12 Months Before',
        tasks: ['Set budget', 'Decide on date', 'Choose venue', 'Start vendor search'],
      },
      {
        phase: '3-6 Months Before',
        tasks: ['Book vendors', 'Create guest list', 'Send invitations', 'Plan menu'],
      },
      {
        phase: '1-3 Months Before',
        tasks: ['Final headcount', 'Seating arrangements', 'Rehearsal planning', 'Final details'],
      },
      {
        phase: 'Week Before',
        tasks: ['Final confirmations', 'Setup planning', 'Day-of coordinator', 'Emergency kit'],
      },
    ],
  },
  birthday: {
    title: 'Birthday Party Planning Timeline',
    phases: [
      {
        phase: '2-4 Weeks Before',
        tasks: ['Choose theme', 'Book venue', 'Create guest list', 'Send invitations'],
      },
      {
        phase: '1-2 Weeks Before',
        tasks: ['Order cake', 'Buy decorations', 'Plan games/activities', 'Confirm RSVPs'],
      },
      {
        phase: 'Day Before',
        tasks: ['Prepare decorations', 'Get supplies', 'Plan seating', 'Final checklist'],
      },
      {
        phase: 'Day Of',
        tasks: ['Setup', 'Greet guests', 'Cake cutting', 'Photos'],
      },
    ],
  },
  corporate: {
    title: 'Corporate Event Planning Timeline',
    phases: [
      {
        phase: '3-6 Months Before',
        tasks: ['Define objectives', 'Choose date/venue', 'Set budget', 'Identify speakers'],
      },
      {
        phase: '1-3 Months Before',
        tasks: ['Send invitations', 'Book speakers', 'Arrange catering', 'Plan logistics'],
      },
      {
        phase: '2-4 Weeks Before',
        tasks: ['Confirm attendance', 'Finalize agenda', 'Prepare materials', 'Tech setup'],
      },
      {
        phase: 'Week Of',
        tasks: ['Final confirmations', 'Setup venue', 'Run tests', 'Brief staff'],
      },
    ],
  },
  conference: {
    title: 'Conference Planning Timeline',
    phases: [
      {
        phase: '6-12 Months Before',
        tasks: ['Select venue', 'Define topics', 'Budget allocation', 'Speaker recruitment'],
      },
      {
        phase: '3-6 Months Before',
        tasks: ['Confirm speakers', 'Open registration', 'Plan schedule', 'Arrange logistics'],
      },
      {
        phase: '1-3 Months Before',
        tasks: ['Marketing push', 'Finalize agenda', 'Prepare materials', 'Tech testing'],
      },
      {
        phase: 'Week Of',
        tasks: ['Venue setup', 'Registration setup', 'Speaker briefing', 'Final checks'],
      },
    ],
  },
  festival: {
    title: 'Festival Planning Timeline',
    phases: [
      {
        phase: '6-12 Months Before',
        tasks: ['Secure permits', 'Choose location', 'Book artists', 'Plan layout'],
      },
      {
        phase: '3-6 Months Before',
        tasks: ['Finalize artists', 'Arrange vendors', 'Marketing campaign', 'Logistics'],
      },
      {
        phase: '1-3 Months Before',
        tasks: ['Ticket sales push', 'Staff recruitment', 'Equipment rental', 'Schedule finalization'],
      },
      {
        phase: 'Week Of',
        tasks: ['Setup', 'Staff briefing', 'Sound check', 'Emergency protocols'],
      },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventName, date, budget, guestCount } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Get template or default to "other"
    const template = eventPlanTemplates[eventType.toLowerCase()] || {
      title: 'Event Planning Timeline',
      phases: [
        {
          phase: 'Planning Phase',
          tasks: ['Define objectives', 'Set budget', 'Choose venue', 'Identify key dates'],
        },
        {
          phase: 'Preparation Phase',
          tasks: ['Book vendors', 'Send invitations', 'Plan logistics', 'Create timeline'],
        },
        {
          phase: 'Finalization Phase',
          tasks: ['Confirm details', 'Final checklist', 'Staff briefing', 'Emergency planning'],
        },
      ],
    };

    const plan = {
      ...template,
      eventName: eventName || `${eventType} Event`,
      date,
      budget,
      guestCount,
      generatedAt: new Date(),
      checklist: {
        budget: budget ? `Track spending against $${budget} budget` : 'Create budget',
        guests: guestCount ? `Manage ${guestCount} guests` : 'Create guest list',
        communication: 'Send regular updates to team',
        logistics: 'Coordinate all vendors and staff',
        contingency: 'Have backup plans ready',
      },
    };

    console.log('📋 Generated event plan:', { eventType, eventName });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate event plan' },
      { status: 500 }
    );
  }
}
