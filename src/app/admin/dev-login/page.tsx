'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Development-only page to set admin session cookies
 * This allows testing without knowing the admin password
 * Only available in development mode
 */
export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const setupDevSession = async () => {
      try {
        // Set cookies via API call (this bypasses client-side cookie restrictions)
        const response = await fetch('/api/dev/set-admin-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: 'terrep263@mail.com',
            role: 'super_admin',
          }),
        });

        if (response.ok) {
          console.log('✅ Dev session set successfully');
          console.log('✅ Redirecting to dashboard...');
          // Use a longer delay and then hard reload via window.location
          // This ensures cookies are flushed and recognized by the server
          setTimeout(() => {
            window.location.replace('/admin/dashboard');
          }, 1000);
        } else {
          console.error('Failed to set dev session:', response.statusText);
        }
      } catch (error) {
        console.error('Error setting dev session:', error);
      }
    };

    setupDevSession();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Development Login</h1>
        <p className="text-gray-600">Setting up admin session...</p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin h-6 w-6 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
