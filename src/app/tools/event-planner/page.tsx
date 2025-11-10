'use client';

import { useRouter } from 'next/navigation';

const eventTypes = [
  { 
    id: 'wedding', 
    name: 'Wedding', 
    icon: '💒',
    description: 'Plan your perfect wedding day'
  },
  { 
    id: 'birthday', 
    name: 'Birthday Party', 
    icon: '🎂',
    description: 'Celebrate another trip around the sun'
  },
  { 
    id: 'corporate', 
    name: 'Corporate Event', 
    icon: '💼',
    description: 'Professional events that impress'
  },
  { 
    id: 'baby-shower', 
    name: 'Baby Shower', 
    icon: '👶',
    description: 'Welcome the newest arrival'
  },
  { 
    id: 'graduation', 
    name: 'Graduation', 
    icon: '🎓',
    description: 'Celebrate academic achievements'
  },
  { 
    id: 'anniversary', 
    name: 'Anniversary', 
    icon: '💕',
    description: 'Mark years of love and commitment'
  },
];

export default function EventPlannerLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Free Event Planning Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Get a custom event plan in minutes
          </p>
          <p className="text-sm text-gray-500">
            Powered by SnapWorxx • 100% Free • No credit card required
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">
            What type of event are you planning?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((event) => (
              <button
                key={event.id}
                onClick={() => router.push(`/tools/event-planner/${event.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-8 text-center border-2 border-transparent hover:border-purple-500"
              >
                <div className="text-6xl mb-4">{event.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {event.name}
                </h3>
                <p className="text-gray-600 text-sm">{event.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-4">
            ✨ <strong>Join 10,000+ event planners</strong> who've used our free tool
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <span>⚡ Instant Results</span>
            <span>📋 Customized Plans</span>
            <span>🎉 Event Success Tips</span>
          </div>
        </div>
      </div>
    </div>
  );
}
