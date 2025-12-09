'use client';

import { useEffect, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Download from 'yet-another-react-lightbox/plugins/download';
import Share from 'yet-another-react-lightbox/plugins/share';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Inline from 'yet-another-react-lightbox/plugins/inline';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import type { GalleryItem, LightboxProps } from './types';

function isVideoItem(item: GalleryItem): boolean {
  return !!(item.isVideo || item.type === 'video' || item.mimeType?.startsWith('video/'));
}

function getPlaybackUrl(item: GalleryItem): string {
  return item.url || '';
}

export default function YarlLightbox({ items, open, index, onClose, onIndexChange }: LightboxProps) {
  const [videoIndex, setVideoIndex] = useState(-1);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoCodecInfo, setVideoCodecInfo] = useState<Record<string, any>>({});

  const imageItems = items.filter(item => !isVideoItem(item));
  const imageIndexMap: Record<number, number> = {};
  const imageReverseMap: Record<number, number> = {};
  let imageCounter = 0;
  items.forEach((item, itemIndex) => {
    if (!isVideoItem(item)) {
      imageIndexMap[itemIndex] = imageCounter;
      imageReverseMap[imageCounter] = itemIndex;
      imageCounter += 1;
    }
  });
  const yarlIndex = imageIndexMap[index] ?? 0;

  useEffect(() => {
    if (open && index >= 0 && items && items.length > 0 && items[index] && isVideoItem(items[index])) {
      setVideoIndex(index);
      setShowVideoModal(true);

      const videoUrl = items[index].url;
      if (videoUrl && !videoCodecInfo[videoUrl]) {
        fetch(`/api/get-video-info?url=${encodeURIComponent(videoUrl)}`)
          .then(res => res.json())
          .then(data => {
            setVideoCodecInfo(prev => ({ ...prev, [videoUrl]: data }));
          })
          .catch(err => console.error('Video codec check failed:', err));
      }
    } else {
      // Ensure video modal closes when switching to images or closing the lightbox
      setShowVideoModal(false);
      setVideoIndex(-1);
    }
  }, [open, index, items]);

  if (!items || items.length === 0) {
    return null;
  }

  const videoItems = items.filter(isVideoItem);

  const yarlSlides = imageItems.map(item => ({
    src: item.url || '',
    alt: item.title || item.filename || '',
    width: item.width || 1920,
    height: item.height || 1080,
  }));

  return (
    <>
      {showVideoModal && videoIndex >= 0 && isVideoItem(items[videoIndex]) && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => {
                setShowVideoModal(false);
                setVideoIndex(-1);
                onClose();
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-black rounded-lg overflow-hidden">
              {videoCodecInfo[items[videoIndex]?.url] && !videoCodecInfo[items[videoIndex]?.url].isCompatible && (
                <div className="bg-yellow-900/80 text-yellow-100 p-3 text-sm">
                  <strong>⚠️ Codec Warning:</strong> {videoCodecInfo[items[videoIndex]?.url].message}
                  <br />
                  <span className="text-xs">
                    Detected: {videoCodecInfo[items[videoIndex]?.url].codec} | File size: {videoCodecInfo[items[videoIndex]?.url].contentLengthMB} MB
                  </span>
                </div>
              )}

              <video
                key={items[videoIndex].url}
                controls
                autoPlay
                className="w-full h-auto max-h-[70vh] object-contain bg-black"
                playsInline
                controlsList="nodownload"
                crossOrigin="anonymous"
                onError={(e) => {
                  const video = e.target as HTMLVideoElement;
                  const errorCode = video.error?.code || 0;
                  console.error('Video error', errorCode, video.error);
                }}
              >
                <source src={getPlaybackUrl(items[videoIndex])} type="video/mp4; codecs='avc1.42E01E'" />
                <source src={getPlaybackUrl(items[videoIndex])} type="video/mp4" />
                <source src={getPlaybackUrl(items[videoIndex])} type="video/webm" />
                <p className="text-white text-center p-4">⚠️ Your browser cannot play this video. Try downloading it instead.</p>
              </video>
            </div>

            {items[videoIndex].title && (
              <div className="mt-4 text-white text-center">
                <h3 className="text-lg font-semibold">{items[videoIndex].title}</h3>
              </div>
            )}

            {videoItems.length > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    const currentVideoPos = videoItems.findIndex(v => v.id === items[videoIndex].id);
                    if (currentVideoPos > 0) {
                      const prevVideoIndex = items.indexOf(videoItems[currentVideoPos - 1]);
                      setVideoIndex(prevVideoIndex);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-white text-sm">
                  {videoItems.findIndex(v => v.id === items[videoIndex].id) + 1} of {videoItems.length}
                </span>
                <button
                  onClick={() => {
                    const currentVideoPos = videoItems.findIndex(v => v.id === items[videoIndex].id);
                    if (currentVideoPos < videoItems.length - 1) {
                      const nextVideoIndex = items.indexOf(videoItems[currentVideoPos + 1]);
                      setVideoIndex(nextVideoIndex);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {imageItems.length > 0 && (
        <Lightbox
          open={open && !showVideoModal}
          close={onClose}
          slides={yarlSlides}
          index={Math.min(Math.max(yarlIndex, 0), imageItems.length - 1)}
          plugins={[Thumbnails, Zoom, Captions, Fullscreen, Counter, Download, Share, Slideshow, Inline]}
          on={{
            view: ({ index: currentIndex }) => {
              const mappedBack = imageReverseMap[currentIndex];
              onIndexChange?.(mappedBack !== undefined ? mappedBack : currentIndex);
            },
          }}
          styles={{ container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' } }}
          thumbnails={{
            position: 'bottom',
            width: 120,
            height: 100,
            border: 1,
            borderColor: '#666',
            borderRadius: 4,
            padding: 4,
            gap: 16,
          }}
          zoom={{
            maxZoomPixelRatio: 10,
            wheelZoomDistanceFactor: 100,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            scrollToZoom: true,
          }}
          counter={{}}
          captions={{}}
          slideshow={{}}
        />
      )}
    </>
  );
}
