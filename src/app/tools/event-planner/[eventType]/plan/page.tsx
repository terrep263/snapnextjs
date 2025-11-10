'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EventPlanPage() {
  const params = useParams();
  const router = useRouter();
  const eventType = (params.eventType as string)?.replace(/-/g, ' ').toUpperCase();
  
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-event-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: params.eventType,
          // Add more data as needed
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      alert('Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{eventType} Plan</h1>

        {!plan ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Generating...' : 'Generate AI Event Plan'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Event Plan</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(plan, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
