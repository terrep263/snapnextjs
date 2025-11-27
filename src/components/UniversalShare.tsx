'use client';

import { useState } from 'react';

interface UniversalShareProps {
  imageUrl: string;
  eventName?: string;
  eventCode?: string;
}

export default function UniversalShare({ 
  imageUrl, 
  eventName = 'this event',
  eventCode = ''
}: UniversalShareProps) {
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    setIsSharing(true);
    
    try {
      // Get branded image from API
      const response = await fetch('/api/share-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to create branded image');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'snapworxx-photo.jpg', { type: 'image/jpeg' });
      
      // Prepare share text with clickable link
      const shareText = eventCode 
        ? `📸 Check out my photos from ${eventName}!\n\nEvent code: ${eventCode}\nGet your event photos at https://snapworxx.com`
        : `📸 Check out my photos from ${eventName}!\n\nGet your event photos at https://snapworxx.com`;
      
      // Try native share API first (works on mobile + modern browsers)
      if (navigator.share) {
        try {
          // Check if we can share files
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Photos from ${eventName}`,
              text: shareText
            });
          } else {
            // Share without file, just the text/link
            await navigator.share({
              title: `Photos from ${eventName}`,
              text: shareText,
              url: 'https://snapworxx.com'
            });
            
            // Also download the image
            downloadImage(blob);
          }
          
          console.log('Share successful');
        } catch (shareError: any) {
          // User cancelled or share failed
          if (shareError.name !== 'AbortError') {
            console.error('Native share failed:', shareError);
            fallbackShare(blob, shareText);
          }
        }
      } else {
        // Browser doesn't support native share
        fallbackShare(blob, shareText);
      }
      
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to prepare image for sharing. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }

  function downloadImage(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapworxx-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function fallbackShare(blob: Blob, shareText: string) {
    // Download image
    downloadImage(blob);
    
    // Copy caption to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      alert('✅ Photo downloaded!\n📋 Caption copied to clipboard!\n\nPaste the caption when you post to your favorite social media!');
    } catch (clipboardError) {
      console.error('Clipboard copy failed:', clipboardError);
      // Show the text so user can manually copy
      alert(`✅ Photo downloaded!\n\nShare with this caption:\n\n${shareText}`);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 disabled:cursor-not-allowed text-sm"
    >
      {isSharing ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Preparing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
