'use client';

import { useState } from 'react';
import { PhotoSwipeLightbox } from '@/components/Gallery';
import type { GalleryItem } from '@/components/Gallery';

export default function VideoTestPage() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const testItems: GalleryItem[] = [
    {
      id: '1',
      url: '/12526894_720_1280_30fps.mp4',
      type: 'video',
      title: 'Test Video',
      isVideo: true,
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Display Test</h1>

        {/* Direct Video Test */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Direct HTML5 Video Element</h2>
          <p className="text-sm text-gray-600 mb-4">
            This should display the video directly in the page with controls.
          </p>
          <video
            src="/12526894_720_1280_30fps.mp4"
            controls
            className="w-full max-w-2xl"
            style={{ maxHeight: '500px', background: '#000' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* YARL Lightbox Test */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. YARL Lightbox Video</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to open the video in YARL lightbox.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Open Video in Lightbox
          </button>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Expected behavior:</strong> When you click the button, the video should open in a fullscreen lightbox
              and display the video (not just play audio). You should see the video player with controls.
            </p>
          </div>
        </div>

        {/* Diagnostic Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Video URL:</strong> /12526894_720_1280_30fps.mp4</p>
            <p><strong>Browser:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
            <p><strong>Video Support:</strong> {typeof document !== 'undefined' ?
              (document.createElement('video').canPlayType('video/mp4') ? '✅ MP4 supported' : '❌ MP4 not supported')
              : 'N/A'}
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Debug Steps:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>First, verify the direct video (test #1) plays correctly</li>
              <li>If test #1 works but test #2 doesn't, it's a lightbox CSS issue</li>
              <li>If test #1 doesn't work, check the video file path and browser console for errors</li>
              <li>Open browser DevTools (F12) and check for any JavaScript errors</li>
              <li>In DevTools, inspect the video element when lightbox is open to check its CSS properties</li>
              <li>Check if video element has width/height set (should show dimensions in inspector)</li>
              <li>Look for any elements with higher z-index covering the video</li>
              <li>Check opacity and visibility of video element and all parent containers</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-semibold text-red-800 mb-2">
              🔍 Quick Debug: When lightbox opens, check:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              <li>Does the video element exist in the DOM?</li>
              <li>What are the computed width and height of the video?</li>
              <li>Is opacity: 1 and visibility: visible?</li>
              <li>Any overlays with higher z-index?</li>
            </ul>
            <button
              onClick={() => {
                console.log('=== VIDEO ELEMENT DEBUG ===');
                console.log('User Agent:', navigator.userAgent);
                console.log('Platform:', navigator.platform);
                console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);

                const videos = document.querySelectorAll('video');
                console.log('Total videos found:', videos.length);

                videos.forEach((v, i) => {
                  const computed = window.getComputedStyle(v);
                  const rect = v.getBoundingClientRect();
                  console.log(`\nVideo ${i}:`, {
                    src: v.src,
                    // Intrinsic dimensions
                    videoWidth: v.videoWidth,
                    videoHeight: v.videoHeight,
                    // Attributes
                    attrWidth: v.getAttribute('width'),
                    attrHeight: v.getAttribute('height'),
                    // Client dimensions
                    clientWidth: v.clientWidth,
                    clientHeight: v.clientHeight,
                    offsetWidth: v.offsetWidth,
                    offsetHeight: v.offsetHeight,
                    // Computed styles
                    display: computed.display,
                    visibility: computed.visibility,
                    opacity: computed.opacity,
                    width: computed.width,
                    height: computed.height,
                    minWidth: computed.minWidth,
                    minHeight: computed.minHeight,
                    maxWidth: computed.maxWidth,
                    maxHeight: computed.maxHeight,
                    zIndex: computed.zIndex,
                    position: computed.position,
                    // Bounding rect
                    rect: {
                      width: rect.width,
                      height: rect.height,
                      top: rect.top,
                      left: rect.left,
                    },
                    // Video state
                    readyState: v.readyState,
                    networkState: v.networkState,
                    paused: v.paused,
                    ended: v.ended,
                    error: v.error,
                  });
                });
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Debug All Videos in Console (Extended)
            </button>
          </div>
        </div>
      </div>

      <PhotoSwipeLightbox
        items={testItems}
        open={open}
        index={index}
        onClose={() => setOpen(false)}
        onIndexChange={setIndex}
      />
    </div>
  );
}
