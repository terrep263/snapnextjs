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

      // Determine owner authorization. Identity today is the userEmail kept in
      // the browser; we also write it to a cookie so the server-side checks on
      // the moderation/delete APIs succeed. (A stronger magic-link host session
      // is a planned follow-up.)
      const userEmail =
        typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const adminSession =
        typeof window !== 'undefined' ? localStorage.getItem('adminSession') : null;

      let isAdmin = false;
      if (adminSession) {
        try {
          isAdmin = JSON.parse(adminSession).isAuthenticated === true;
        } catch {
          isAdmin = false;
        }
      }

      const isOwner =
        !!userEmail &&
        !!eventData?.owner_email &&
        userEmail.toLowerCase() === eventData.owner_email.toLowerCase();

      // Mirror userEmail into a cookie for the API permission checks.
      if (userEmail && typeof document !== 'undefined') {
        document.cookie = `userEmail=${encodeURIComponent(
          userEmail
        )}; path=/; max-age=86400; SameSite=Lax`;
      }

      setAuthorized(isOwner || isAdmin);

      if (isOwner || isAdmin) {
        const { data: photoRows } = await supabase
          .from('photos')
          .select(
            'id, url, storage_url, thumbnail_url, filename, is_video, is_approved, is_flagged, created_at'
          )
          .eq('event_id', eventData?.id || eventId)
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
      }
    } catch (err) {
      console.error('Failed to load photo manager:', err);
    } finally {
      setLoading(false);
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
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Owner access only</h1>
          <p className="mb-6 text-gray-600">
            Only the event owner can manage photos for this event. If this is
            your event, open it from the original dashboard link you received by
            email.
          </p>
          <Link
            href={`/dashboard/${eventId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
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
