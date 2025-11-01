'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PhotoUpload from '@/components/PhotoUpload';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load real event from database
  useEffect(() => {
    loadEvent();
  }, [slug]);

  const loadEvent = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      console.log('📤 Loading event for upload:', slug);
      
      // Try to load real event from database first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (eventError && eventError.code !== 'PGRST116') {
        throw new Error(`Failed to load event: ${eventError.message}`);
      }

      if (event) {
        // Real event found
        console.log('✅ Real event loaded for upload:', event);
        setEventData(event);
      } else {
        // Event not found, redirect to gallery which will show 404
        console.log('❌ Event not found, redirecting to gallery');
        router.push(`/e/${slug}`);
        return;
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading event for upload:', errorMessage);
      // Redirect to gallery on error
      router.push(`/e/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    console.log('✅ Upload completed, redirecting to gallery');
    router.push(`/e/${slug}`);
  };

  if (loading || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Link 
                href={`/e/${slug}`}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Gallery</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <img 
                  src="/purple logo/purplelogo.png" 
                  alt="Snapworxx Logo" 
                  className="h-16 w-auto"
                />
                <div className="text-center">
                  <h1 className="text-xl font-semibold text-gray-900">{eventData.name}</h1>
                  <p className="text-sm text-gray-500">Upload Photos & Videos</p>
                </div>
              </div>

              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto bg-purple-50 rounded-3xl flex items-center justify-center mb-6 shadow-lg p-4">
              <img 
                src="/snapworxx logo (1).png" 
                alt="Snapworxx Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{color: '#5d1ba6'}}>
              Share Your Moments
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload your photos and videos to <strong>{eventData.name}</strong>. 
              Your memories will be instantly available in the gallery for everyone to enjoy.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Upload</h3>
                <p className="text-sm text-gray-600">Drag & drop or click to select multiple photos and videos</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Instant Sharing</h3>
                <p className="text-sm text-gray-600">Photos appear immediately in the gallery for all guests</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
                <p className="text-sm text-gray-600">Your photos are safely stored and backed up automatically</p>
              </div>
            </div>
          </div>

          {/* Upload Component */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <PhotoUpload 
              eventData={eventData}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Select photos or videos from your device (up to 50MB for videos, 10MB for photos)</li>
                  <li>2. Watch the upload progress - your files are being processed securely</li>
                  <li>3. Once complete, you'll be redirected back to the gallery to see your photos</li>
                  <li>4. Share the gallery link with others so they can see and add their own memories!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}