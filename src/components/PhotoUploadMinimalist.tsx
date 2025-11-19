'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { ChunkedUploader } from '@/lib/chunkedUploader';
import { VideoCompressor } from '@/lib/videoCompressor';
import { SmartphoneVideoOptimizer } from '@/lib/smartphoneVideoOptimizer';
import { AdaptiveUploadLimits } from '@/lib/adaptiveUploadLimits';
import { SecureMediaManager } from '@/lib/secureMediaManager';
import { MediaAuditLogger } from '@/lib/mediaAuditLogger';
import { MediaBackupManager } from '@/lib/mediaBackupManager';

interface PhotoUploadProps {
  eventData: any;
  onUploadComplete: () => void;
  disabled?: boolean;
}

export default function PhotoUpload({ eventData, onUploadComplete, disabled = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadResults, setUploadResults] = useState<Record<string, 'success' | 'error'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chunkedUploader = new ChunkedUploader();
  const videoCompressor = new VideoCompressor();

  console.log('🔍 PhotoUpload initialized with eventData:', eventData);

  if (!eventData) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <p className="font-semibold">Upload Error</p>
        <p className="text-sm">Event data is missing. Please refresh the page and try again.</p>
      </div>
    );
  }

  if (!eventData.id) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <p className="font-semibold">Upload Error</p>
        <p className="text-sm">Event ID is missing. Please refresh the page and try again.</p>
      </div>
    );
  }

  const uploadToSupabase = async (
    files: FileList,
    progress: Record<string, number>,
    results: Record<string, 'success' | 'error'>
  ) => {
    const { supabase } = await import('@/lib/supabase');

    console.log(`🚀 Starting batch upload for ${files.length} files with event:`, {
      eventId: eventData?.id,
      eventName: eventData?.name,
    });

    if (!eventData?.id) {
      throw new Error('Event information is missing. Please refresh the page and try again.');
    }

    // Check photo limit for free promo events
    if (eventData.is_free && eventData.max_photos) {
      const { data: existingPhotos, error: countError } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventData.id);
      
      const currentPhotoCount = existingPhotos?.length || 0;
      const remainingSlots = eventData.max_photos - currentPhotoCount;
      
      if (remainingSlots <= 0) {
        throw new Error(`Photo limit reached! This free event has a maximum of ${eventData.max_photos} photos.`);
      }
      
      if (files.length > remainingSlots) {
        throw new Error(`Only ${remainingSlots} photo slots remaining (max ${eventData.max_photos} total). Please select fewer files.`);
      }
    }

    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}`;

      try {
        console.log(`🚀 Starting upload for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log(`📋 File details:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          extension: file.name.split('.').pop()?.toLowerCase()
        });

        // Determine if file is video - support .mov files explicitly
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isVideo = file.type.startsWith('video/') || 
                       fileExtension === 'mov' || 
                       fileExtension === 'mp4' || 
                       fileExtension === 'avi' || 
                       fileExtension === 'mkv' || 
                       fileExtension === 'webm';
        
        console.log(`🎬 Is video: ${isVideo}, Extension: ${fileExtension}, MIME: ${file.type}`);
        
        let processedFile = file;
        let filePublicUrl = '';

        // Video compression if needed
        if (isVideo && file.size > 50 * 1024 * 1024) {
          try {
            const compressionResult = await videoCompressor.compressVideo(file);
            if (compressionResult.success && compressionResult.file) {
              processedFile = compressionResult.file;
              console.log(`✅ Video compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
            }
          } catch (err) {
            console.warn(`⚠️ Compression skipped: ${err}`);
            processedFile = file;
          }
        }

        // Create file path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.-]/gi, '_');
        const filePath = `${eventData.id}/${timestamp}-${safeName}`;

        progress[key] = 10;
        setUploadProgress({ ...progress });

        // Upload to Supabase with explicit content type
        const contentType = file.type || (fileExtension === 'mov' ? 'video/quicktime' : 'application/octet-stream');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, processedFile, { 
            cacheControl: '3600', 
            upsert: false,
            contentType: contentType
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
        filePublicUrl = publicUrl;

        progress[key] = 80;
        setUploadProgress({ ...progress });

        // Get or create event
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventData.id)
          .single();

        if (!existingEvent) {
          await supabase.from('events').insert([{
            id: eventData.id,
            name: eventData.name || 'Event Gallery',
            slug: eventData.slug || eventData.id,
            status: 'active'
          }]);
        }

        // Save photo metadata with explicit MIME type for .mov files
        const mimeType = file.type || (fileExtension === 'mov' ? 'video/quicktime' : 'application/octet-stream');
        
        await supabase.from('photos').insert([{
          event_id: eventData.id,
          filename: file.name,
          url: filePublicUrl,
          file_path: filePath,
          size: processedFile.size,
          type: mimeType,
          mime_type: mimeType,
          is_video: isVideo,
          created_at: new Date().toISOString()
        }]);

        console.log(`✅ Upload successful: ${file.name}`);
        progress[key] = 100;
        results[key] = 'success';
        setUploadProgress({ ...progress });
        setUploadResults({ ...results });

      } catch (err) {
        console.error(`❌ Upload error for ${file.name}:`, err);
        results[key] = 'error';
        setUploadResults({ ...results });
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type !== 'dragleave' && e.type !== 'drop');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    const progress: Record<string, number> = {};
    const results: Record<string, 'success' | 'error'> = {};

    try {
      await uploadToSupabase(files, progress, results);
      
      // Check if all uploads were successful
      const allSuccessful = Object.values(results).every(r => r === 'success');
      if (allSuccessful) {
        setTimeout(onUploadComplete, 1500);
      }
    } catch (err) {
      console.error('❌ Batch upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [eventData, onUploadComplete]);

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 transition-all duration-200 cursor-pointer ${
          dragActive
            ? 'border-purple-600 bg-purple-50'
            : 'border-dashed border-gray-300 hover:border-purple-600 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv,.webm"
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="p-12">
          <div className="flex flex-col items-center text-center">
            <Upload className="h-12 w-12 text-purple-600 mx-auto mb-4" strokeWidth={1.5} />

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {uploading ? 'Uploading Your Photos...' : 'Drop your photos here'}
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              or <span className="text-purple-600 font-semibold">browse</span> to select files
            </p>

            <p className="text-xs text-gray-500">
              JPG, PNG, MP4, MOV • Up to 50MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" strokeWidth={1.5} />
            Upload Progress
          </h4>

          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([key, progress]) => {
              const filename = key.split('-')[0];
              const result = uploadResults[key];

              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {result === 'success' ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2} />
                      </div>
                    ) : result === 'error' ? (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-600" strokeWidth={2} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                      <span className="text-sm text-purple-600 font-medium">{progress}%</span>
                    </div>

                    {!result && (
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    {result && (
                      <p className={`text-xs font-medium ${result === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {result === 'success' ? 'Upload complete' : 'Upload failed'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Storage Status */}
      {(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl.includes('supabase.co');

        return (
          <div className={`rounded-lg p-4 border ${
            isConfigured
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isConfigured
                  ? 'bg-green-200 text-green-700'
                  : 'bg-yellow-200 text-yellow-700'
              }`}>
                {isConfigured ? '✓' : '!'}
              </div>
              <div className="text-sm">
                <p className={`font-semibold ${isConfigured ? 'text-green-900' : 'text-yellow-900'}`}>
                  {isConfigured ? 'Storage Configured' : 'Demo Mode'}
                </p>
                <p className={isConfigured ? 'text-green-800' : 'text-yellow-800'}>
                  {isConfigured
                    ? 'Your uploads will be securely stored.'
                    : 'Uploads are simulated for demonstration.'}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
