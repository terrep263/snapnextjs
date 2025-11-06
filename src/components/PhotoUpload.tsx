'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SimplePhotoUploadProps {
  eventData: { id: string; name: string; slug?: string };
  onUploadComplete: () => void;
  disabled?: boolean;
}

export default function SimplePhotoUpload({
  eventData,
  onUploadComplete,
  disabled = false
}: SimplePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate event data
  if (!eventData || !eventData.id) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold">Error: Event data is missing</p>
        <p className="text-red-600 text-sm">Please refresh the page and try again.</p>
      </div>
    );
  }

  const handleUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newProgress: Record<string, number> = {};
    const newResults: Record<string, 'success' | 'error'> = {};
    const newErrors: Record<string, string> = {};

    // Initialize progress
    Array.from(files).forEach(file => {
      newProgress[file.name] = 0;
    });
    setProgress(newProgress);

    for (const file of Array.from(files)) {
      const fileName = file.name;

      try {
        // Step 1: Validate file size (1GB limit)
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 1024) {
          throw new Error(`File too large (${sizeMB.toFixed(0)}MB). Maximum is 1GB.`);
        }

        newProgress[fileName] = 10;
        setProgress({ ...newProgress });

        // Step 2: Generate unique file path
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `events/${eventData.id}/${timestamp}_${random}.${ext}`;

        newProgress[fileName] = 25;
        setProgress({ ...newProgress });

        console.log(`📤 Starting upload: ${fileName} (${sizeMB.toFixed(1)}MB)`);

        // Step 3: Upload to Supabase Storage with timeout and progress
        const uploadTimeout = Math.max(120000, sizeMB * 2000); // 2 seconds per MB, minimum 2 minutes
        console.log(`⏱️ Upload timeout set to: ${(uploadTimeout / 1000).toFixed(0)} seconds`);

        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          if (newProgress[fileName] < 55) {
            newProgress[fileName] = Math.min(newProgress[fileName] + 5, 55);
            setProgress({ ...newProgress });
          }
        }, 2000);

        try {
          const uploadPromise = supabase.storage
            .from('photos')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Upload timeout after ${(uploadTimeout / 1000).toFixed(0)} seconds`)), uploadTimeout)
          );

          const { data: uploadData, error: uploadError } = await Promise.race([
            uploadPromise,
            timeoutPromise
          ]);

          clearInterval(progressInterval);

          if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            console.error('Error details:', {
              message: uploadError.message,
              statusCode: (uploadError as any).statusCode,
              fileName: fileName,
              fileSize: sizeMB.toFixed(1) + 'MB'
            });
            throw new Error(uploadError.message || 'Upload failed');
          }

          console.log('✅ Upload complete:', fileName);

        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }

        newProgress[fileName] = 60;
        setProgress({ ...newProgress });

        // Step 4: Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        newProgress[fileName] = 75;
        setProgress({ ...newProgress });

        // Step 5: Ensure event exists in database
        const { data: existingEvent, error: eventCheckError } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventData.id)
          .maybeSingle();

        if (!existingEvent && !eventCheckError) {
          // Create event if it doesn't exist
          const { error: eventCreateError } = await supabase
            .from('events')
            .insert({
              id: eventData.id,
              name: eventData.name,
              slug: eventData.slug || eventData.id,
              status: 'active'
            });

          if (eventCreateError && !eventCreateError.message.includes('duplicate')) {
            console.error('Event creation error:', eventCreateError);
            throw new Error('Failed to create event: ' + eventCreateError.message);
          }
        }

        newProgress[fileName] = 85;
        setProgress({ ...newProgress });

        // Step 6: Save photo record to database
        const { error: photoError } = await supabase
          .from('photos')
          .insert({
            event_id: eventData.id,
            filename: file.name,
            url: publicUrl,
            file_path: filePath,
            size: file.size,
            type: file.type,
            is_video: file.type.startsWith('video/')
          });

        if (photoError) {
          console.error('Photo record error:', photoError);
          throw new Error('Failed to save photo record: ' + photoError.message);
        }

        // Success!
        newProgress[fileName] = 100;
        newResults[fileName] = 'success';
        setProgress({ ...newProgress });
        setResults({ ...newResults });

      } catch (error) {
        console.error('Upload failed for', fileName, ':', error);
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        newErrors[fileName] = errorMsg;
        newResults[fileName] = 'error';
        setErrors({ ...newErrors });
        setResults({ ...newResults });
      }
    }

    setUploading(false);

    // If all succeeded, trigger completion callback
    const allSuccess = Object.values(newResults).every(r => r === 'success');
    if (allSuccess) {
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, [eventData]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [eventData]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          disabled || uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            uploading ? 'bg-blue-200' : 'bg-blue-500'
          }`}>
            <Upload className="w-8 h-8 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {uploading ? 'Uploading...' : 'Upload Photos & Videos'}
            </h3>
            <p className="text-gray-600">
              {uploading
                ? 'Please wait while your files are being uploaded'
                : 'Drag and drop files here, or click to select files'
              }
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>Supported: JPG, PNG, GIF, WebP, MP4, MOV</p>
            <p>Maximum file size: 1GB</p>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      {Object.keys(progress).length > 0 && (
        <div className="space-y-3">
          {Object.entries(progress).map(([filename, percent]) => {
            const result = results[filename];
            const error = errors[filename];

            return (
              <div key={filename} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {result === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : result === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {filename}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 ml-2">
                    {percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                {!result && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                {/* Success/Error Message */}
                {result === 'success' && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Upload successful!
                  </p>
                )}
                {result === 'error' && error && (
                  <p className="text-sm text-red-600 mt-2">
                    ✗ {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
