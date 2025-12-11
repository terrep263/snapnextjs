'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Legacy event page - redirects to new gallery
 * The new gallery system is at /e/[slug]/gallery
 */
export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      // Redirect to new gallery
      router.replace(`/e/${slug}/gallery`);
    }
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to gallery...</p>
      </div>
    </div>
  );
}
