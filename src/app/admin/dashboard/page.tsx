'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Ban, BarChart3, Lock, Users, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';

interface PromoStats {
  totalEvents: number;
  totalEmails: number;
  blockedEmails: number;
  statusEnabled: boolean;
}

interface PromoEvent {
  id: string;
  name: string;
  email: string;
  slug: string;
  created_at: string;
  photo_count: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [events, setEvents] = useState<PromoEvent[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [blockEmail, setBlockEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Verify admin session on mount
  useEffect(() => {
    verifyAuth();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadStats();
      loadEvents();
      loadBlockedEmails();
    }
  }, [authenticated]);

  const verifyAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      const data = await res.json();

      if (data.authenticated) {
        setAuthenticated(true);
        setAdminEmail(data.email);
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/promo-stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/admin/promo-events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const loadBlockedEmails = async () => {
    try {
      const res = await fetch('/api/admin/blocked-emails');
      const data = await res.json();
      setBlockedEmails(data.emails || []);
    } catch (err) {
      console.error('Failed to load blocked emails:', err);
    }
  };

  const handleBlockEmail = async () => {
    if (!blockEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/block-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: blockEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to block email');
        return;
      }

      setMessage(`Email blocked successfully: ${blockEmail}`);
      setBlockEmail('');
      loadBlockedEmails();
    } catch (err) {
      console.error('Error blocking email:', err);
      setError('Server error');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Delete event: "${eventName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete event');
        return;
      }

      setMessage(`Event deleted: ${eventName}`);
      loadEvents();
      loadStats();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Server error');
    }
  };

  const handleUnblockEmail = async (email: string) => {
    try {
      const res = await fetch('/api/admin/unblock-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to unblock email');
        return;
      }

      setMessage(`Email unblocked: ${email}`);
      loadBlockedEmails();
    } catch (err) {
      console.error('Error unblocking email:', err);
      setError('Server error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Top Bar */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-white font-bold text-lg">Promo Admin</h1>
              <p className="text-gray-300 text-sm">{adminEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
            {message}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Events</p>
                  <p className="text-white text-3xl font-bold">{stats.totalEvents}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Unique Emails</p>
                  <p className="text-white text-3xl font-bold">{stats.totalEmails}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Blocked Emails</p>
                  <p className="text-white text-3xl font-bold">{stats.blockedEmails}</p>
                </div>
                <Ban className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Promo Status</p>
                  <p className="text-white text-xl font-bold">{stats.statusEnabled ? '✅ Active' : '❌ Inactive'}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Block Email Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Block Email from Promo
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={blockEmail}
              onChange={(e) => setBlockEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-4 py-3 bg-white/20 border border-white/30 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleBlockEmail}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Block
            </button>
          </div>
        </div>

        {/* Blocked Emails */}
        {blockedEmails.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
            <h2 className="text-white text-xl font-bold mb-4">Blocked Emails ({blockedEmails.length})</h2>
            <div className="space-y-2">
              {blockedEmails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                  <span className="text-white">{email}</span>
                  <button
                    onClick={() => handleUnblockEmail(email)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Promo Events ({events.length})
          </h2>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left px-4 py-3 text-gray-300">Event Name</th>
                    <th className="text-left px-4 py-3 text-gray-300">Email</th>
                    <th className="text-left px-4 py-3 text-gray-300">Photos</th>
                    <th className="text-left px-4 py-3 text-gray-300">Created</th>
                    <th className="text-right px-4 py-3 text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 text-white">
                        <Link href={`/e/${event.slug}`} target="_blank" className="text-blue-400 hover:underline">
                          {event.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{event.email}</td>
                      <td className="px-4 py-3 text-gray-300">{event.photo_count || 0}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(event.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No promo events created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
