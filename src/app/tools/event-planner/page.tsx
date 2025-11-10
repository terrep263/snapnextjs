'use client';

export default function EventPlannerHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Planner</h1>
        <p className="text-lg text-gray-600 mb-8">
          Plan your perfect event with our intelligent event planning tool
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Event Type Selection */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Event Type</h2>
            <div className="space-y-3">
              {['Wedding', 'Birthday', 'Corporate', 'Conference', 'Festival', 'Other'].map((type) => (
                <a
                  key={type}
                  href={`/tools/event-planner/${type.toLowerCase()}`}
                  className="block p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {type}
                </a>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-purple-600 mr-3">✓</span>
                <span>AI-powered event planning</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-600 mr-3">✓</span>
                <span>Customized timelines</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-600 mr-3">✓</span>
                <span>Budget tracking</span>
              </li>
              <li className="flex items-center">
                <span className="text-purple-600 mr-3">✓</span>
                <span>Guest management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
