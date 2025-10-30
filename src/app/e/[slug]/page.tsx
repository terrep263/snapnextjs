'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';

interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Fetch event and photos
  const fetchEventAndPhotos = useCallback(async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, slug, is_active')
        .eq('slug', slug)
        .single();

      if (eventError || !eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch photos for this event
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('id, file_path, file_name, uploaded_at')
        .eq('event_id', eventData.id)
        .order('uploaded_at', { ascending: false });

      if (photosError) {
        console.error('Error fetching photos:', photosError);
      } else {
        setPhotos(photosData || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEventAndPhotos();
  }, [fetchEventAndPhotos]);

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    if (!event || !event.is_active) {
      setError('Event is not active');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress(`Uploading ${files.length} photo(s)...`);

    try {
      const formData = new FormData();
      formData.append('eventSlug', slug);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Show success message
      setSuccessMessage(
        `Successfully uploaded ${result.uploaded} photo(s)!${
          result.failed > 0 ? ` ${result.failed} failed.` : ''
        }`
      );

      // Refresh photos
      await fetchEventAndPhotos();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles);
    }
  }, [event]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.heif']
    },
    disabled: uploading || !event?.is_active,
    multiple: true,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">{error}</h1>
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SnapWorxx</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-muted py-12">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Event Header */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {event?.name || slug}
            </h1>
            <p className="text-muted-foreground">
              {event?.is_active
                ? 'Upload your photos to share with everyone at this event!'
                : 'This event is no longer active.'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Upload Section */}
          {event?.is_active && (
            <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : uploading
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-border bg-accent hover:border-primary hover:bg-accent/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`mb-4 h-12 w-12 ${
                    uploading ? 'animate-pulse text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span className="mb-2 text-lg font-semibold text-foreground">
                  {uploading
                    ? uploadProgress
                    : isDragActive
                    ? 'Drop photos here'
                    : 'Click to upload or drag and drop'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {uploading
                    ? 'Please wait...'
                    : 'PNG, JPG, GIF, WebP, HEIC up to 50MB each'}
                </span>
              </div>
            </div>
          )}

          {/* Photos Gallery */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Event Photos ({photos.length})
              </h2>
            </div>

            {photos.length === 0 ? (
              <div className="py-12 text-center">
                <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No photos yet. Be the first to upload!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={photo.file_path}
                      alt={photo.file_name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    <a
                      href={photo.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100"
                    >
                      <Download className="h-8 w-8 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
