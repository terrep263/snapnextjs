'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Ban, BarChart3, Lock, Users, Calendar, Zap, Gift, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth, useAsync } from '@/hooks';
import { adminApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button, TextInput } from '@/components/forms';
import { downloadMagicLinkPDF } from '@/lib/generateMagicLinkPDF';

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
  owner_email?: string;
  slug: string;
  created_at: string;
  photo_count: number;
  is_free?: boolean;
  is_freebie?: boolean;
  payment_type?: string;
  stripe_session_id?: string;
  promo_type?: string;
}

// Helper function to determine payment category
function getPaymentCategory(event: PromoEvent): 'Paid' | 'Freebie' | 'Free Promo' {
  if (event.is_freebie || event.payment_type === 'freebie') return 'Freebie';
  if (event.is_free && !event.is_freebie) return 'Free Promo';
  if (event.stripe_session_id || event.payment_type === 'stripe') return 'Paid';
  return 'Paid'; // Safe default for existing events
}

// Helper to get event type
function getEventType(event: PromoEvent): string {
  if (event.promo_type === 'FREE_BASIC') return 'Free Basic';
  if (event.is_freebie) return 'Freebie';
  if (event.is_free) return 'Free Promo';
  return 'Paid Event';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { authenticated, email: adminEmail, loading: authLoading, logout } = useAuth();
  const [blockEmail, setBlockEmail] = useState('');
  const [isBlockingEmail, setIsBlockingEmail] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [claimLinks, setClaimLinks] = useState<any[]>([]);
  const [claimLinksLoading, setClaimLinksLoading] = useState(false);
  const [eventPageIndex, setEventPageIndex] = useState(0);
  const EVENTS_PER_PAGE = 20;

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
      console.log('Events response:', res);
      if (res.success) {
        const eventsList = (res.data as any)?.events || [];
        console.log(`Loaded ${eventsList.length} events`);
        return eventsList;
      }
      console.error('Failed to load events:', res.error);
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

  // Load claim links
  const loadClaimLinks = async () => {
    setClaimLinksLoading(true);
    try {
      const res = await fetch('/api/admin/claim-links');
      const result = await res.json();
      if (result.success) {
        setClaimLinks(result.data.links || []);
      } else {
        toast.error('Failed to load claim links');
      }
    } catch (err) {
      console.error('Error loading claim links:', err);
      toast.error('Failed to load claim links');
    } finally {
      setClaimLinksLoading(false);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadStats().catch((err) => toast.error('Failed to load stats'));
      loadEvents().catch((err) => toast.error('Failed to load events'));
      loadBlockedEmails().catch((err) => toast.error('Failed to load blocked emails'));
      loadClaimLinks();
    }
  }, [authenticated]);

  // Debug: log events when they change
  useEffect(() => {
    if (events) {
      console.log('Events state updated:', events);
      console.log('Events count:', (events as PromoEvent[]).length);
    }
  }, [events]);

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

  const handleGenerateMagicLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await fetch('/api/admin/generate-claim-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No expiration
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to generate magic link');
        return;
      }

      // Show success and set generated link
      setGeneratedLink(data.data.claimUrl);
      toast.success('🎉 Magic link generated! Copy and share it with your lead.');

      // Reload claim links
      loadClaimLinks();
    } catch (err) {
      console.error('Error generating magic link:', err);
      toast.error('Server error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
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
        
        {/* Magic Link Generation Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-500" />
            Generate Free Event Magic Links
          </h2>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border-2 border-purple-200 p-6">
            <p className="text-gray-700 mb-4 font-medium">
              Generate unique claim links for lead generation campaigns
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Each link can be claimed once • Unlimited claims per link
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleGenerateMagicLink}
                loading={isGeneratingLink}
                icon={<Gift className="w-4 h-4" />}
                className="w-full md:w-auto"
              >
                Generate New Magic Link
              </Button>

              {generatedLink && (
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                  <p className="text-sm font-semibold text-gray-700 mb-2">✨ New Link Generated!</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
                    />
                    <Button
                      onClick={() => handleCopyLink(generatedLink)}
                      size="sm"
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => downloadMagicLinkPDF(generatedLink)}
                      size="sm"
                      variant="secondary"
                      icon={<Download className="w-4 h-4" />}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              )}

              {/* Claim Links List */}
              {claimLinks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Recent Claim Links ({claimLinks.filter(l => !l.claimed).length} unclaimed / {claimLinks.length} total)
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {claimLinks.slice(0, 10).map((link: any) => (
                      <div
                        key={link.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          link.claimed
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-600 truncate">
                            {link.claimUrl}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {link.claimed ? (
                              <>
                                ✅ Claimed {new Date(link.claimedAt).toLocaleDateString()}
                                {link.eventId && ` • Event: ${link.eventId}`}
                              </>
                            ) : (
                              <>🔗 Active</>
                            )}
                          </p>
                        </div>
                        {!link.claimed && (
                          <Button
                            onClick={() => handleCopyLink(link.claimUrl)}
                            variant="secondary"
                            size="sm"
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Log</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {events && (events as PromoEvent[]).length > 0 ? (
              <div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Event Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Event Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment Category</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Photos</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(events as PromoEvent[])
                        .slice(eventPageIndex * EVENTS_PER_PAGE, (eventPageIndex + 1) * EVENTS_PER_PAGE)
                        .map((event: PromoEvent) => (
                          <tr
                            key={event.id}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/e/${event.slug}`}
                                target="_blank"
                                className="text-purple-600 hover:underline font-medium truncate max-w-xs block"
                                title={event.name}
                              >
                                {event.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {getEventType(event)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  getPaymentCategory(event) === 'Paid'
                                    ? 'bg-green-50 text-green-700'
                                    : getPaymentCategory(event) === 'Freebie'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {getPaymentCategory(event)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <span className="truncate max-w-xs block" title={event.email}>
                                {event.email}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {new Date(event.created_at).toLocaleDateString()} {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 text-center">
                              {event.photo_count || 0}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <Link
                                  href={`/dashboard/${event.id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                                  title="Manage event as user"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Manage
                                </Link>
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
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Showing {Math.min(eventPageIndex * EVENTS_PER_PAGE + 1, (events as PromoEvent[]).length)} to{' '}
                    {Math.min((eventPageIndex + 1) * EVENTS_PER_PAGE, (events as PromoEvent[]).length)} of{' '}
                    {(events as PromoEvent[]).length} events
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setEventPageIndex(Math.max(0, eventPageIndex - 1))}
                      disabled={eventPageIndex === 0}
                      size="sm"
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Page {eventPageIndex + 1} of{' '}
                        {Math.ceil((events as PromoEvent[]).length / EVENTS_PER_PAGE)}
                      </span>
                    </div>
                    <Button
                      onClick={() => setEventPageIndex(eventPageIndex + 1)}
                      disabled={
                        (eventPageIndex + 1) * EVENTS_PER_PAGE >=
                        (events as PromoEvent[]).length
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No events created yet</p>
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
