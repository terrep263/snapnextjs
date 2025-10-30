'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, ExternalLink, Download, QrCode, Copy, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { generateQRCode } from '@/lib/utils';

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
  created_at: string;
  expires_at: string;
}

export default function Dashboard() {
  const params = useParams();
  const eventId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  // Fetch event details and photos
  const fetchEventData = useCallback(async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, slug, is_active, created_at, expires_at')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Generate QR code
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const eventUrl = `${appUrl}/e/${eventData.slug}`;

      try {
        const qrCode = await generateQRCode(eventUrl);
        setQrCodeUrl(qrCode);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }

      // Fetch photos
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
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
    // Refresh photos every 30 seconds
    const interval = setInterval(fetchEventData, 30000);
    return () => clearInterval(interval);
  }, [fetchEventData]);

  const copyToClipboard = async () => {
    if (!event) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const eventUrl = `${appUrl}/e/${event.slug}`;
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${event?.slug || 'event'}-qr-code.png`;
    link.click();
  };

  const downloadAllPhotos = async () => {
    if (photos.length === 0) return;

    setDownloading(true);
    try {
      // In a real implementation, you'd want to create a zip file on the backend
      // For now, we'll download them individually
      for (const photo of photos) {
        const link = document.createElement('a');
        link.href = photo.file_path;
        link.download = photo.file_name;
        link.target = '_blank';
        link.click();
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">{error || 'Event not found'}</h1>
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const eventUrl = `${appUrl}/e/${event.slug}`;

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
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {event.name}
            </h1>
            <p className="text-muted-foreground">
              {event.is_active
                ? 'Manage your event and view all uploaded photos'
                : 'This event is no longer active'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <QrCode className="h-5 w-5" />
                Event QR Code
              </h2>
              <div className="mb-4 flex aspect-square items-center justify-center rounded-lg bg-muted">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt="Event QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg"
                  />
                ) : (
                  <QrCode className="h-24 w-24 animate-pulse text-muted-foreground" />
                )}
              </div>
              <button
                onClick={downloadQRCode}
                disabled={!qrCodeUrl}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="mr-2 inline-block h-4 w-4" />
                Download QR Code
              </button>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <ExternalLink className="h-5 w-5" />
                Event Link
              </h2>
              <div className="mb-4 rounded-md bg-muted p-3">
                <code className="break-all text-sm text-foreground">{eventUrl}</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 inline-block h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 inline-block h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <Link
                  href={`/e/${event.slug}`}
                  target="_blank"
                  className="flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Event Photos ({photos.length})
              </h2>
              {photos.length > 0 && (
                <button
                  onClick={downloadAllPhotos}
                  disabled={downloading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="mr-2 inline-block h-4 w-4" />
                  {downloading ? 'Downloading...' : 'Download All'}
                </button>
              )}
            </div>

            {photos.length === 0 ? (
              <div className="py-12 text-center">
                <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No photos yet. Share your event link to start collecting photos!
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
