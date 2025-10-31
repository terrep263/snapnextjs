'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, QrCode, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import MasonryGallery from '@/components/MasonryGallery';

export default function Dashboard() {
  const params = useParams();
  const eventId = params.id as string;
  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingEventName, setEditingEventName] = useState(false);
  const [eventName, setEventName] = useState('');

  const eventUrl = eventData ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/e/${eventData.slug}` : '';

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (eventUrl) {
      loadPhotos();
    }
  }, [eventUrl]);

  useEffect(() => {
    if (eventData?.name) {
      setEventName(eventData.name);
    }
  }, [eventData]);

  const loadEventData = async () => {
    try {
      // Handle mock events for development
      if (eventId === 'mock_event_id' || eventId === 'sample-event-id') {
        const mockEvent = {
          id: eventId,
          name: 'Sample Event for Development',
          slug: 'sample-event-dev',
          created_at: new Date().toISOString(),
          status: 'active'
        };
        setEventData(mockEvent);
        setLoading(false);
        return;
      }

      // Try to get from localStorage first
      const storedEvent = localStorage.getItem('currentEvent');
      if (storedEvent) {
        const parsed = JSON.parse(storedEvent);
        if (parsed.id === eventId) {
          setEventData(parsed);
          setLoading(false);
          return;
        }
      }

      // Otherwise fetch from database
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error loading event:', error);
        // If database fails, create a mock event
        const mockEvent = {
          id: eventId,
          name: 'Sample Event (Database Not Connected)',
          slug: 'sample-event',
          created_at: new Date().toISOString(),
          status: 'active'
        };
        setEventData(mockEvent);
      } else {
        setEventData(event);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading photos:', error);
      } else {
        setPhotos(photos || []);
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

  const handleDownloadAll = async () => {
    // For now, download photos one by one
    // In production, you might want to create a ZIP file server-side
    for (const photo of photos) {
      await handleDownloadPhoto(photo);
      // Add delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const updateEventName = async (newName: string) => {
    if (!newName.trim()) return;
    
    try {
      // Try to update in database first
      const { error } = await supabase
        .from('events')
        .update({ name: newName.trim() })
        .eq('id', eventId);

      if (error && error.code !== 'PGRST116') {
        console.error('Database update failed:', error);
      }

      // Update local state regardless
      setEventData((prev: any) => prev ? { ...prev, name: newName.trim() } : null);
      setEventName(newName.trim());
      setEditingEventName(false);

      // Also update in localStorage if it exists
      const storedEvent = localStorage.getItem('currentEvent');
      if (storedEvent) {
        const parsed = JSON.parse(storedEvent);
        if (parsed.id === eventId) {
          parsed.name = newName.trim();
          localStorage.setItem('currentEvent', JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Error updating event name:', error);
      // Still update local state for development
      setEventData((prev: any) => prev ? { ...prev, name: newName.trim() } : null);
      setEventName(newName.trim());
      setEditingEventName(false);
    }
  };

  const handleImageUpload = (type: 'header' | 'profile') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (type === 'header') {
            setHeaderImage(result);
            setEditingHeader(false);
            // Save to localStorage for persistence
            localStorage.setItem(`headerImage_${eventId}`, result);
          } else {
            setProfileImage(result);
            setEditingProfile(false);
            // Save to localStorage for persistence
            localStorage.setItem(`profileImage_${eventId}`, result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeImage = (type: 'header' | 'profile') => {
    if (type === 'header') {
      setHeaderImage(null);
      setEditingHeader(false);
      localStorage.removeItem(`headerImage_${eventId}`);
    } else {
      setProfileImage(null);
      setEditingProfile(false);
      localStorage.removeItem(`profileImage_${eventId}`);
    }
  };

  // Load saved images from localStorage
  useEffect(() => {
    if (eventId) {
      const savedHeader = localStorage.getItem(`headerImage_${eventId}`);
      const savedProfile = localStorage.getItem(`profileImage_${eventId}`);
      if (savedHeader) setHeaderImage(savedHeader);
      if (savedProfile) setProfileImage(savedProfile);
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event dashboard...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-bold">Event Not Found</h1>
          <p className="text-gray-600">This event link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header Background Image */}
      <div className="relative">
        {headerImage ? (
          <div className="relative h-64 w-full overflow-hidden">
            <img 
              src={headerImage} 
              alt="Header background"
              className="w-full h-full object-cover"
            />
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleImageUpload('header')}
                  className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Change Header
                </button>
                <button
                  onClick={() => removeImage('header')}
                  className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="relative h-64 w-full bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors cursor-pointer group"
            onClick={() => handleImageUpload('header')}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-600">
              <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-semibold mb-2">Add Header Image</p>
              <p className="text-sm text-purple-500">1920 x 256px recommended • Click to upload</p>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">SnapWorxx</span>
            </Link>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Profile */}
      <div className="relative pt-8 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            {/* Event Profile Image */}
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 p-1 shadow-2xl group relative">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt={eventData.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors cursor-pointer">
                      <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-medium">Profile Image</span>
                      <span className="text-xs">128x128px</span>
                    </div>
                  )}
                  
                  {/* Edit overlay for profile image */}
                  {profileImage && (
                    <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleImageUpload('profile')}
                          className="bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeImage('profile')}
                          className="bg-red-500/90 hover:bg-red-500 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Click handler for empty profile */}
                {!profileImage && (
                  <div 
                    className="absolute inset-0 rounded-full cursor-pointer"
                    onClick={() => handleImageUpload('profile')}
                  />
                )}
              </div>
            </div>

            {/* Editable Event Title */}
            <div className="mb-2">
              {editingEventName ? (
                <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-500 focus:outline-none text-center"
                    placeholder="Event Name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateEventName(eventName);
                      if (e.key === 'Escape') {
                        setEditingEventName(false);
                        setEventName(eventData?.name || '');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => updateEventName(eventName)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                    title="Save"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingEventName(false);
                      setEventName(eventData?.name || '');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="group relative inline-block">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {eventData ? eventData.name : 'Event Dashboard'}
                  </h1>
                  <button
                    onClick={() => setEditingEventName(true)}
                    className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-md transition-all duration-200 text-xs"
                    title="Edit event name"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Manage your event and view all uploaded photos
            </p>
          </div>

          <main className="space-y-8">
            {/* Event Details Section */}
            <div className="rounded-lg bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        onBlur={() => {
                          if (eventName !== eventData?.name && eventName.trim()) {
                            updateEventName(eventName);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter event name"
                      />
                    </div>
                  </div>
                  
                  {eventData?.event_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                        {new Date(eventData.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        eventData?.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {eventData?.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photos Uploaded</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                      {photos.length} photos
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={eventUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(eventUrl)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        title="Copy URL"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Customization Section */}
            <div className="rounded-lg bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Event Customization
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Header Image Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Image</h3>
                  <div className="space-y-4">
                    {/* Header Preview */}
                    <div className="relative">
                      {headerImage ? (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                          <img 
                            src={headerImage} 
                            alt="Header preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No header image</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Header Controls */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleImageUpload('header')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {headerImage ? 'Change Header' : 'Upload Header'}
                      </button>
                      {headerImage && (
                        <button
                          onClick={() => removeImage('header')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Recommended: 1920 x 256px for best results</p>
                  </div>
                </div>

                {/* Profile Image Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Image</h3>
                  <div className="space-y-4">
                    {/* Profile Preview */}
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile preview"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile Controls */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleImageUpload('profile')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {profileImage ? 'Change Profile' : 'Upload Profile'}
                      </button>
                      {profileImage && (
                        <button
                          onClick={() => removeImage('profile')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Recommended: 128 x 128px, square format</p>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery Preview</h3>
                <p className="text-sm text-gray-600 mb-4">This is how your event gallery will appear to guests:</p>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400 p-1 shadow-lg mb-3">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{eventData?.name}</h4>
                    <p className="text-sm text-gray-600">Memories that last a life time ❤️</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg border border-gray-100">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <QrCode className="h-5 w-5 text-purple-600" />
                Event QR Code & Link
              </h2>
              {eventUrl && (
                <QRCodeGenerator 
                  url={eventUrl}
                  eventName={eventData?.name}
                  size={256}
                />
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg border border-gray-100">
              <MasonryGallery 
                photos={photos}
                onDownload={handleDownloadPhoto}
                onDownloadAll={handleDownloadAll}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
