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
import { getPhotoPublicUrl } from '@/lib/supabase';
import { GALLERY_MAX_PHOTO_SIZE, GALLERY_MAX_VIDEO_SIZE } from '@/config/constants';

// ─── Mobile upload safety constants ────────────────────────────────────
const MAX_BATCH_SIZE = 20;
const MAX_VIDEO_BYTES = GALLERY_MAX_VIDEO_SIZE; // 1 GB per video
const MAX_PHOTO_BYTES = GALLERY_MAX_PHOTO_SIZE; // 700 MB per photo

// ─── Extension → MIME mapping (authoritative source) ──────────────────────
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  hevc: 'video/mp4',
  h265: 'video/mp4',
  m2ts: 'video/mp2t',
  mts: 'video/mp2t',
  ts: 'video/mp2t',
};

const VIDEO_EXTS = new Set([
  'mov', 'mp4', 'avi', 'mkv', 'webm', 'flv', 'wmv',
  '3gp', '3g2', 'hevc', 'h265', 'm2ts', 'mts', 'ts',
]);

function getExt(name: string): string {
  return (name.split('.').pop() || '').toLowerCase();
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  return VIDEO_EXTS.has(getExt(file.name));
}

// Always prefer the extension-based MIME — fixes iPhone Safari sending
// image/heic or blank MIME, and Android sending application/octet-stream.
function mimeFor(file: File): string {
  const ext = getExt(file.name);
  if (EXT_MIME[ext]) return EXT_MIME[ext];
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  return 'application/octet-stream';
}

// Strip iPhone Live Photo .mov sidecars (IMG_1234.mov paired with IMG_1234.heic)
function filterLivePhotoSidecars(files: File[]): File[] {
  const heicBases = new Set(
    files
      .filter((f) => /\.(heic|heif)$/i.test(f.name))
      .map((f) => f.name.replace(/\.(heic|heif)$/i, '').toLowerCase())
  );
  return files.filter((f) => {
    if (/\.mov$/i.test(f.name)) {
      const base = f.name.replace(/\.mov$/i, '').toLowerCase();
      if (heicBases.has(base)) {
        console.log(`🗑️ Skipping iPhone Live Photo sidecar: ${f.name}`);
        return false;
      }
    }
    return true;
  });
}

