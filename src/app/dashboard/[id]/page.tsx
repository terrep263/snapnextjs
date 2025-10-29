'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, ExternalLink, Download, QrCode, Copy, Check } from 'lucide-react';
import Image from 'next/image';

export default function Dashboard() {
  const params = useParams();
  const eventId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventId}`;

  useEffect(() => {
    // TODO: Generate QR code
    console.log('Generate QR code for:', eventUrl);
  }, [eventUrl]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Event Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your event and view all uploaded photos
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
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                )}
              </div>
              <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
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
                  href={`/e/${eventId}`}
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
                Event Photos (0)
              </h2>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Download className="mr-2 inline-block h-4 w-4" />
                Download All
              </button>
            </div>

            <div className="py-12 text-center">
              <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No photos yet. Share your event link to start collecting photos!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
