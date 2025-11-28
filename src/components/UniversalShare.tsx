'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  PinterestShareButton,
  RedditShareButton,
  TelegramShareButton,
  EmailShareButton,
  FacebookMessengerShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
  PinterestIcon,
  RedditIcon,
  TelegramIcon,
  EmailIcon,
  FacebookMessengerIcon,
  XIcon,
} from 'react-share';
import { toast } from 'sonner';

interface UniversalShareProps {
  // New API (generic)
  url?: string;
  title?: string;
  description?: string;
  
  // Legacy API (gallery-specific)
  imageUrl?: string;
  eventName?: string;
  eventCode?: string;
  isVideo?: boolean;
  
  // Common props
  hashtags?: string[];
  onShareComplete?: (platform: string) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * UniversalShare - Premium Share Component
 * 
 * Strategy:
 * 1. Mobile-first: Use native Web Share API when available (iOS/Android)
 * 2. Desktop fallback: Show share modal with popular platforms
 * 3. Deep link support for messaging apps
 * 
 * Supports: Facebook, X/Twitter, WhatsApp, LinkedIn, Pinterest, 
 * Reddit, Telegram, Messenger, Email, Copy Link, Native Share
 */
export function UniversalShare({
  // New API
  url: providedUrl,
  title: providedTitle,
  description = '',
  
  // Legacy API
  imageUrl = '',
  eventName = '',
  eventCode = '',
  isVideo = false,
  
  // Common
  hashtags = [],
  onShareComplete,
  children,
  className = '',
}: UniversalShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Compute the share URL - support both legacy and new API
  const shareUrl = providedUrl || (
    typeof window !== 'undefined' 
      ? (eventCode 
          ? `${window.location.origin}/e/${eventCode}` 
          : window.location.href)
      : ''
  );
  
  // Compute the title
  const shareTitle = providedTitle || (
    eventName 
      ? `${isVideo ? 'Video' : 'Photo'} from ${eventName}`
      : (isVideo ? 'Check out this video!' : 'Check out this photo!')
  );
  
  // Media URL for Pinterest
  const mediaUrl = imageUrl;

  // Check for native share support on mount
  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && 
      typeof navigator.share === 'function'
    );
  }, []);

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

  // Native Web Share API (best mobile experience)
  const handleNativeShare = useCallback(async () => {
    if (!canNativeShare) return false;
    
    try {
      await navigator.share({
        title: shareTitle || 'Check out this photo!',
        text: description || '',
        url: shareUrl,
      });
      onShareComplete?.('native');
      setIsOpen(false);
      return true;
    } catch (err: unknown) {
      // User cancelled or share failed
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Native share failed:', err);
      }
      return false;
    }
  }, [canNativeShare, shareTitle, description, shareUrl, onShareComplete]);

  // Copy to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      onShareComplete?.('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy link');
    }
  }, [shareUrl, onShareComplete]);

  // Handle share button click
  const handleShareClick = useCallback(async () => {
    // On mobile, try native share first
    if (canNativeShare) {
      const success = await handleNativeShare();
      if (success) return;
    }
    // Otherwise show modal
    setIsOpen(true);
  }, [canNativeShare, handleNativeShare]);

  // Track share events
  const handleShareEvent = useCallback((platform: string) => {
    onShareComplete?.(platform);
    // Don't close modal - let user share to multiple platforms
  }, [onShareComplete]);

  const shareIconSize = 48;
  const shareIconRound = true;

  // Default trigger button
  const TriggerButton = children || (
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
  );

  return (
    <>
      {/* Trigger */}
      <div onClick={handleShareClick} className="cursor-pointer inline-flex">
        {TriggerButton}
      </div>

      {/* Share Modal - Portal to body to avoid overflow issues */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
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
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 
                id="share-modal-title" 
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                Share
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
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
              {/* Native Share (Mobile) */}
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full mb-4 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span className="font-medium">Share via device...</span>
                </button>
              )}

              {/* Social Share Buttons */}
              <div className="grid grid-cols-4 gap-4">
                {/* Facebook */}
                <div className="flex flex-col items-center gap-1">
                  <FacebookShareButton
                    url={shareUrl}
                    hashtag={hashtags.length > 0 ? `#${hashtags[0]}` : undefined}
                    onClick={() => handleShareEvent('facebook')}
                    className="hover:scale-110 transition-transform"
                  >
                    <FacebookIcon size={shareIconSize} round={shareIconRound} />
                  </FacebookShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Facebook</span>
                </div>

                {/* X (Twitter) */}
                <div className="flex flex-col items-center gap-1">
                  <TwitterShareButton
                    url={shareUrl}
                    title={shareTitle}
                    hashtags={hashtags}
                    onClick={() => handleShareEvent('twitter')}
                    className="hover:scale-110 transition-transform"
                  >
                    <XIcon size={shareIconSize} round={shareIconRound} />
                  </TwitterShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">X</span>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col items-center gap-1">
                  <WhatsappShareButton
                    url={shareUrl}
                    title={shareTitle}
                    onClick={() => handleShareEvent('whatsapp')}
                    className="hover:scale-110 transition-transform"
                  >
                    <WhatsappIcon size={shareIconSize} round={shareIconRound} />
                  </WhatsappShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">WhatsApp</span>
                </div>

                {/* Messenger */}
                <div className="flex flex-col items-center gap-1">
                  <FacebookMessengerShareButton
                    url={shareUrl}
                    appId=""
                    onClick={() => handleShareEvent('messenger')}
                    className="hover:scale-110 transition-transform"
                  >
                    <FacebookMessengerIcon size={shareIconSize} round={shareIconRound} />
                  </FacebookMessengerShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Messenger</span>
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col items-center gap-1">
                  <LinkedinShareButton
                    url={shareUrl}
                    title={shareTitle}
                    summary={description}
                    onClick={() => handleShareEvent('linkedin')}
                    className="hover:scale-110 transition-transform"
                  >
                    <LinkedinIcon size={shareIconSize} round={shareIconRound} />
                  </LinkedinShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">LinkedIn</span>
                </div>

                {/* Telegram */}
                <div className="flex flex-col items-center gap-1">
                  <TelegramShareButton
                    url={shareUrl}
                    title={shareTitle}
                    onClick={() => handleShareEvent('telegram')}
                    className="hover:scale-110 transition-transform"
                  >
                    <TelegramIcon size={shareIconSize} round={shareIconRound} />
                  </TelegramShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Telegram</span>
                </div>

                {/* Pinterest */}
                <div className="flex flex-col items-center gap-1">
                  <PinterestShareButton
                    url={shareUrl}
                    media={mediaUrl}
                    description={description || shareTitle}
                    onClick={() => handleShareEvent('pinterest')}
                    className="hover:scale-110 transition-transform"
                  >
                    <PinterestIcon size={shareIconSize} round={shareIconRound} />
                  </PinterestShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pinterest</span>
                </div>

                {/* Reddit */}
                <div className="flex flex-col items-center gap-1">
                  <RedditShareButton
                    url={shareUrl}
                    title={shareTitle}
                    onClick={() => handleShareEvent('reddit')}
                    className="hover:scale-110 transition-transform"
                  >
                    <RedditIcon size={shareIconSize} round={shareIconRound} />
                  </RedditShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Reddit</span>
                </div>

                {/* Email */}
                <div className="flex flex-col items-center gap-1">
                  <EmailShareButton
                    url={shareUrl}
                    subject={shareTitle || 'Check out this photo!'}
                    body={description || 'I wanted to share this with you:'}
                    onClick={() => handleShareEvent('email')}
                    className="hover:scale-110 transition-transform"
                  >
                    <EmailIcon size={shareIconSize} round={shareIconRound} />
                  </EmailShareButton>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                </div>
              </div>

              {/* Copy Link Section */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UniversalShare;