// Convert HEIC/HEIF → JPEG in the browser so Android/Windows guests can view
// iPhone photos. Dynamic import keeps the ~200 KB lib out of the initial bundle.
async function convertHeicIfNeeded(file: File): Promise<File> {
  const ext = getExt(file.name);
  const isHeic =
    ext === 'heic' ||
    ext === 'heif' ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';
  if (!isHeic) return file;

  try {
    console.log(`🔄 Converting HEIC → JPEG: ${file.name}`);
    // heic2any ships no TypeScript types; import as any.
    const mod: any = await import('heic2any');
    const convert = mod.default || mod;
    const result = await convert({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    const blob: Blob = Array.isArray(result) ? result[0] : result;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const converted = new File([blob], newName, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
    console.log(
      `✅ HEIC converted: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) → ${newName} (${(converted.size / 1024 / 1024).toFixed(2)} MB)`
    );
    return converted;
  } catch (err) {
    console.warn(`⚠️ HEIC conversion failed for ${file.name}, uploading original:`, err);
    return file;
  }
}

// Exponential-backoff retry for transient network failures (500ms, 1s, 2s).
async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = ''): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) {
        const delay = 500 * Math.pow(2, attempt);
        console.warn(`⏳ Retry ${attempt + 1}/${retries - 1} for ${label} after ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function uploadResumable(
  filePath: string,
  file: File,
  contentType: string,
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
): Promise<void> {
  const tus: any = await import('tus-js-client');
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'x-upsert': 'false',
      },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'photos',
        objectName: filePath,
        contentType,
        cacheControl: '3600',
      },
      onProgress,
      onSuccess: resolve,
      onError: reject,
    });
    upload.start();
  });
}

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
  const [batchError, setBatchError] = useState<string | null>(null);
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
    files: File[],
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

    // Free-event photo cap check
    if (eventData.is_free && eventData.max_photos) {
      const { data: existingPhotos } = await supabase
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

    for (const inputFile of files) {
      const key = `${inputFile.name}-${inputFile.size}`;

      try {
        console.log(`🚀 Starting upload for: ${inputFile.name} (${(inputFile.size / 1024 / 1024).toFixed(2)} MB)`);

        // Phase 3: HEIC/HEIF → JPEG conversion for cross-platform viewing
        const file = await convertHeicIfNeeded(inputFile);

        const fileExtension = getExt(file.name);
        const isVideo = isVideoFile(file);
        const isH265 =
          fileExtension === 'hevc' ||
          fileExtension === 'h265' ||
          file.name.toLowerCase().includes('hevc') ||
          file.name.toLowerCase().includes('h265');

        console.log(`🎬 Upload — Is video: ${isVideo}, Is H.265: ${isH265}, Ext: ${fileExtension}, MIME: '${file.type}', Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        if (file.size > 500 * 1024 * 1024) {
          console.warn(`⚠️ Large file detected (${(file.size / 1024 / 1024).toFixed(2)} MB).`);
        }

        let processedFile = file;
        let filePublicUrl = '';

        // H.265 video — upload then trigger server-side transcode for Android compatibility
        if (isH265) {
          try {
            console.log(`🔄 H.265 video detected — transcoding to H.264 MP4 for Android compatibility...`);
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-z0-9.-]/gi, '_');
            const tempPath = `${eventData.id}/${timestamp}-${safeName}`;

            await withRetry(
              async () => {
                const { error } = await supabase.storage
                  .from('photos')
                  .upload(tempPath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'video/mp4',
                  });
                if (error) throw error;
              },
              3,
              `h265-upload:${file.name}`
            );

            filePublicUrl = getPhotoPublicUrl(tempPath);

            console.log(`📤 Triggering H.265→H.264 transcode for: ${filePublicUrl}`);
            const transcodeResponse = await fetch('/api/transcode-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceUrl: filePublicUrl,
                eventId: eventData.id,
                formats: ['mp4'],
              }),
            });

            if (transcodeResponse.ok) {
              const transcodeData = await transcodeResponse.json();
              if (transcodeData.mp4) {
                filePublicUrl = transcodeData.mp4;
                console.log(`✅ H.265 transcoded successfully: ${filePublicUrl}`);
              }
            } else {
              console.warn(`⚠️ Transcode request failed, using original H.265`);
            }
          } catch (err) {
            console.warn(`⚠️ H.265 transcode error: ${err}`);
          }
        }

        // Optional video compression for non-H.265 videos > 100 MB
        if (!isH265 && isVideo && file.size > 100 * 1024 * 1024) {
          try {
            console.log(`🔄 Attempting video compression for large file...`);
            const compressionResult = await videoCompressor.compressVideo(file);
            if (compressionResult.success && compressionResult.file) {
              processedFile = compressionResult.file;
              console.log(`✅ Video compressed: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(processedFile.size / 1024 / 1024).toFixed(2)} MB`);
            } else {
              console.log(`⚠️ Compression not needed or failed — uploading original`);
            }
          } catch (err) {
            console.warn(`⚠️ Compression error (uploading original): ${err}`);
          }
        } else if (!isH265 && isVideo) {
          console.log(`📹 Video under 100 MB — uploading without compression`);
        }

        // Main upload path (skip if already uploaded via H.265 branch)
        let filePath = '';
        if (!filePublicUrl) {
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-z0-9.-]/gi, '_');
          filePath = `${eventData.id}/${timestamp}-${safeName}`;

          progress[key] = 10;
          setUploadProgress({ ...progress });

          // Phase 2: always derive MIME from extension
          const contentType = mimeFor(processedFile);
          console.log(`📤 Uploading with MIME type: ${contentType} (original was: '${file.type}')`);

          const RESUMABLE_THRESHOLD = 6 * 1024 * 1024;
          if (processedFile.size > RESUMABLE_THRESHOLD) {
            await uploadResumable(
              filePath,
              processedFile,
              contentType,
              (bytesUploaded, bytesTotal) => {
                progress[key] = Math.round((bytesUploaded / bytesTotal) * 70) + 10;
                setUploadProgress({ ...progress });
              }
            );
          } else {
            await withRetry(
              async () => {
                const { error } = await supabase.storage
                  .from('photos')
                  .upload(filePath, processedFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType,
                  });
                if (error) throw error;
              },
              3,
              `upload:${file.name}`
            );
          }

          console.log(`✅ File uploaded to storage: ${filePath}`);
          filePublicUrl = getPhotoPublicUrl(filePath);
        }

        progress[key] = 80;
        setUploadProgress({ ...progress });

        // Save photo metadata with normalized MIME via the server-side
        // registration route (service role). Moving the events/photos writes
        // off the anon key removes the app's dependency on anonymous INSERT
        // policies — the prerequisite for locking down table RLS. The storage
        // upload above is unchanged.
        const mimeType = mimeFor(processedFile);
        console.log(`💾 Registering photo (server-side) with MIME: ${mimeType}`);

        const registerRes = await fetch('/api/upload/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: eventData.id,
            eventName: eventData.name || 'Event Gallery',
            eventSlug: eventData.slug || eventData.id,
            filename: file.name,
            url: filePublicUrl,
            filePath,
            size: processedFile.size,
            type: mimeType,
            isVideo,
          }),
        });

        if (!registerRes.ok) {
          let msg = 'Failed to save photo';
          try {
            const j = await registerRes.json();
            msg = j?.error || msg;
          } catch {
            /* non-JSON error body */
          }
          console.error(`❌ Register error for ${file.name}:`, msg);
          throw new Error(msg);
        }

        console.log(`✅ Upload successful: ${file.name}`);
        progress[key] = 100;
        results[key] = 'success';
        setUploadProgress({ ...progress });
        setUploadResults({ ...results });
      } catch (err) {
        console.error(`❌ Upload error for ${inputFile.name}:`, err);
        console.error(`File size: ${(inputFile.size / 1024 / 1024).toFixed(2)} MB, MIME: '${inputFile.type}'`);

        if (inputFile.size > 500 * 1024 * 1024) {
          console.error('💡 Large file — consider reducing video quality on iPhone (Settings → Camera → Record Video)');
        }

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

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (!fileList.length) return;
      setBatchError(null);

      // Phase 2: filter iPhone Live Photo .mov sidecars
      const files = filterLivePhotoSidecars(Array.from(fileList));

      // Phase 2: hard-cap batch size
      if (files.length > MAX_BATCH_SIZE) {
        const msg = `Please select up to ${MAX_BATCH_SIZE} files at a time. You selected ${files.length}.`;
        console.warn(`⚠️ ${msg}`);
        setBatchError(msg);
        return;
      }

      // Phase 2: reject oversized videos up front
      const tooBig = files.find((f) => isVideoFile(f) && f.size > MAX_VIDEO_BYTES);
      if (tooBig) {
        const sizeMb = (tooBig.size / 1024 / 1024).toFixed(0);
        const msg = `Video "${tooBig.name}" is ${sizeMb} MB. Videos must be under 1 GB. On iPhone: Settings → Camera → Record Video → 1080p HD at 30 fps.`;
        console.warn(`⚠️ ${msg}`);
        setBatchError(msg);
        return;
      }

      // Phase 2: reject oversized photos up front
      const tooBigPhoto = files.find((f) => !isVideoFile(f) && f.size > MAX_PHOTO_BYTES);
      if (tooBigPhoto) {
        const sizeMb = (tooBigPhoto.size / 1024 / 1024).toFixed(0);
        const msg = `Photo "${tooBigPhoto.name}" is ${sizeMb} MB. Photos must be under 700 MB.`;
        console.warn(`⚠️ ${msg}`);
        setBatchError(msg);
        return;
      }

      if (!files.length) return;

      setUploading(true);
      const progress: Record<string, number> = {};
      const results: Record<string, 'success' | 'error'> = {};

      try {
        await uploadToSupabase(files, progress, results);

        const allSuccessful =
          Object.keys(results).length > 0 &&
          Object.values(results).every((r) => r === 'success');
        if (allSuccessful) {
          setTimeout(onUploadComplete, 1500);
        }
      } catch (err: any) {
        console.error('❌ Batch upload error:', err);
        setBatchError(err?.message || 'Batch upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [eventData, onUploadComplete]
  );

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
          accept="image/*,video/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.3gp,.3g2"
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
              Photos & Videos • iPhone HEIC supported • Up to {MAX_BATCH_SIZE} at a time • Photos ≤ 700 MB • Videos ≤ 1 GB
            </p>
          </div>
        </div>
      </div>

      {/* Batch error banner */}
      {batchError && (
        <div className="rounded-lg p-4 border bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm text-red-800">{batchError}</p>
          </div>
        </div>
      )}

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
