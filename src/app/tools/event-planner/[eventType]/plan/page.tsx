'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EventPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventType = (params.eventType as string)?.replace(/-/g, ' ').toUpperCase();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Get form data from localStorage
    const storedData = localStorage.getItem(`event-form-${params.eventType}`);
    if (storedData) {
      try {
        setFormData(JSON.parse(storedData));
      } catch (e) {
        console.error('Error parsing stored form data:', e);
      }
    }
  }, [params.eventType]);

  const handleGeneratePlan = async () => {
    if (!formData) {
      setError('No form data found. Please complete the questionnaire first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-event-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: params.eventType,
          formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating plan:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-700 mb-6 font-semibold"
        >
          ← Back
        </button>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{eventType} Plan</h1>
        <p className="text-gray-600 mb-6">AI-powered planning guide tailored to your event</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {!plan ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              {formData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Guest Count</p>
                    <p className="font-semibold">{formData.guestCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{formData.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold">{formData.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Venue Type</p>
                    <p className="font-semibold">{formData.venue}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No form data found</p>
              )}
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={loading || !formData}
              className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 rounded-lg transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Generating Your Plan...
                </span>
              ) : (
                'Generate AI Event Plan'
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: plan }} />
            </div>
            
            <button
              onClick={() => {
                setPlan(null);
                setError(null);
              }}
              className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Generate Another Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
