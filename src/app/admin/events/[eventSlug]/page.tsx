'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, QrCode, Loader2, ArrowLeft, Shield, User } from 'lucide-react';
import { supabase, getServiceRoleClient } from '@/lib/supabase';
import { getEventUrl } from '@/lib/utils';
import { useAuth } from '@/hooks';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import MasonryGallery from '@/components/MasonryGallery';

export default function AdminEventManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventSlug = params.eventSlug as string;
  const { authenticated, email: adminEmail, loading: authLoading } = useAuth();

  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingEventName, setEditingEventName] = useState(false);
  const [eventName, setEventName] = useState('');

  const eventUrl = eventData ? getEventUrl(eventData.slug) : '';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/admin/login');
    }
  }, [authenticated, authLoading, router]);

  // Load event data
  useEffect(() => {
    if (authenticated && eventSlug) {
      loadEventData();
    }
  }, [authenticated, eventSlug]);

  // Load photos when event is loaded
  useEffect(() => {
    if (eventData?.id) {
      loadPhotos();
    }
  }, [eventData?.id]);

  // Sync event name
  useEffect(() => {
    if (eventData?.name) {
      setEventName(eventData.name);
    }
  }, [eventData]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [Admin] Loading event by slug:', eventSlug);

      // Fetch event by slug (admin has full access, bypass owner check)
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .single();

      if (eventError) {
        console.error('Error loading event:', eventError);
        setError(`Event not found: ${eventSlug}`);
        setLoading(false);
        return;
      }

      if (!event) {
        setError(`Event not found: ${eventSlug}`);
        setLoading(false);
        return;
      }

      console.log('✅ [Admin] Event loaded:', event);
      setEventData(event);

      // Load images from database
      if (event.header_image) {
        setHeaderImage(event.header_image);
      }
      if (event.profile_image) {
        setProfileImage(event.profile_image);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading event data:', error);
      setError('Failed to load event');
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      console.log('📸 [Admin] Loading photos for event:', eventData.id);

      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading photos:', error);
      } else {
        setPhotos(photos || []);
        console.log(`✅ [Admin] Loaded ${photos?.length || 0} photos`);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleDownloadPhoto = async (photo: any) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename || `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo');
      } else {
        // Refresh photos
        loadPhotos();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const handleUpdateEventName = async () => {
    if (!eventName.trim()) {
      alert('Event name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ name: eventName })
        .eq('id', eventData.id);

      if (error) {
        console.error('Error updating event name:', error);
        alert('Failed to update event name');
      } else {
        setEventData({ ...eventData, name: eventName });
        setEditingEventName(false);
      }
    } catch (error) {
      console.error('Error updating event name:', error);
      alert('Failed to update event name');
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <Shield className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Access Denied</h2>
            <p className="text-yellow-600 mb-4">
              You must be logged in as an admin to access this page.
            </p>
            <Link
              href="/admin/login"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Go to Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">ADMIN MODE</p>
              <p className="text-xs opacity-90">
                Managing event for: <span className="font-semibold">{eventData?.email || 'Unknown'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs opacity-90">
              Logged in as: <span className="font-semibold">{adminEmail}</span>
            </div>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Event Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {editingEventName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-purple-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateEventName}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEventName(eventData.name);
                      setEditingEventName(false);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1
                  className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-purple-600"
                  onClick={() => setEditingEventName(true)}
                >
                  {eventData?.name || 'Untitled Event'}
                </h1>
              )}
              <p className="text-gray-500 mt-1">
                Created: {new Date(eventData?.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-500">
                Status: <span className="font-semibold">{eventData?.status || 'active'}</span>
              </p>
              <p className="text-gray-500">
                Event ID: <span className="font-mono text-sm">{eventData?.id}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/e/${eventData?.slug}`}
                target="_blank"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                View Gallery
              </Link>
            </div>
          </div>

          {/* Event URL & QR Code */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event URL (Share with guests)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={eventUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(eventUrl);
                  alert('URL copied to clipboard!');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                Copy
              </button>
            </div>

            <div className="mt-4">
              <QRCodeGenerator url={eventUrl} />
            </div>
          </div>
        </div>

        {/* Photos Gallery */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Photos ({photos.length})
            </h2>
          </div>

          {photos.length > 0 ? (
            <MasonryGallery
              photos={photos}
              onDownload={handleDownloadPhoto}
              onDelete={handleDeletePhoto}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No photos uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
