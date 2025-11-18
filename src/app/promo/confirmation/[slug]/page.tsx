'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PromoConfirmationRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    // Fetch event by slug to get the event ID, then redirect to dashboard
    const fetchEventAndRedirect = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');

        const { data: event, error } = await supabase
          .from('events')
          .select('id, slug')
          .eq('slug', slug)
          .single();

        if (error || !event) {
          console.error('Error fetching event:', error);
          setError('Event not found');
          // Fallback to gallery page if event not found
          router.replace(`/e/${slug}`);
          return;
        }

        // Redirect to dashboard
        router.replace(`/dashboard/${event.id}`);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load event');
        // Fallback to gallery page on error
        router.replace(`/e/${slug}`);
      }
    };

    fetchEventAndRedirect();
  }, [slug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-2">
          {error || 'Your event is ready'}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          {error ? 'Redirecting to gallery...' : 'Redirecting to your dashboard...'}
        </p>
      </div>
    </div>
  );
}
