'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, EyeOff, Trash2, ShieldCheck, ImageOff } from 'lucide-react';
import { supabase, transformToCustomDomain } from '@/lib/supabase';

interface ManagedPhoto {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  filename?: string | null;
  is_video?: boolean | null;
  is_approved?: boolean | null;
  is_flagged?: boolean | null;
  created_at?: string | null;
}

/**
 * Owner-only photo manager.
 *
 * Lives at /dashboard/[id]/photos so moderation is separated from the main
 * event dashboard. Supports the reversible Hide/Unhide (is_approved toggle via
 * the moderation API) and a permanent Delete (new DELETE endpoint), both
 * enforced server-side for the owner/admin.
 */
export default function PhotoManager() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<ManagedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Email-confirm fallback: when the browser carries no owner identity (e.g.
  // a previously-sent email link opened on another device), the owner can
  // re-establish identity by entering the email used to create the event.
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadEverything = async () => {
    setLoading(true);
    try {
      // Load the event (by id, with slug fallback for the sample event).
      let { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!eventData && eventId === 'sample-event-id') {
        const bySlug = await supabase
          .from('events')
          .select('*')
          .eq('slug', 'sample-event-slug')
          .single();
        eventData = bySlug.data;
      }

      setEvent(eventData);

      // Owner identity is the userEmail kept in the browser, matched against the
      // event's owner_email OR email (freebie events only set `email`). We mirror
      // it to a cookie so server-side owner checks on the moderation/delete APIs
      // succeed.
      const userEmail =
        typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

      const ownerEmails = [eventData?.owner_email, eventData?.email]
        .filter(Boolean)
        .map((e: string) => e.toLowerCase());
      const isOwner =
        !!userEmail && ownerEmails.includes(userEmail.toLowerCase());

      // Owner recognised locally -> mint a signed host session so the
      // moderation/delete APIs (which now require it) authorize this browser.
      if (isOwner && userEmail) {
        try {
          await fetch('/api/host/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: eventData?.id || eventId, email: userEmail }),
          });
        } catch {
          /* non-fatal */
        }
      }

      // Admins get support access to ANY event, verified server-side via the
      // signed admin session (not a client-set flag). Only checked when the
      // viewer isn't the owner, so owners/guests incur no extra request.
      let isAdmin = false;
      if (!isOwner) {
        try {
          const res = await fetch('/api/admin/whoami');
          if (res.ok) {
            const j = await res.json();
            isAdmin = j?.isAdmin === true;
          }
        } catch {
          isAdmin = false;
        }
      }

      setAuthorized(isOwner || isAdmin);

      if (isOwner || isAdmin) {
        await fetchPhotos(eventData?.id || eventId);
      }
    } catch (err) {
      console.error('Failed to load photo manager:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load (or reload) this event's photos into state.
  const fetchPhotos = async (eid: string) => {
    const { data: photoRows } = await supabase
      .from('photos')
      .select(
        'id, url, storage_url, thumbnail_url, filename, is_video, is_approved, is_flagged, created_at'
      )
      .eq('event_id', eid)
      .order('created_at', { ascending: false });

    const mapped: ManagedPhoto[] = (photoRows || []).map((p: any) => ({
      id: p.id,
      url: transformToCustomDomain(p.url || p.storage_url) || p.url || p.storage_url || '',
      thumbnail_url:
        transformToCustomDomain(p.thumbnail_url || p.url || p.storage_url) ||
        p.thumbnail_url ||
        p.url,
      filename: p.filename,
      is_video: p.is_video,
      is_approved: p.is_approved,
      is_flagged: p.is_flagged,
      created_at: p.created_at,
    }));
    setPhotos(mapped);
  };

  // Owner email-confirm fallback. Matches the entered email against the
  // event's owner_email or email; on success, establishes identity
  // (localStorage + cookie, same as the rest of the app) and unlocks the manager.
  const handleConfirmOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);

    const entered = confirmEmail.trim().toLowerCase();
    const ownerEmails = [event?.owner_email, event?.email]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase());

    if (!entered) {
      setConfirmError('Please enter your email.');
      return;
    }
    if (!ownerEmails.includes(entered)) {
      setConfirmError("That email doesn't match this event's owner.");
      return;
    }

    setConfirming(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userEmail', confirmEmail.trim());
      }
      // Mint the signed, server-verified host session (the identity the
      // moderation/delete APIs now require).
      try {
        await fetch('/api/host/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: event?.id || eventId, email: confirmEmail.trim() }),
        });
      } catch {
        /* non-fatal */
      }
      setAuthorized(true);
      await fetchPhotos(event?.id || eventId);
    } catch (err) {
      setConfirmError('Something went wrong. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const toggleHide = async (photo: ManagedPhoto) => {
    const action = photo.is_approved === false ? 'unhide' : 'hide';
    setBusyId(photo.id);
    try {
      const res = await fetch(`/api/moderation/photo/${photo.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action} photo`);
      }
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id ? { ...p, is_approved: action === 'unhide' } : p
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} photo`);
    } finally {
      setBusyId(null);
    }
  };

  const deletePhoto = async (photo: ManagedPhoto) => {
    setBusyId(photo.id);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete photo');
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setConfirmDeleteId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading photo manager…</p>
        </div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Confirm it&apos;s you</h1>
              <p className="text-gray-600">
                To manage photos, enter the email you used to create
                {event?.name ? ` "${event.name}"` : ' this event'}.
              </p>
            </div>

            <form onSubmit={handleConfirmOwner} className="space-y-4">
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => {
                  setConfirmEmail(e.target.value);
                  setConfirmError(null);
                }}
                placeholder="you@example.com"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              {confirmError && (
                <p className="text-sm text-red-600">{confirmError}</p>
              )}

              <button
                type="submit"
                disabled={confirming}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <Link
              href={`/dashboard/${eventId}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const visibleCount = photos.filter((p) => p.is_approved !== false).length;
  const hiddenCount = photos.length - visibleCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <Link
            href={`/dashboard/${eventId}`}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Photos{event?.name ? ` — ${event.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Hide a photo to remove it from the public gallery (reversible), or
            delete it permanently. {visibleCount} visible · {hiddenCount} hidden
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {photos.length === 0 ? (
          <div className="rounded-lg border border-gray-100 bg-white p-12 text-center shadow-sm">
            <ImageOff className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">No photos yet</p>
            <p className="text-sm text-gray-500">
              Photos guests upload will appear here for you to manage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const hidden = photo.is_approved === false;
              const isBusy = busyId === photo.id;
              return (
                <div
                  key={photo.id}
                  className={`relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all ${
                    hidden ? 'border-amber-300' : 'border-gray-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-gray-100">
                    {photo.is_video ? (
                      <video
                        src={photo.url}
                        className={`h-full w-full object-cover ${hidden ? 'opacity-50' : ''}`}
                        muted
                        playsInline
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.thumbnail_url || photo.url}
                        alt={photo.filename || 'Event photo'}
                        className={`h-full w-full object-cover ${hidden ? 'opacity-50' : ''}`}
                      />
                    )}
                    {hidden && (
                      <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                        Hidden
                      </span>
                    )}
                    {isBusy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between gap-1 p-2">
                    <button
                      onClick={() => toggleHide(photo)}
                      disabled={isBusy}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      title={hidden ? 'Show in public gallery' : 'Hide from public gallery'}
                    >
                      {hidden ? (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Unhide
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(photo.id)}
                      disabled={isBusy}
                      className="flex items-center justify-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete this photo?</h3>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              This permanently removes the photo and cannot be undone. If you
              only want to take it out of the public gallery, use{' '}
              <strong>Hide</strong> instead.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const photo = photos.find((p) => p.id === confirmDeleteId);
                  if (photo) deletePhoto(photo);
                }}
                disabled={busyId === confirmDeleteId}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === confirmDeleteId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  'Delete permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
