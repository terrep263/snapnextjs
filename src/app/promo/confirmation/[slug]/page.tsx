'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PromoConfirmationRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    if (!slug) return;
    router.replace(`/e/${slug}`);
  }, [slug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Your event is ready</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">
          Redirecting to your event gallery...
        </p>
      </div>
    </div>
  );
}
