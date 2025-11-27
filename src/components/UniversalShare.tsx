'use client';

import { useState } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';

interface UniversalShareProps {
  imageUrl: string;
  eventName?: string;
  eventCode?: string;
  isVideo?: boolean;
}

export default function UniversalShare({ 
  imageUrl, 
  eventName = 'this event',
  eventCode = '',
  isVideo = false
}: UniversalShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaType = isVideo ? 'video' : 'photo';
  const shareTitle = `📸 Check out my ${mediaType} from ${eventName}!${eventCode ? ` Event code: ${eventCode}` : ''} - Get your event photos at snapworxx.com`;
  
  // For social share, we'll use the direct URL
  const shareUrl = imageUrl;

  async function handleDownloadWithWatermark() {
    if (isVideo) {
      // For videos, just download directly
      window.open(imageUrl, '_blank');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/share-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) throw new Error('Failed to create branded image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snapworxx-photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${imageUrl}`);
      alert('📋 Link and caption copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl p-4 z-50 min-w-[200px] border border-gray-200">
          <div className="text-xs text-gray-500 mb-3 font-medium">Share to:</div>
          
          {/* Social Share Buttons */}
          <div className="flex gap-3 mb-4 justify-center flex-wrap">
            <FacebookShareButton url={shareUrl} hashtag="#snapworxx">
              <FacebookIcon size={40} round />
            </FacebookShareButton>
            
            <TwitterShareButton url={shareUrl} title={shareTitle}>
              <TwitterIcon size={40} round />
            </TwitterShareButton>
            
            <WhatsappShareButton url={shareUrl} title={shareTitle}>
              <WhatsappIcon size={40} round />
            </WhatsappShareButton>

            {/* Instagram Share - Downloads image and copies caption */}
            <button
              onClick={async () => {
                // Instagram doesn't allow direct sharing via web - must download and post manually
                await navigator.clipboard.writeText(shareTitle);
                // Download the image with watermark for posting
                if (!isVideo) {
                  try {
                    const response = await fetch('/api/share-image', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ imageUrl })
                    });
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'snapworxx-photo.jpg';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (e) {
                    console.error('Download failed:', e);
                  }
                }
                alert('📸 Photo downloaded & caption copied!\n\nOpen Instagram and create a new post with the downloaded photo.');
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
              title="Share to Instagram"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </button>

            {/* TikTok Share - Opens TikTok app/web with content ready */}
            <button
              onClick={async () => {
                // TikTok doesn't have a direct share API, so we copy to clipboard and open TikTok
                await navigator.clipboard.writeText(`${shareTitle}\n\n${imageUrl}`);
                // Try to open TikTok - on mobile it will open the app
                window.open('https://www.tiktok.com/upload', '_blank');
                alert('📋 Caption copied! Paste it in TikTok when uploading.');
              }}
              className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Share to TikTok"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>

            {/* Download with Watermark (images only) */}
            <button
              onClick={handleDownloadWithWatermark}
              disabled={isProcessing}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {isVideo ? 'Open Video' : 'Download with Watermark'}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
