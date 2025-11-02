'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EventDiagnostic() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = 'evt_1762052272850_mx311kqdh'; // Your specific event

  useEffect(() => {
    checkEvent();
  }, []);

  const checkEvent = async () => {
    try {
      console.log('🔍 Checking event:', eventId);
      
      // Check in database
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      console.log('📊 Event data from database:', event);
      setEventData(event);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('❌ Update error:', error);
        alert(`Update failed: ${error.message}`);
        return;
      }

      console.log('✅ Status updated:', data);
      setEventData(data);
      alert(`Status updated to: ${newStatus}`);
    } catch (err) {
      console.error('❌ Update error:', err);
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking event status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <img 
              src="/purple logo/purplelogo.png" 
              alt="Snapworxx Logo" 
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Diagnostic</h1>
          <p className="text-gray-600">Checking event: {eventId}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={checkEvent}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Retry Check
              </button>
            </div>
          ) : eventData ? (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Event Found ✅</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event ID</label>
                    <p className="text-gray-900 font-mono text-sm">{eventData.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event Name</label>
                    <p className="text-gray-900">{eventData.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      eventData.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {eventData.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Slug</label>
                    <p className="text-gray-900 font-mono text-sm">{eventData.slug}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{new Date(eventData.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stripe Session ID</label>
                    <p className="text-gray-900 font-mono text-xs break-all">{eventData.stripe_session_id}</p>
                  </div>
                  
                  {eventData.header_image && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Header Image</label>
                      <p className="text-green-600">✅ Set</p>
                    </div>
                  )}
                  
                  {eventData.profile_image && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profile Image</label>
                      <p className="text-green-600">✅ Set</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Controls */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Controls</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateStatus('active')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    disabled={eventData.status === 'active'}
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => updateStatus('inactive')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    disabled={eventData.status === 'inactive'}
                  >
                    Set Inactive
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/dashboard/${eventData.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href={`/e/${eventData.slug}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    View Gallery
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Event Not Found</h2>
              <p className="text-gray-600 mb-6">No event found with ID: {eventId}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}