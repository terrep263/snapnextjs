'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, CheckCircle, Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isMock = searchParams.get('mock') === 'true';

    if (sessionId) {
      if (isMock) {
        // Handle mock session for development
        const mockEvent = {
          id: 'mock_event_id',
          name: 'Mock Event for Development',
          slug: 'mock-event-dev',
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/mock_event_id`,
          eventUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/e/mock-event-dev`
        };
        
        setEventId(mockEvent.id);
        setEventData(mockEvent);
        localStorage.setItem('currentEvent', JSON.stringify(mockEvent));
        setLoading(false);
      } else {
        verifyPayment(sessionId);
      }
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Payment verification failed:', result);
        throw new Error(result.details || result.error || 'Payment verification failed');
      }

      const { event } = result;
      setEventId(event.id);
      setEventData(event);
      
      // Store event details in localStorage for easy access
      localStorage.setItem('currentEvent', JSON.stringify(event));
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      // For development, still show success but with mock data
      if (process.env.NODE_ENV === 'development') {
        const mockEvent = {
          id: 'fallback_event_id',
          name: 'Event (Verification Failed)',
          slug: 'fallback-event',
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/fallback_event_id`,
          eventUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/e/fallback-event`
        };
        setEventId(mockEvent.id);
        setEventData(mockEvent);
        localStorage.setItem('currentEvent', JSON.stringify(mockEvent));
      }
    } finally {
      setLoading(false);
    }
  };

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

export default function Success() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
