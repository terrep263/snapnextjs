'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, ArrowLeft } from 'lucide-react';

export default function CreateEvent() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Create event in database and initiate Stripe checkout
    console.log('Creating event:', eventName);

    // Placeholder - will redirect to Stripe checkout
    // router.push('/success');
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
        <div className="container mx-auto max-w-md px-4">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="rounded-lg bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-3xl font-bold text-foreground">
              Create Your Event
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="eventName"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Event Name
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Sarah's Birthday Party"
                  className="w-full rounded-md border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="rounded-md bg-accent p-4">
                <p className="text-sm font-medium text-accent-foreground">
                  What you get:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>✓ Unlimited photo uploads</li>
                  <li>✓ Custom event URL and QR code</li>
                  <li>✓ Event active for 30 days</li>
                  <li>✓ Download all photos anytime</li>
                </ul>
              </div>

              <div className="border-t border-border pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">$9.99</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !eventName.trim()}
                  className="w-full rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Continue to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
