'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FREE_GALLERY_DAYS, FREE_MAX_PHOTOS } from '@/config/free-tier';

/**
 * Public self-serve free event landing page.
 *
 * Distinct job from the homepage: the homepage sells a $29 event, this page
 * gives one away to build a base of real events with real guests. Traffic is
 * tagged with ?src= (e.g. /free?src=fb-dancemoms) so acquisition can be
 * attributed per channel from /admin/acquisition.
 */

function FreeEventForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get('src') || 'direct';

  const [hostName, setHostName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    galleryUrl: string;
    dashboardUrl: string;
    activationUrl: string;
  } | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!hostName || !emailAddress || !eventName || !eventDate) {
      setError('Please fill in every field.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/free/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName,
          emailAddress,
          eventName,
          eventDate,
          source,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResult({
        galleryUrl: data.galleryUrl,
        dashboardUrl: data.dashboardUrl,
        activationUrl: data.activationUrl,
      });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your gallery is ready.</h2>
        <p className="text-gray-600 mb-6">
          We emailed your QR code to <strong>{emailAddress}</strong>. Activate guest uploads
          before you print it or share it.
        </p>

        <div className="space-y-3">
          <a
            href={result.activationUrl}
            className="block w-full text-center rounded-full bg-green-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
          >
            Activate guest uploads
          </a>
          <a
            href={result.dashboardUrl}
            className="block w-full text-center rounded-full bg-purple-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Open your dashboard
          </a>
          <a
            href={result.galleryUrl}
            className="block w-full text-center rounded-full border border-gray-300 px-6 py-4 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            View your gallery
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Didn&rsquo;t get the email? Check spam, or use the activation link above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Set up your free event</h2>
      <p className="text-gray-600 mb-6">Takes about a minute. No card, nothing to install.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm mb-5">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-1">
            Your name
          </label>
          <input
            id="hostName"
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Jamie Rivera"
          />
        </div>

        <div>
          <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="emailAddress"
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="you@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is where your QR code and gallery link go.
          </p>
        </div>

        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
            What&rsquo;s the event?
          </label>
          <input
            id="eventName"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Spring Recital, Championship Game, Sweet 16"
          />
        </div>

        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
            When is it?
          </label>
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-full bg-purple-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Setting it up...' : 'Create my free gallery'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          One free event per email. Free events include {FREE_MAX_PHOTOS} uploads and stay open for {FREE_GALLERY_DAYS} days after the event date.
        </p>
      </div>
    </div>
  );
}

export default function FreeEventPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-900 px-6 py-5">
        <div className="container mx-auto flex items-center justify-center">
          <img
            src="/purple logo/whitelogo.png"
            alt="SnapWorxx"
            className="h-14 md:h-16 w-auto"
          />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
          {/* Pitch */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
              Everybody got the shot.<br />Nobody got it to you.
            </h1>

            <p className="text-lg text-gray-700 mb-4">
              The first home run. The candle blown out. Two seconds, and it&rsquo;s over &mdash;
              and the person who caught it isn&rsquo;t you.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              SnapWorxx gathers everyone&rsquo;s photos into one gallery and gets them back to
              everybody who was there. Set up one event free and see it work.
            </p>

            <ul className="space-y-4">
              {[
                ['No app, no signup', 'Guests point their phone at a QR code. That\u2019s it.'],
              ['Every angle', `${FREE_MAX_PHOTOS} photos or videos from everyone in the room.`],
                ['Everyone gets them', 'Not just you \u2014 the whole gallery goes back out.'],
                ['Free means free', 'No card, no trial that bills you later.'],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-purple-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-semibold text-gray-900">{title}</span>
                    <span className="text-gray-600"> &mdash; {body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <Suspense
            fallback={
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-gray-500">
                Loading&hellip;
              </div>
            }
          >
            <FreeEventForm />
          </Suspense>
        </div>
      </main>

      <footer className="bg-purple-900 text-white py-8 mt-8">
        <div className="container mx-auto px-6 text-center">
          <div className="text-lg font-bold">SNAPWORXX</div>
          <div className="text-xs tracking-widest opacity-80">NEVER MISS THE MOMENTS</div>
        </div>
      </footer>
    </div>
  );
}
