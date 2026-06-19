'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface SendMyPhotosProps {
  /** Event slug used to build the gallery return link. */
  eventSlug: string;
  /** Optional event id (kept for parity / future use). */
  eventId?: string;
  /**
   * Called after the guest either receives their link or skips.
   * When provided (e.g. the dedicated upload page), the caller can
   * advance to the gallery. When omitted (e.g. inside the upload
   * modal's confirmation step), the prompt simply collapses.
   */
  onDone?: () => void;
  className?: string;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SendMyPhotos({
  eventSlug,
  eventId,
  onDone,
  className = '',
}: SendMyPhotosProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim());

  const handleSend = async () => {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gallery/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), eventSlug, eventId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not send the link. Please try again.');
      }

      setStatus('sent');
      if (onDone) setTimeout(onDone, 1500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const handleSkip = () => {
    if (onDone) onDone();
    else setStatus('sent'); // collapse the prompt when embedded
  };

  if (status === 'sent') {
    return (
      <div
        className={`rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3 ${className}`}
      >
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="text-sm">
          <p className="font-semibold text-green-900">Your link is on the way</p>
          <p className="text-green-800">
            Check your inbox — tap the link anytime to come back to this gallery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border-2 border-purple-200 bg-purple-50 p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Mail className="h-5 w-5 text-purple-600" strokeWidth={1.75} />
        <h3 className="text-base md:text-lg font-bold text-gray-900">
          Where should we send your photos?
        </h3>
      </div>
      <p className="text-xs md:text-sm text-gray-600 mb-4">
        Get a link to this gallery so you can come back anytime — no rescanning.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="you@example.com"
          disabled={status === 'sending'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!valid || status === 'sending'}
          className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'sending' ? 'Sending…' : 'Send my photos'}
        </button>
      </div>

      {status === 'error' && errorMsg && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleSkip}
        disabled={status === 'sending'}
        className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 disabled:opacity-50"
      >
        No thanks
      </button>
    </div>
  );
}
