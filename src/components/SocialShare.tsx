'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Simple Social Media Share Component
 * Uses direct URL sharing for social media platforms
 */
export function SocialShare({
  url,
  title = '',
  description = '',
  imageUrl = '',
  children,
  className = '',
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Ensure we're on the client side before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we're sharing a media file or a gallery page
  const { isMediaUrl, mediaUrl, pageUrl, shareLinks, urlToCopy } = useMemo(() => {
    const galleryUrl = typeof window !== 'undefined' ? window.location.href : '';
    const providedUrl = url || galleryUrl;
    
    // Check if the provided URL is a direct media file (image/video)
    const isMedia = providedUrl && (
      providedUrl.match(/\.(jpg|jpeg|png|gif|webp|heic|mp4|mov|hevc)(\?|$)/i) ||
      providedUrl.includes('/storage/v1/object/public/photos/')
    );
    
    // If imageUrl is provided and different from url, it's the media preview
    const media = imageUrl && imageUrl !== providedUrl ? imageUrl : (isMedia ? providedUrl : imageUrl || '');
    const page = isMedia ? galleryUrl : providedUrl;
    
    const shareTitle = title || 'Check this out!';
    const shareDescription = description || '';

    // Encode URL components
    const encodedPageUrl = encodeURIComponent(page);
    const encodedMediaUrl = encodeURIComponent(media || page);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(shareDescription);

    // Social media share URLs
    // For individual media: use media URL directly for platforms that support it
    // For gallery: use page URL with media as preview
    const links = {
      // Facebook: Use page URL for gallery, media URL for individual items (with media preview)
      facebook: isMedia 
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedMediaUrl}${shareTitle ? `&quote=${encodedTitle}` : ''}`
        : `https://www.facebook.com/sharer/sharer.php?u=${encodedPageUrl}${media ? `&picture=${encodeURIComponent(media)}` : ''}${shareTitle ? `&quote=${encodedTitle}` : ''}`,
      
      // Twitter: Use media URL for individual items, page URL for gallery
      twitter: `https://twitter.com/intent/tweet?url=${isMedia ? encodedMediaUrl : encodedPageUrl}&text=${encodedTitle}${media && !isMedia ? ` ${encodedMediaUrl}` : ''}`,
      
      // WhatsApp: Include both page and media info
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${isMedia ? encodedMediaUrl : encodedPageUrl}${media && !isMedia ? `%0A${encodedMediaUrl}` : ''}`,
      
      // LinkedIn: Use page URL (better for SEO), media as preview
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPageUrl}`,
      
      // Pinterest: Use media URL directly (required for pinning)
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedPageUrl}&description=${encodedDescription}${media ? `&media=${encodeURIComponent(media)}` : ''}`,
      
      // Telegram: Use media URL for individual items, page URL for gallery
      telegram: `https://t.me/share/url?url=${isMedia ? encodedMediaUrl : encodedPageUrl}&text=${encodedTitle}${media && !isMedia ? `%20${encodedMediaUrl}` : ''}`,
      
      // Reddit: Use page URL for gallery, media URL for individual items
      reddit: `https://reddit.com/submit?url=${isMedia ? encodedMediaUrl : encodedPageUrl}&title=${encodedTitle}`,
      
      // Email: Include both URLs
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedPageUrl}${media ? `%0A%0AMedia: ${encodeURIComponent(media)}` : ''}`,
    };

    return {
      isMediaUrl: isMedia,
      mediaUrl: media,
      pageUrl: page,
      shareLinks: links,
      urlToCopy: isMedia ? (media || providedUrl) : page,
    };
  }, [url, imageUrl, title, description]);

  // Handle share click
  const handleShareClick = useCallback((platform: string) => {
    const shareLink = shareLinks[platform as keyof typeof shareLinks];
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      setIsOpen(false);
      toast.success(`Opening ${platform}...`);
    }
  }, [shareLinks]);

  // Copy to clipboard - copy the appropriate URL (media for individual items, page for gallery)
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy link');
    }
  }, [urlToCopy]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle click outside modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  const socialPlatforms = [
    { name: 'Facebook', icon: '📘', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Twitter', icon: '🐦', color: 'bg-sky-500 hover:bg-sky-600' },
    { name: 'WhatsApp', icon: '💬', color: 'bg-green-500 hover:bg-green-600' },
    { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700 hover:bg-blue-800' },
    { name: 'Pinterest', icon: '📌', color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Telegram', icon: '✈️', color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Reddit', icon: '🤖', color: 'bg-orange-600 hover:bg-orange-700' },
    { name: 'Email', icon: '📧', color: 'bg-gray-600 hover:bg-gray-700' },
  ];

  return (
    <>
      {/* Trigger */}
      <div onClick={handleTriggerClick} className="cursor-pointer inline-flex">
        {children || (
          <button
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl ${className}`}
            aria-label="Share"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
        )}
      </div>

      {/* Share Modal - Rendered via Portal to document.body */}
      {isOpen && mounted && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
          }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div
            ref={modalRef}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 mx-2 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 
                id="share-modal-title" 
                className="text-xl font-semibold text-gray-900 dark:text-white pr-2"
              >
                Share
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                aria-label="Close share dialog"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-gray-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
            </div>

            {/* Share Options Grid */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                {socialPlatforms.map((platform) => (
                  <div key={platform.name} className="flex flex-col items-center gap-2 min-w-0">
                    <button
                      onClick={() => handleShareClick(platform.name.toLowerCase())}
                      className={`w-16 h-16 ${platform.color} text-white rounded-full flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform shadow-lg flex-shrink-0`}
                      aria-label={`Share on ${platform.name}`}
                      title={platform.name}
                    >
                      {platform.icon}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 text-center w-full px-1 break-words">
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Copy Link Section */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-row items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={urlToCopy}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Copied</span>
                      </>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default SocialShare;

