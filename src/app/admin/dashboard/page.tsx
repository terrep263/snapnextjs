'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Ban, BarChart3, Lock, Users, Calendar, Zap, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth, useAsync } from '@/hooks';
import { adminApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, TextInput } from '@/components/forms';

interface PromoStats {
  totalEvents: number;
  freeBasicEvents?: number;
  freebieEvents?: number;
  paidEvents?: number;
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
  const { authenticated, email: adminEmail, loading: authLoading, logout } = useAuth();
  const [blockEmail, setBlockEmail] = useState('');
  const [isBlockingEmail, setIsBlockingEmail] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState<string | null>(null);
  const [freebieEventName, setFreebieEventName] = useState('');
  const [freebieEventDate, setFreebieEventDate] = useState('');
  const [isCreatingFreebieEvent, setIsCreatingFreebieEvent] = useState(false);
  const [freebieCount, setFreebieCount] = useState(0);

  // Load stats
  const { data: stats, loading: statsLoading, execute: loadStats } = useAsync(
    async () => {
      const res = await adminApi.getStats();
      if (res.success) return res.data as PromoStats;
      throw new Error(res.error);
    },
    false
  );

  // Load events
  const { data: events, loading: eventsLoading, execute: loadEvents } = useAsync(
    async () => {
      const res = await adminApi.getEvents();
      if (res.success) return (res.data as any)?.events || [];
      throw new Error(res.error);
    },
    false
  );

  // Load blocked emails
  const { data: blockedEmails, loading: emailsLoading, execute: loadBlockedEmails } = useAsync(
    async () => {
      const res = await adminApi.getBlockedEmails();
      if (res.success) return (res.data as any)?.emails || [];
      throw new Error(res.error);
    },
    false
  );

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadStats().catch((err) => toast.error('Failed to load stats'));
      loadEvents().catch((err) => toast.error('Failed to load events'));
      loadBlockedEmails().catch((err) => toast.error('Failed to load blocked emails'));
    }
  }, [authenticated]);

  const handleBlockEmail = async () => {
    if (!blockEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    setIsBlockingEmail(true);
    try {
      const res = await adminApi.blockEmail(blockEmail);

      if (!res.success) {
        toast.error(res.error || 'Failed to block email');
        return;
      }

      toast.success(`Email blocked successfully: ${blockEmail}`);
      setBlockEmail('');
      loadBlockedEmails();
    } catch (err) {
      toast.error('Server error');
    } finally {
      setIsBlockingEmail(false);
    }
  };

  const handleCreateFreebieEvent = async () => {
    if (!freebieEventName.trim() || !freebieEventDate.trim()) {
      toast.error('Please enter event name and date');
      return;
    }

    setIsCreatingFreebieEvent(true);
    try {
      const res = await fetch('/api/create-freebie-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: freebieEventName,
          eventDate: freebieEventDate,
          email: 'freebie@snapworxx.com',
          ownerName: adminEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to create freebie event');
        return;
      }

      toast.success(`✅ Freebie event created! (${data.freebie_count}/${data.max_freebies})`);
      setFreebieEventName('');
      setFreebieEventDate('');
      setFreebieCount(data.freebie_count);
      loadEvents();
      loadStats();
    } catch (err) {
      toast.error('Server error');
    } finally {
      setIsCreatingFreebieEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Delete event: "${eventName}"? This cannot be undone.`)) {
      return;
    }

    setIsDeletingEvent(eventId);
    try {
      const res = await adminApi.deleteEvent(eventId);

      if (!res.success) {
        toast.error(res.error || 'Failed to delete event');
        return;
      }

      toast.success(`Event deleted: ${eventName}`);
      loadEvents();
      loadStats();
    } catch (err) {
      toast.error('Server error');
    } finally {
      setIsDeletingEvent(null);
    }
  };

  const handleUnblockEmail = async (email: string) => {
    try {
      const res = await adminApi.unblockEmail(email);

      if (!res.success) {
        toast.error(res.error || 'Failed to unblock email');
        return;
      }

      toast.success(`Email unblocked: ${email}`);
      loadBlockedEmails();
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  if (authLoading) {
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



        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">TOTAL EVENTS</p>
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-xs text-gray-600 mt-2">
                Free Basic: {stats.freeBasicEvents || 0} | Freebie: {stats.freebieEvents || 0} | Paid: {stats.paidEvents || 0}
              </p>
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
        
        {/* Freebie Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-500" />
            Create Freebie Event (Master Email)
          </h2>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-sm border-2 border-amber-200 p-6">
            <p className="text-gray-700 mb-4 font-medium">
              Create unlimited free promo events for freebie@snapworxx.com
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Limit: 100 freebie events total • Unlimited storage per event
            </p>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <TextInput
                  type="text"
                  value={freebieEventName}
                  onChange={(e) => setFreebieEventName(e.target.value)}
                  placeholder="Event name (e.g., Birthday Party)"
                  className="w-full"
                />
                <TextInput
                  type="date"
                  value={freebieEventDate}
                  onChange={(e) => setFreebieEventDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={handleCreateFreebieEvent}
                loading={isCreatingFreebieEvent}
                icon={<Gift className="w-4 h-4" />}
                className="w-full md:w-auto"
              >
                Create Freebie Event
              </Button>
            </div>
            
            {freebieCount > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{freebieCount}/100</span> freebie events created
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Events</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {events && (events as PromoEvent[]).length > 0 ? (
              <div className="space-y-4">
                {(events as PromoEvent[]).map((event: PromoEvent) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <Link
                        href={`/e/${event.slug}`}
                        target="_blank"
                        className="text-lg font-semibold text-purple-600 hover:underline"
                      >
                        {event.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.email} • {event.photo_count || 0} photos •{' '}
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      variant="danger"
                      size="sm"
                      loading={isDeletingEvent === event.id}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
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
              <TextInput
                type="email"
                value={blockEmail}
                onChange={(e) => setBlockEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1"
              />
              <Button
                onClick={handleBlockEmail}
                loading={isBlockingEmail}
                icon={<Ban className="w-4 h-4" />}
              >
                Block
              </Button>
            </div>

            {/* Blocked Emails List */}
            {blockedEmails && blockedEmails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Blocked Emails ({blockedEmails.length})
                </h3>
                <div className="space-y-2">
                  {(blockedEmails as string[]).map((email: string) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <span className="text-gray-900 text-sm">{email}</span>
                      <Button
                        onClick={() => handleUnblockEmail(email)}
                        variant="secondary"
                        size="sm"
                      >
                        Unblock
                      </Button>
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
