'use client';

import { useState, useEffect } from 'react';
import { supabase, transformToCustomDomain } from '@/lib/supabase';

interface Photo {
  id: string;
  url: string;
  filename?: string;
  created_at?: string;
}

export default function SimpleGalleryTest() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📸 Loaded photos:', photos);
      
      if (error) {
        console.error('Error loading photos:', error);
      } else {
        // Transform URLs to use custom domain
        const transformedPhotos = (photos || []).map(photo => ({
          ...photo,
          url: transformToCustomDomain(photo.url)
        }));
        setPhotos(transformedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Loading Photos...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simple Gallery Test</h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p><strong>Photos found:</strong> {photos.length}</p>
          <p><strong>First photo URL:</strong> {photos[0]?.url || 'None'}</p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No photos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="bg-white rounded-lg shadow p-4">
                <div className="mb-2">
                  <p className="text-sm font-semibold">Photo {index + 1}</p>
                  <p className="text-xs text-gray-500">{photo.filename}</p>
                </div>
                
                {/* Test different image display methods */}
                <div className="space-y-4">
                  {/* Method 1: Regular img tag */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Regular img tag:</p>
                    <img 
                      src={photo.url}
                      alt={photo.filename || 'Photo'}
                      className="w-full h-32 object-cover rounded border"
                      onLoad={() => console.log('✅ Image loaded:', photo.filename)}
                      onError={() => console.log('❌ Image error:', photo.filename)}
                    />
                  </div>
                  
                  {/* Method 2: Background image */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Background image:</p>
                    <div 
                      className="w-full h-32 bg-cover bg-center rounded border"
                      style={{ backgroundImage: `url(${photo.url})` }}
                    />
                  </div>
                  
                  {/* Method 3: URL display */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">URL:</p>
                    <div className="text-xs bg-gray-100 p-2 rounded break-all">
                      {photo.url}
                    </div>
                  </div>
                  
                  {/* Method 4: Test URL directly */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Direct link:</p>
                    <a 
                      href={photo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}