'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestEmail() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testEmail = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'terrep263@gmail.com',
          eventName: 'Test Event - Email Functionality Check',
          dashboardUrl: 'https://snapnextjs.vercel.app/dashboard/test-event-123',
          eventUrl: 'https://snapnextjs.vercel.app/e/test-event-slug'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Email sent successfully! Message ID: ${data.messageId}`);
      } else {
        setError(`❌ Failed to send email: ${data.error}${data.details ? ` - ${data.details}` : ''}`);
      }
    } catch (err) {
      setError(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <img 
              src="/purple logo/purplelogo.png" 
              alt="Snapworxx Logo" 
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Test</h1>
          <p className="text-gray-600">Test email functionality by sending to terrep263@gmail.com</p>
        </div>

        {/* Test Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Configuration Test</h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Recipient:</strong> terrep263@gmail.com
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Subject:</strong> Your SnapWorxx Event: Test Event - Email Functionality Check
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Content:</strong> Full HTML email with event details, dashboard link, and branding
            </p>
          </div>

          <button
            onClick={testEmail}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Sending Email...
              </span>
            ) : (
              '📧 Send Test Email'
            )}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{result}</p>
              <p className="text-green-600 text-sm mt-2">
                Check your email inbox and spam folder for the test message.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                Please check your RESEND_API_KEY and email configuration.
              </p>
            </div>
          )}

          {/* Email Configuration Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Configuration</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Service:</strong> Resend API</p>
              <p><strong>From Address:</strong> SnapWorxx &lt;noreply@snapworxx.app&gt;</p>
              <p><strong>API Key:</strong> Configured in environment variables</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link 
              href="/" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}