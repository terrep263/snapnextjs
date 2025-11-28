'use client';

import { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import { checkVideoCompatibility, estimateTranscodingNeed, getBrowserVideoSupport } from '@/lib/videoCompatibility';

interface VideoUploadWithTranscodingProps {
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

export default function VideoUploadWithTranscoding({
  onUpload,
  maxSizeMB = 500,
  acceptedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/3gpp'],
  className = '',
}: VideoUploadWithTranscodingProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [compatibilityInfo, setCompatibilityInfo] = useState<any>(null);
  const [transcodingProgress, setTranscodingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    setIsChecking(true);

    try {
      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`File too large (${sizeMB.toFixed(0)}MB). Maximum size is ${maxSizeMB}MB.`);
        setIsChecking(false);
        return;
      }

      // Quick estimate
      const estimate = estimateTranscodingNeed(file);

      // Detailed compatibility check
      const compatibility = await checkVideoCompatibility(file);

      setCompatibilityInfo({
        ...compatibility,
        estimate,
        sizeMB: sizeMB.toFixed(1),
      });

      console.log('📹 Video compatibility:', { compatibility, estimate });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check video compatibility');
    } finally {
      setIsChecking(false);
    }
  }, [maxSizeMB]);

  const handleUploadOriginal = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      setCompatibilityInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleTranscodeAndUpload = async () => {
    if (!selectedFile) return;

    setIsTranscoding(true);
    setTranscodingProgress(0);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('video', selectedFile);

      // Simulate progress (actual progress tracking would require server-sent events)
      const progressInterval = setInterval(() => {
        setTranscodingProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      // Call transcoding API
      const response = await fetch('/api/transcode-video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcoding failed');
      }

      // Get transcoded video
      const blob = await response.blob();
      const transcodedFile = new File(
        [blob],
        selectedFile.name.replace(/\.[^.]+$/, '.mp4'),
        { type: 'video/mp4' }
      );

      setTranscodingProgress(100);

      // Upload transcoded video
      await onUpload(transcodedFile);

      // Reset
      setSelectedFile(null);
      setCompatibilityInfo(null);
      setTranscodingProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcoding failed');
    } finally {
      setIsTranscoding(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* File Input */}
      <div className="relative">
        <input
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="video-upload-input"
          disabled={isChecking || isTranscoding}
        />
        <label
          htmlFor="video-upload-input"
          className={`
            flex flex-col items-center justify-center
            w-full p-6 sm:p-8
            border-2 border-dashed rounded-lg
            cursor-pointer transition-all
            ${isChecking || isTranscoding ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 hover:bg-purple-50'}
            ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300'}
          `}
        >
          <Upload className="w-8 h-8 sm:w-12 sm:h-12 mb-3 text-gray-400" />
          <p className="text-sm sm:text-base font-medium text-gray-700 text-center">
            {selectedFile ? selectedFile.name : 'Click to select video'}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">
            Max {maxSizeMB}MB • MP4, WebM, MOV, 3GP
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
            <Smartphone className="w-3 h-3" />
            <span>Android videos supported</span>
          </div>
        </label>
      </div>

      {/* Checking Status */}
      {isChecking && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800">Checking video compatibility...</p>
          </div>
        </div>
      )}

      {/* Compatibility Info */}
      {compatibilityInfo && !isChecking && (
        <div className="mt-4 space-y-3">
          {/* Status */}
          {compatibilityInfo.isCompatible ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    Video is web-compatible ✓
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {compatibilityInfo.codec && `Codec: ${compatibilityInfo.codec} • `}
                    Size: {compatibilityInfo.sizeMB}MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-800">
                    Video may not play in all browsers
                  </p>
                  {compatibilityInfo.estimate.reasons.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-yellow-700">
                      {compatibilityInfo.estimate.reasons.map((reason: string, i: number) => (
                        <li key={i} className="truncate">• {reason}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-yellow-700 mt-2">
                    We recommend transcoding to ensure compatibility
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleUploadOriginal}
              disabled={isTranscoding}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Upload Original
            </button>

            {compatibilityInfo.needsTranscoding && (
              <button
                onClick={handleTranscodeAndUpload}
                disabled={isTranscoding}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isTranscoding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcoding... {transcodingProgress}%
                  </>
                ) : (
                  <>Transcode to MP4</>
                )}
              </button>
            )}
          </div>

          {/* Transcoding Progress */}
          {isTranscoding && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${transcodingProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Browser Support Info (Mobile-responsive) */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
          Browser video support info
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-1 overflow-x-auto">
          {Object.entries(getBrowserVideoSupport()).map(([codec, support]) => (
            <div key={codec} className="flex justify-between gap-2 whitespace-nowrap">
              <span className="font-medium">{codec.toUpperCase()}:</span>
              <span className={
                typeof support === 'string' && support === 'probably'
                  ? 'text-green-600'
                  : typeof support === 'string' && support === 'maybe'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }>
                {typeof support === 'string' ? support : JSON.stringify(support)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
