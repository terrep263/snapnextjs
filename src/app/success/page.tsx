'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, CheckCircle, Loader2 } from 'lucide-react';

export default function Success() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // TODO: Verify payment and get event details
      // For now, simulate loading
      setTimeout(() => {
        setEventId('sample-event-id');
        setLoading(false);
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <h1 className="mb-4 text-3xl font-bold text-foreground">
              Event Created Successfully!
            </h1>

            <p className="mb-8 text-muted-foreground">
              Your event is ready to go. Check your email for the event dashboard link
              and QR code.
            </p>

            {eventId && (
              <Link
                href={`/dashboard/${eventId}`}
                className="inline-block rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
