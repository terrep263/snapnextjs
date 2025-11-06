
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FreeBasicPromoPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const promoEnabled = process.env.NEXT_PUBLIC_PROMO_FREE_BASIC_ENABLED === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/create-promo-free-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, eventDate, email, ownerName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      router.push(`/events/${data.slug}`);
    } catch (err) {
      console.error(err);
      setError('Server error');
      setLoading(false);
    }
  };

  if (!promoEnabled) {
    return <div style={{ padding: 40 }}>This promotion is not currently active.</div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1>Free Basic Event – Limited Promo</h1>
      <p>Create one free Basic event (normally $29). Invitation-only offer.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Your Name
          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} required />
        </label>
        <label>Your Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Event Name
          <input value={eventName} onChange={e => setEventName(e.target.value)} required />
        </label>
        <label>Event Date
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Free Event'}
        </button>
      </form>
    </div>
  );
}
