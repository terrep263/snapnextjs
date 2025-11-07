'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Zap, Lock, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PhotoUploadMinimalist from '@/components/PhotoUploadMinimalist';
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
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <Link 
                href={`/e/${slug}`}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors font-medium text-sm md:text-base"
              >
                <ArrowLeft size={18} className="md:w-5 md:h-5" />
                <span>Back to Gallery</span>
              </Link>
              
              <div className="text-center">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 line-clamp-1">{eventData.name}</h1>
                <p className="text-xs md:text-sm text-gray-500">Upload Your Memories</p>
              </div>

              <div className="w-0 md:w-32"></div> {/* Spacer for centering - hidden on mobile */}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* LEFT COLUMN - INFO SECTION */}
            <div className="flex flex-col justify-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
                  Share Your<br />
                  <span style={{ color: '#9333ea' }}>Moments</span>
                </h2>
                
                <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-10 leading-relaxed">
                  Upload your photos and videos from <strong className="text-gray-900">{eventData.name}</strong>. Your memories will be instantly available in the gallery for everyone to enjoy and download.
                </p>

                {/* Features Grid */}
                <div className="space-y-4 md:space-y-6">
                  {/* Feature 1 */}
                  <div className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100">
                        <Upload className="h-5 w-5 md:h-6 md:w-6 text-purple-600" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-1">Easy Upload</h3>
                      <p className="text-xs md:text-sm text-gray-600">Drag and drop or click to select photos and videos. Multiple files at once.</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100">
                        <Zap className="h-5 w-5 md:h-6 md:w-6 text-purple-600" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-1">Instant Sharing</h3>
                      <p className="text-xs md:text-sm text-gray-600">Your uploads appear immediately in the gallery for all guests to see.</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100">
                        <Lock className="h-5 w-5 md:h-6 md:w-6 text-purple-600" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-1">Secure Storage</h3>
                      <p className="text-xs md:text-sm text-gray-600">Your memories are safely stored and backed up automatically.</p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg bg-purple-100">
                        <Share2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-1">Shareable Gallery</h3>
                      <p className="text-xs md:text-sm text-gray-600">All photos are accessible in a beautiful gallery that guests can browse.</p>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200">
                  <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
                    <strong>Supported formats:</strong> JPG, PNG, MP4, MOV, WebM
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    <strong>File limits:</strong> Up to 50MB for videos, 10MB for photos
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - UPLOAD FORM SECTION */}
            <div>
              <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-4 md:p-8">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Upload Your Files</h3>
                
                <PhotoUploadMinimalist 
                  eventData={eventData}
                  onUploadComplete={handleUploadComplete}
                />

                {/* Help Text */}
                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-300">
                  <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base flex items-center gap-2">
                    <span className="text-purple-600">ℹ</span>
                    How it works
                  </h4>
                  <ol className="text-xs md:text-sm text-gray-600 space-y-1.5 md:space-y-2">
                    <li><strong>1.</strong> Select photos or videos from your device</li>
                    <li><strong>2.</strong> Watch the progress as files upload securely</li>
                    <li><strong>3.</strong> You'll be redirected to the gallery when complete</li>
                    <li><strong>4.</strong> Your photos are now visible to all guests!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}