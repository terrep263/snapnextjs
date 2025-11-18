'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EventSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [eventData, setEventData] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventPassword, setEventPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch event data from database
    const fetchEvent = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');

        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !event) {
          console.error('Error fetching event:', error);
          // Redirect to dashboard if event not found
          router.replace('/');
          return;
        }

        setEventData(event);
        setEventName(event.name || '');
        setEventDate(event.created_at?.split('T')[0] || '');
      } catch (err) {
        console.error('Error:', err);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug, router]);

  const handleSave = async () => {
    if (!eventData) return;

    setSaving(true);
    setMessage('');

    try {
      const { supabase } = await import('@/lib/supabase');

      // Update event name in database
      const { error } = await supabase
        .from('events')
        .update({ name: eventName })
        .eq('id', eventData.id);

      if (error) {
        throw error;
      }

      setMessage('Event settings updated successfully!');

      setTimeout(() => {
        router.push(`/dashboard/${eventData.id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (eventData) {
      router.push(`/dashboard/${eventData.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event settings...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapworxx logo (1).png" alt="Snapworxx" className="w-8 h-8" />
            <span className="text-lg font-bold text-gray-900">Snapworxx</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Event Settings</h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Sarah's Birthday Party"
              />
              <p className="text-sm text-gray-600 mt-2">Update your event name</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-sm text-gray-600 mt-2">Event date cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Password (Optional)</label>
              <input
                type="password"
                value={eventPassword}
                onChange={e => setEventPassword(e.target.value)}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Password protection is set"
              />
              <p className="text-sm text-gray-600 mt-2">Password cannot be changed after creation</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Only the event name can be edited. To change other settings, create a new event.
              </p>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-50 rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">About Your Event</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>✓ Your event is active for 30 days from creation</p>
            <p>✓ Guests can upload up to 1500 photos</p>
            <p>✓ All photos stay in your private gallery</p>
            <p>✓ You can download all photos at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
