'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Ban, BarChart3, Lock, Users, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1">
      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/purple logo/purplelogo.png" alt="SnapWorxx" width={32} height={32} className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/manage"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Manage Admins
            </Link>
            <Link
              href="/admin/settings"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
            <Lock className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your promotional events and settings</p>
          <p className="text-sm text-gray-500 mt-2">Logged in as: <span className="font-semibold">{adminEmail}</span></p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {message}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">TOTAL EVENTS</p>
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">UNIQUE EMAILS</p>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmails}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">BLOCKED EMAILS</p>
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.blockedEmails}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">PROMO STATUS</p>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.statusEnabled ? '✅ Active' : '❌ Inactive'}</p>
            </div>
          </div>
        )}
        
        {/* Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Events</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div>
                      <Link href={`/e/${event.slug}`} target="_blank" className="text-lg font-semibold text-purple-600 hover:underline">
                        {event.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{event.email} • {event.photo_count || 0} photos • {new Date(event.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No promo events created yet</p>
            )}
          </div>
        </div>

        {/* Block Email Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Block Email from Promo</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-3 mb-6">
              <input
                type="email"
                value={blockEmail}
                onChange={(e) => setBlockEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleBlockEmail}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Block
              </button>
            </div>

            {/* Blocked Emails List */}
            {blockedEmails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Blocked Emails ({blockedEmails.length})</h3>
                <div className="space-y-2">
                  {blockedEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-gray-900 text-sm">{email}</span>
                      <button
                        onClick={() => handleUnblockEmail(email)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
