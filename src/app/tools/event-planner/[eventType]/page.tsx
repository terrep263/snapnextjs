'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventTypePage() {
  const params = useParams();
  const eventType = (params.eventType as string)?.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tools/event-planner" className="text-purple-600 hover:text-purple-700 mb-6 inline-block">
          ← Back
        </Link>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{eventType} Planning</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Enter event name" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="$" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="0" />
            </div>
            
            <Link
              href={`/tools/event-planner/${params.eventType}/plan`}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Generate Plan
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
