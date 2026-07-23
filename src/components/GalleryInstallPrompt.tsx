'use client';

import { useEffect, useState } from 'react';

/**
 * GalleryInstallPrompt
 *
 * Lets a guest save THIS gallery to their phone's home screen so they can
 * return and upload more without rescanning the QR code.
 *  - Android/Chrome: shows a real one-tap "Add to phone" button (uses the
 *    captured beforeinstallprompt event; requires the manifest + service worker).
 *  - iPhone/Safari: Apple doesn't allow a programmatic install, so we show the
 *    guided "tap Share → Add to Home Screen" tip.
 * Hidden automatically when already installed (standalone) or after dismissal.
 */
export default function GalleryInstallPrompt({
  slug,
  eventName,
}: {
  slug?: string;
  eventName?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Register the service worker (Android installability).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* non-fatal */
      });
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setStandalone(isStandalone);

    try {
      if (localStorage.getItem('sw_install_dismissed') === '1') setDismissed(true);
    } catch {
      /* ignore */
    }

    // Remember this gallery on the device so a returning guest has a way back
    // even if they don't install (belt-and-suspenders for "no rescan").
    try {
      if (slug) {
        const key = 'sw_recent_galleries';
        const raw = localStorage.getItem(key);
        const list: any[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((g) => g && g.slug !== slug);
        filtered.unshift({
          slug,
          name: eventName || 'Event Gallery',
          url: `/e/${slug}/gallery`,
          ts: Date.now(),
        });
        localStorage.setItem(key, JSON.stringify(filtered.slice(0, 12)));
      }
    } catch {
      /* ignore */
    }

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [slug, eventName]);

  if (standalone || dismissed) return null;
  // Only render when there's an actual path to install: an Android prompt, or iOS Safari.
  if (!deferredPrompt && !isIOS) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('sw_install_dismissed', '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      /* ignore */
    }
    setDeferredPrompt(null);
    setDismissed(true);
  };

  return (
    <div className="mx-auto my-4 max-w-3xl px-4">
      <div className="relative rounded-xl border border-purple-200 bg-purple-50 p-4">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 p-1 text-purple-400 hover:text-purple-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none">📲</div>
          <div className="flex-1">
            <p className="font-semibold text-purple-900">Add this gallery to your phone</p>
            <p className="mt-0.5 text-sm text-purple-800">
              One tap to come back and upload more photos later — no need to rescan the QR code.
            </p>

            {deferredPrompt && (
              <button
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Add to phone
              </button>
            )}

            {!deferredPrompt && isIOS && (
              <>
                <button
                  onClick={() => setShowIosTip((v) => !v)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                >
                  Show me how
                </button>
                {showIosTip && (
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                    Tap the <span className="font-semibold">Share</span> icon{' '}
                    <span aria-hidden>⌘</span> at the bottom of Safari, then choose{' '}
                    <span className="font-semibold">“Add to Home Screen.”</span> The gallery
                    icon will appear on your home screen.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
