'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { EventData } from '@/lib/gallery-utils';
import { supabase } from '@/lib/supabase';
import { GALLERY_MAX_PHOTO_SIZE, GALLERY_MAX_VIDEO_SIZE } from '@/config/constants';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSlug?: string;
  eventId?: string;
  event?: EventData;
  onUploadComplete?: () => void;
}

type UploadStep = 'selection' | 'upload' | 'confirmation';

type UploadFile = {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  uploadedUrl?: string;
  uploadedId?: string;
};

const MAX_PHOTO_SIZE = GALLERY_MAX_PHOTO_SIZE;
const MAX_VIDEO_SIZE = GALLERY_MAX_VIDEO_SIZE;

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/mov', 'video/hevc'];

/**
 * UploadModal Component
 * 
 * Three-step upload flow:
 * 1. Selection - drag & drop, file browser, camera capture
 * 2. Upload Progress - per-file progress with cancel
 * 3. Confirmation - success message with thumbnails
 */
export default function UploadModal({
  isOpen,
  onClose,
  eventSlug,
  eventId,
  event,
  onUploadComplete,
}: UploadModalProps) {
  const [step, setStep] = useState<UploadStep>('selection');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllers = useRef<Map<string, AbortController>>(new Map());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection');
      setFiles([]);
      setError(null);
      uploadAbortControllers.current.forEach((controller) => controller.abort());
      uploadAbortControllers.current.clear();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'selection') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, step, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Validate file type and size
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type) || 
                   file.name.match(/\.(jpg|jpeg|png|heic|webp)$/i);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type) ||
                   file.name.match(/\.(mp4|mov|hevc)$/i);

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: `File type not supported. Accepted: JPEG, PNG, HEIC, WebP (images) or MP4, MOV, HEVC (videos).`,
      };
    }

    if (isImage && file.size > MAX_PHOTO_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is 25MB per photo.`,
      };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is 500MB per video.`,
      };
    }

    return { valid: true };
  };

  // Check event storage limits
  const checkStorageLimits = async (newFiles: File[]): Promise<{ allowed: boolean; error?: string }> => {
    if (!event || !eventId) return { allowed: true };

    try {
      // Get current storage usage
      const { data: photos } = await supabase
        .from('photos')
        .select('size')
        .eq('event_id', eventId);

      const currentStorage = photos?.reduce((sum, p) => sum + (p.size || 0), 0) || 0;
      const newStorage = newFiles.reduce((sum, f) => sum + f.size, 0);
      const totalStorage = currentStorage + newStorage;

      // Check max_storage_bytes
      if (event.max_storage_bytes && totalStorage > event.max_storage_bytes) {
        return {
          allowed: false,
          error: `This event has reached its storage limit. Cannot upload ${(newStorage / 1024 / 1024).toFixed(1)}MB.`,
        };
      }

      // Check max_photos
      if (event.max_photos) {
        const currentPhotoCount = photos?.length || 0;
        if (currentPhotoCount + newFiles.length > event.max_photos) {
          const remaining = event.max_photos - currentPhotoCount;
          return {
            allowed: false,
            error: `Photo limit reached. This event allows a maximum of ${event.max_photos} photos. Only ${remaining} slots remaining.`,
          };
        }
      }

      return { allowed: true };
    } catch (err) {
      console.error('Error checking storage limits:', err);
      return { allowed: true }; // Allow upload if check fails
    }
  };

  // Handle file selection
  const handleFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);
      setError(null);

      // Validate all files first
      const validationErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          validationErrors.push(`${file.name}: ${validation.error}`);
        } else {
          validFiles.push(file);
        }
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        if (validFiles.length === 0) return;
      }

      // Check storage limits
      const limitCheck = await checkStorageLimits(validFiles);
      if (!limitCheck.allowed) {
        setError(limitCheck.error || 'Storage limit exceeded');
        return;
      }

      // Add valid files to queue
      const newFiles: UploadFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'queued',
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [event, eventId]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Watch for upload completion and move to confirmation
  useEffect(() => {
    if (step !== 'upload' || files.length === 0) return;

    const allCompleted = files.every(
      (f) => f.status === 'completed' || f.status === 'failed' || f.status === 'cancelled'
    );
    const successCount = files.filter((f) => f.status === 'completed').length;
    const hasUploading = files.some((f) => f.status === 'uploading' || f.status === 'queued');

    if (allCompleted && successCount > 0 && !hasUploading) {
      const timer = setTimeout(() => setStep('confirmation'), 500);
      return () => clearTimeout(timer);
    }
  }, [step, files]);

  // Start uploads
  const startUploads = useCallback(async () => {
    if (files.length === 0) return;

    setStep('upload');
    setError(null);

    const queuedFiles = files.filter((f) => f.status === 'queued');
    if (queuedFiles.length === 0) return;

    // Upload files sequentially to avoid overwhelming the server
    for (const uploadFile of queuedFiles) {
      if (uploadFile.status === 'cancelled') continue;

      const abortController = new AbortController();
      uploadAbortControllers.current.set(uploadFile.id, abortController);

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f))
      );

      try {
        await uploadSingleFile(uploadFile, abortController.signal);
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'failed' as const, error: errorMessage }
                : f
            )
          );
        }
      } finally {
        uploadAbortControllers.current.delete(uploadFile.id);
      }
    }
  }, [files]);

  // Upload single file using the chunked upload API
  const uploadSingleFile = async (uploadFile: UploadFile, signal: AbortSignal): Promise<void> => {
    if (!eventId) throw new Error('Event ID is required');

    const file = uploadFile.file;

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId);
      formData.append('filename', file.name);

      // Track upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += 5;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          );
        }
      }, 300);

      // Upload via API endpoint
      const response = await fetch('/api/upload/chunked', {
        method: 'POST',
        body: formData,
        signal,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update file status with API response
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                uploadedUrl: result.data.url,
                uploadedId: result.data.id,
              }
            : f
        )
      );
    } catch (err) {
      if (signal.aborted) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'cancelled', progress: 0 } : f
          )
        );
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      throw new Error(errorMessage);
    }
  };

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    const controller = uploadAbortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      uploadAbortControllers.current.delete(fileId);
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && f.status === 'uploading' ? { ...f, status: 'cancelled' } : f
      )
    );
  }, []);

  // Handle confirmation actions
  const handleViewInGallery = useCallback(() => {
    onUploadComplete?.();
    onClose();
  }, [onUploadComplete, onClose]);

  const handleUploadMore = useCallback(() => {
    setStep('selection');
    setFiles([]);
    setError(null);
  }, []);

  if (!isOpen) return null;

  const completedFiles = files.filter((f) => f.status === 'completed');
  const hasUploading = files.some((f) => f.status === 'uploading');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={step === 'selection' ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 id="upload-modal-title" className="text-2xl font-bold text-gray-900">
            Upload Photos & Videos
          </h2>
          {step === 'selection' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'selection' && (
            <SelectionStep
              files={files}
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileSelect={() => fileInputRef.current?.click()}
              onRemoveFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
              onStartUpload={startUploads}
              error={error}
            />
          )}

          {step === 'upload' && (
            <UploadStep
              files={files}
              onCancel={cancelUpload}
              onRetry={async (id) => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === id ? { ...f, status: 'queued', progress: 0, error: undefined } : f
                  )
                );
                // Retry upload after state update
                await new Promise((resolve) => setTimeout(resolve, 100));
                startUploads();
              }}
            />
          )}

          {step === 'confirmation' && (
            <ConfirmationStep
              files={completedFiles}
              onViewInGallery={handleViewInGallery}
              onUploadMore={handleUploadMore}
            />
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/heic,image/webp,video/mp4,video/quicktime,video/mov,video/hevc"
          capture="environment"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
            e.target.value = ''; // Reset input
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}

/**
 * Step 1: Selection
 */
function SelectionStep({
  files,
  dragActive,
  onDrag,
  onDrop,
  onFileSelect,
  onRemoveFile,
  onStartUpload,
  error,
}: {
  files: UploadFile[];
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  onRemoveFile: (id: string) => void;
  onStartUpload: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-purple-600 bg-purple-50'
            : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-gray-100'
        }`}
      >
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Drag & drop files here
        </h3>
        <p className="text-gray-600 mb-4">
          or click to browse from your device
        </p>
        <button
          onClick={onFileSelect}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Browse Files
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Photos: JPEG, PNG, HEIC, WebP (max 25MB) • Videos: MP4, MOV, HEVC (max 500MB)
        </p>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.file.type.startsWith('image/') ? (
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onStartUpload}
            className="w-full mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Step 2: Upload Progress
 */
function UploadStep({
  files,
  onCancel,
  onRetry,
}: {
  files: UploadFile[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Uploading Files...
      </h3>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    file.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : file.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : file.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {file.status}
                </span>
              </div>
              {file.status === 'uploading' && (
                <button
                  onClick={() => onCancel(file.id)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Cancel
                </button>
              )}
              {file.status === 'failed' && (
                <button
                  onClick={() => onRetry(file.id)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Retry
                </button>
              )}
            </div>
            {file.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            )}
            {file.error && (
              <p className="text-xs text-red-600 mt-2">{file.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 3: Confirmation
 */
function ConfirmationStep({
  files,
  onViewInGallery,
  onUploadMore,
}: {
  files: UploadFile[];
  onViewInGallery: () => void;
  onUploadMore: () => void;
}) {
  const imageCount = files.filter((f) => f.file.type.startsWith('image/')).length;
  const videoCount = files.filter((f) => f.file.type.startsWith('video/')).length;

  return (
    <div className="space-y-6 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Complete!
        </h3>
        <p className="text-gray-600">
          {files.length} {files.length === 1 ? 'file' : 'files'} uploaded successfully
          {imageCount > 0 && videoCount > 0 && ` (${imageCount} ${imageCount === 1 ? 'photo' : 'photos'}, ${videoCount} ${videoCount === 1 ? 'video' : 'videos'})`}
        </p>
      </div>

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {files.slice(0, 12).map((file) => (
            <div key={file.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {file.file.type.startsWith('image/') ? (
                <img
                  src={file.uploadedUrl || URL.createObjectURL(file.file)}
                  alt={file.file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-4">
        <button
          onClick={onViewInGallery}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        >
          View in Gallery
        </button>
        <button
          onClick={onUploadMore}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          Upload More
        </button>
      </div>
    </div>
  );
}
