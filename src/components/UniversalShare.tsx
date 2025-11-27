'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UniversalShareProps {
  imageUrl: string;
  title?: string;
  className?: string;
}

export default function UniversalShare({
  imageUrl,
  title = 'Check out this photo from SnapWorxx!',
  className = ''
}: UniversalShareProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async () => {
    try {
      setIsProcessing(true);

      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob);

      const watermarkResponse = await fetch('/api/share-image', {
        method: 'POST',
        body: formData,
      });

      if (!watermarkResponse.ok) {
        throw new Error('Failed to process image');
      }

      const watermarkedBlob = await watermarkResponse.blob();
      const file = new File([watermarkedBlob], 'snapworxx-photo.jpg', {
        type: 'image/jpeg',
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: 'Shared with snapworxx.com branding',
        });
        toast.success('Image shared successfully!');
      } else {
        const url = URL.createObjectURL(watermarkedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `snapworxx-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded with snapworxx.com branding!');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isProcessing}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      aria-label="Share image with snapworxx.com branding"
    >
      <Share2 className="w-4 h-4" />
      {isProcessing ? 'Processing...' : 'Share'}
    </button>
  );
}
