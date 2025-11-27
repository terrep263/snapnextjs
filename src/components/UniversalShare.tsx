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
          <div className="flex gap-3 mb-4 justify-center">
            <FacebookShareButton url={shareUrl} hashtag="#snapworxx">
              <FacebookIcon size={40} round />
            </FacebookShareButton>
            
            <TwitterShareButton url={shareUrl} title={shareTitle}>
              <TwitterIcon size={40} round />
            </TwitterShareButton>
            
            <WhatsappShareButton url={shareUrl} title={shareTitle}>
              <WhatsappIcon size={40} round />
            </WhatsappShareButton>
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
