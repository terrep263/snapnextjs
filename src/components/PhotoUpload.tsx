'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

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

  // Validate eventData on component mount
  console.log('🔍 PhotoUpload initialized with eventData:', eventData);
  
  if (!eventData) {
    console.error('❌ PhotoUpload: eventData is null/undefined');
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <p className="font-semibold">Upload Error</p>
        <p className="text-sm">Event data is missing. Please refresh the page and try again.</p>
      </div>
    );
  }

  if (!eventData.id) {
    console.error('❌ PhotoUpload: eventData.id is missing:', eventData);
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
      eventSlug: eventData?.slug
    });

    // Validate eventData before starting any uploads
    if (!eventData?.id) {
      console.error('❌ Cannot upload: eventData or eventData.id is missing');
      throw new Error('Event information is missing. Please refresh the page and try again.');
    }
    
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}`;
      
      try {
        console.log(`🚀 Starting upload for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Check file size limit (50MB for videos, 10MB for images)
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for images
        
        if (file.size > maxSize) {
          console.error(`❌ File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          results[key] = 'error';
          setUploadResults({ ...results });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const fileExt = file.name.split('.').pop();
        const filename = `${timestamp}_${randomStr}.${fileExt}`;
        const filePath = `events/${eventData.id}/${filename}`;

        // Start progress
        progress[key] = 10;
        setUploadProgress({ ...progress });

        console.log(`📤 Uploading to Supabase: ${filePath}`);

        // Create upload promise with timeout
        const uploadPromise = supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        // Set timeout for large files (5 minutes for videos, 2 minutes for images)
        const timeoutMs = isVideo ? 5 * 60 * 1000 : 2 * 60 * 1000;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
        );

        // Progress simulation for large files
        const progressInterval = setInterval(() => {
          if (progress[key] < 50) {
            progress[key] = Math.min(progress[key] + (isVideo ? 2 : 5), 50);
            setUploadProgress({ ...progress });
          }
        }, 1000);

        // Race between upload and timeout
        const { data: uploadData, error: uploadError } = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]) as any;

        clearInterval(progressInterval);

        if (uploadError) {
          console.error('❌ Upload error:', uploadError.message);
          results[key] = 'error';
          setUploadResults({ ...results });
          continue;
        }

        console.log(`✅ Upload successful: ${file.name}`);
        progress[key] = 70;
        setUploadProgress({ ...progress });

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        progress[key] = 80;
        setUploadProgress({ ...progress });

        // Ensure event exists in database first
        console.log('🔍 Checking if event exists in database:', eventData.id);
        const { data: existingEvent, error: eventCheckError } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventData.id)
          .single();

        console.log('🔍 Event check result:', { existingEvent, eventCheckError });

        if (eventCheckError && eventCheckError.code === 'PGRST116') {
          // Event doesn't exist, create it
          console.log('📝 Creating event in database:', eventData.id);
          
          // Validate required fields
          const name = eventData.name || 'Event Gallery';
          const slug = eventData.slug || eventData.id;
          const email = 'guest@example.com';
          
          console.log('📝 Event creation fields:', { id: eventData.id, name, slug, email });
          
          if (!name || !slug || !email || !eventData.id) {
            console.error('❌ Missing required fields for event creation', { 
              eventId: eventData.id, 
              name, 
              slug, 
              email,
              hasEventId: !!eventData.id
            });
            throw new Error('Missing required event information. Please refresh the page and try again.');
          }
          
          try {
            const { data: event, error: insertError } = await supabase
              .from('events')
              .insert([{
                id: eventData.id,
                name: name,
                slug: slug,
                status: 'active'
              }])
              .select()
              .single()
              .throwOnError();
            
            if (insertError) {
              console.error('❌ Event creation error:', insertError);
              throw insertError;
            }
            
            console.log('✅ Event created successfully:', event);
          } catch (err) {
            // If it's a duplicate key error, that's fine - event already exists
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.log('⚠️ Event creation error details:', {
              error: err,
              message: errorMessage,
              eventId: eventData.id
            });
            
            if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint') || errorMessage.includes('already exists')) {
              console.log('✅ Event already exists (duplicate key), continuing...');
            } else {
              console.error('❌ Failed to create event:', err);
              throw new Error(`Failed to create event: ${errorMessage}`);
            }
          }
        } else if (existingEvent) {
          console.log('✅ Event already exists:', eventData.id);
        } else if (eventCheckError) {
          console.error('❌ Error checking event existence (raw):', eventCheckError);
          try {
            console.error('❌ JSON:', JSON.stringify(eventCheckError, null, 2));
          } catch {}
        }

        // Validate event data before creating photo record
        if (!eventData?.id) {
          throw new Error('Event ID is required to upload photos');
        }

        // Build photo record with validation
        const photoRecord = {
          event_id: eventData.id,
          filename: file.name,
          url: publicUrl,
          file_path: filePath,
          size: file.size,
          type: file.type,
          is_video: isVideo
        };

        // Validate photoRecord is complete
        console.log('💾 Prepared photo record:', photoRecord);
        console.log('🔍 Event ID being used:', eventData.id);
        
        if (!photoRecord.event_id) {
          throw new Error('Event ID is required to upload photos');
        }
        
        if (!photoRecord.url || !photoRecord.file_path) {
          throw new Error('Photo URL and file path are required');
        }

        // Final verification: Ensure event exists in database before photo insertion
        console.log('🔍 Final verification: Checking if event exists before photo insertion');
        const { data: verifyEvent, error: verifyError } = await supabase
          .from('events')
          .select('id')
          .eq('id', photoRecord.event_id)
          .maybeSingle();

        if (verifyError) {
          console.error('❌ Error verifying event existence:', verifyError);
          throw new Error(`Failed to verify event exists: ${verifyError.message}`);
        }

        if (!verifyEvent) {
          console.error('❌ Event not found in database:', photoRecord.event_id);
          throw new Error(`Event not found. Please refresh the page and try again.`);
        }

        console.log('✅ Event verification passed, proceeding with photo insertion');
        
        try {
          const { data: photoInsertData, error: insertError } = await supabase
            .from('photos')
            .insert([photoRecord])
            .select()
            .throwOnError();
          
          if (insertError) {
            console.error('❌ Photo insert error:', insertError);
            throw insertError;
          }
          
          console.log('✅ Photo record saved successfully:', photoInsertData);
        } catch (dbError) {
          console.error('❌ Database error (raw):', dbError);
          console.error('❌ Failed photo record details:', {
            photoRecord,
            eventExists: !!verifyEvent,
            eventId: photoRecord.event_id
          });
          
          // Provide user-friendly error message
          if (dbError instanceof Error) {
            if (dbError.message.includes('foreign key constraint') || dbError.message.includes('violates foreign key')) {
              throw new Error(`Event reference is invalid. Please refresh the page and try uploading again.`);
            } else if (dbError.message.includes('duplicate key') || dbError.message.includes('unique constraint')) {
              console.warn('⚠️ Duplicate photo detected, treating as success');
            } else {
              throw new Error(`Database error: ${dbError.message}`);
            }
          } else {
            throw new Error('An unexpected database error occurred. Please try again.');
          }
        }

        progress[key] = 100;
        results[key] = 'success';
        setUploadProgress({ ...progress });
        setUploadResults({ ...results });

      } catch (error) {
        console.error('❌ Upload failed:', error);
        results[key] = 'error';
        setUploadResults({ ...results });
      }
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0 || !eventData) {
      console.error('❌ Missing required data:', { files: !!files, filesLength: files?.length, eventData });
      return;
    }

    console.log('🚀 Starting upload with event data:', eventData);

    // Validate eventData structure
    if (!eventData.id) {
      console.error('❌ EventData missing required id property:', eventData);
      return;
    }

    setUploading(true);
    const results: Record<string, 'success' | 'error'> = {};
    const progress: Record<string, number> = {};

    // Initialize progress for all files
    Array.from(files).forEach(file => {
      const key = `${file.name}-${file.size}`;
      progress[key] = 0;
    });
    setUploadProgress(progress);

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = 
        supabaseUrl && 
        supabaseKey &&
        !supabaseUrl.includes('placeholder') && 
        !supabaseUrl.includes('your-project') &&
        !supabaseKey.includes('placeholder') &&
        supabaseUrl.includes('supabase.co');

      if (isSupabaseConfigured) {
        console.log('✅ Supabase configured - using real upload to:', supabaseUrl);
        // Real upload to Supabase
        await uploadToSupabase(files, progress, results);
      } else {
        console.log('⚠️ Supabase not configured - simulating upload');
        // Simulate upload for demo
        for (const file of Array.from(files)) {
          const key = `${file.name}-${file.size}`;
          
          // Simulate upload progress
          for (let i = 10; i <= 100; i += 10) {
            progress[key] = i;
            setUploadProgress({ ...progress });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          results[key] = 'success';
          setUploadResults({ ...results });
        }
      }
      
      setUploading(false);
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  }, [eventData, onUploadComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Area */}
      <div
        className={`group relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 scale-105 shadow-xl'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50 hover:border-indigo-400 hover:shadow-lg'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 rounded-3xl opacity-5 bg-gradient-to-br from-indigo-600 to-purple-600"></div>
        
        {/* Animated Border Glow */}
        <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 ${
          dragActive ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl -z-10`}></div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/mov,video/avi"
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-8 space-y-6">
          {/* Icon with Animation */}
          <div className={`relative ${uploading ? '' : ''} transition-opacity duration-300`}>
            {uploading ? (
              <div className="relative">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Upload className={`h-10 w-10 ${disabled ? 'text-gray-400' : 'text-indigo-600'}`} />
                </div>
                {/* Floating icons around main icon */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center group-hover:animate-bounce">
                  <span className="text-sm">📸</span>
                </div>
                <div className="absolute -bottom-1 -left-2 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center group-hover:animate-bounce" style={{animationDelay: '0.2s'}}>
                  <span className="text-sm">🎥</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Text Content */}
          <div className="text-center max-w-md">
            <h3 className={`text-2xl font-bold mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'} ${uploading ? 'animate-pulse' : ''}`}>
              {uploading ? 'Processing Your Memories...' : 'Share Your Amazing Moments'}
            </h3>
            <p className={`text-lg ${disabled ? 'text-gray-400' : 'text-gray-600'} mb-6 leading-relaxed`}>
              {uploading 
                ? 'Your amazing photos and videos are being uploaded and processed with care' 
                : 'Drag & drop your photos and videos here, or click anywhere to browse your files'
              }
            </p>
            
            {/* Enhanced File Types Display */}
            {!uploading && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                  <span className="text-2xl">📸</span>
                  <span className="text-sm font-medium text-gray-700">Photos</span>
                </div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                  <span className="text-2xl">🎥</span>
                  <span className="text-sm font-medium text-gray-700">Videos</span>
                </div>
              </div>
            )}
            
            {/* Helpful hints */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>✨ Support for JPG, PNG, GIF, MP4, MOV files</p>
              <p>📱 Upload directly from your phone or computer</p>
              <p>🔒 Your photos are securely stored and processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Upload className="w-4 h-4 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Upload Progress</h4>
          </div>
          
          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([key, progress]) => {
              const filename = key.split('-')[0];
              const result = uploadResults[key];
              
              return (
                <div key={key} className="flex items-center space-x-3 bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex-shrink-0">
                    {result === 'success' ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ) : result === 'error' ? (
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                      <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
                    </div>
                    
                    {!result && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    {result && (
                      <p className={`text-sm font-medium ${result === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {result === 'success' ? '✅ Upload successful!' : '❌ Upload failed - Try again or check file size'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Configuration Notice */}
      {(() => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const isConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && supabaseUrl.includes('supabase.co');
        
        if (!isConfigured) {
          return (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-amber-900 mb-2">Demo Mode Active</h4>
                  <p className="text-amber-800 leading-relaxed">
                    Uploads are currently simulated for demonstration purposes. To enable real photo storage, 
                    configure your Supabase credentials and run the storage setup SQL scripts.
                  </p>
                  <div className="mt-3 text-sm text-amber-700">
                    <p>📝 Configure environment variables</p>
                    <p>🗄️ Set up Supabase storage bucket</p>
                    <p>🔐 Apply database policies</p>
                  </div>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-green-900 mb-2">Storage Ready</h4>
                  <p className="text-green-800 leading-relaxed">
                    Your Supabase storage is properly configured and ready to securely store uploaded photos and videos.
                  </p>
                  <div className="mt-3 text-sm text-green-700 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Storage Connected
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Security Enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      })()}
    </div>
  );
}