'use client';

import { useEffect, useState } from 'react';

/**
 * Admin view for self-serve free-event acquisition.
 *
 * Deliberately a standalone page rather than a change to /admin/dashboard, so
 * the existing admin surface is untouched.
 */

interface SourceRow {
  source: string;
  claims: number;
  eventsCreated: number;
  eventsWithPhotos: number;
  photos: number;
  converted: number;
}

interface RecentRow {
  email: string | null;
  source: string;
  eventDate: string | null;
  createdAt: string;
  photos: number;
  converted: boolean;
}

export default function AcquisitionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<SourceRow | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/free-claims-stats');
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load stats');
          return;
        }
        setTotals(data.totals);
        setSources(data.sources || []);
        setRecent(data.recent || []);
      } catch {
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Free Event Acquisition</h1>
          <p className="text-gray-600 mt-1">
            Self-serve claims from <code className="text-purple-700">/free</code>, grouped by{' '}
            <code className="text-purple-700">?src=</code>. Admin magic links are excluded.
          </p>
        </div>

        {loading && <div className="text-gray-500">Loading…</div>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {[
                ['Claims', totals?.claims ?? 0],
                ['Events created', totals?.eventsCreated ?? 0],
                ['Got photos', totals?.eventsWithPhotos ?? 0],
                ['Photos', totals?.photos ?? 0],
                ['Converted', totals?.converted ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-3xl font-bold text-gray-900">{String(value)}</div>
                  <div className="text-sm text-gray-500 mt-1">{String(label)}</div>
                </div>
              ))}
            </div>

            {/* By source */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">By channel</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-10">
              {sources.length === 0 ? (
                <div className="p-6 text-gray-500">
                  No self-serve claims yet. Share{' '}
                  <code className="text-purple-700">/free?src=your-channel</code> to start
                  attributing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium">Source</th>
                        <th className="text-right px-5 py-3 font-medium">Claims</th>
                        <th className="text-right px-5 py-3 font-medium">Events</th>
                        <th className="text-right px-5 py-3 font-medium">Got photos</th>
                        <th className="text-right px-5 py-3 font-medium">Photos</th>
                        <th className="text-right px-5 py-3 font-medium">Converted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((s) => (
                        <tr key={s.source} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-medium text-gray-900">{s.source}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{s.claims}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{s.eventsCreated}</td>
                          <td className="px-5 py-3 text-right text-gray-700">
                            {s.eventsWithPhotos}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-700">{s.photos}</td>
                          <td className="px-5 py-3 text-right font-semibold text-purple-700">
                            {s.converted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">Recent claims</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {recent.length === 0 ? (
                <div className="p-6 text-gray-500">Nothing yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium">Email</th>
                        <th className="text-left px-5 py-3 font-medium">Source</th>
                        <th className="text-left px-5 py-3 font-medium">Claimed</th>
                        <th className="text-left px-5 py-3 font-medium">Event date</th>
                        <th className="text-right px-5 py-3 font-medium">Photos</th>
                        <th className="text-right px-5 py-3 font-medium">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r, i) => (
                        <tr key={`${r.email}-${i}`} className="border-t border-gray-100">
                          <td className="px-5 py-3 text-gray-900">{r.email || '—'}</td>
                          <td className="px-5 py-3 text-gray-700">{r.source}</td>
                          <td className="px-5 py-3 text-gray-700">{fmtDate(r.createdAt)}</td>
                          <td className="px-5 py-3 text-gray-700">{fmtDate(r.eventDate)}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{r.photos}</td>
                          <td className="px-5 py-3 text-right">
                            {r.converted ? (
                              <span className="text-purple-700 font-semibold">Yes</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-8">
              &ldquo;Got photos&rdquo; is the number that matters early — a claim that never
              received an upload did not produce a real event.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
