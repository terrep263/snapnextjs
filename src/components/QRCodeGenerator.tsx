'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCodeLib from 'qrcode';
import { Download, Copy, Check, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  eventName?: string;
  size?: number;
}

export default function QRCodeGenerator({ url, eventName, size = 256 }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [styledQRDataUrl, setStyledQRDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [url]);

  const generateQRCode = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: size,
        margin: 1,
        color: {
          dark: '#7c3aed', // Purple
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for logo overlay
      });
      setQrCodeDataUrl(dataUrl);
      // Create styled version with canvas
      createStyledQRCode(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStyledQRCode = (qrDataUrl: string) => {
    const canvas = document.createElement('canvas');
    const borderSize = 60;
    const qrSize = size;
    const canvasSize = qrSize + borderSize * 2;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize + 80; // Extra space for text
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Purple border frame
    const borderWidth = 12;
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = borderWidth;
    const frameStart = borderSize - borderWidth / 2;
    const frameSize = qrSize + borderWidth;
    
    // Draw border rectangle
    ctx.strokeRect(frameStart, frameStart, frameSize, frameSize);
    
    // Draw QR code
    const qrImage = new window.Image();
    qrImage.onload = () => {
      ctx.drawImage(qrImage, borderSize, borderSize, qrSize, qrSize);
      
      // Add purple circular logo/icon in center
      const centerX = borderSize + qrSize / 2;
      const centerY = borderSize + qrSize / 2;
      const logoRadius = 30;
      
      // White circle background
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoRadius + 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Purple circle
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw camera icon inside circle (simple line representation)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#FFFFFF';
      
      // Camera body
      const cameraX = centerX - 8;
      const cameraY = centerY - 4;
      ctx.fillRect(cameraX, cameraY, 16, 12);
      ctx.strokeRect(cameraX, cameraY, 16, 12);
      
      // Camera lens
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add text below
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNAPWORXX', canvas.width / 2, canvas.height - 20);
      
      // Convert to data URL
      setStyledQRDataUrl(canvas.toDataURL('image/png'));
    };
    qrImage.src = qrDataUrl;
  };

  const downloadQRCode = () => {
    if (!styledQRDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${eventName || 'event'}-qr-code.png`;
    link.href = styledQRDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
          <p className="text-sm text-gray-600">Generating QR code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Code Display - Styled */}
      <div className="flex justify-center">
        {styledQRDataUrl ? (
          <div className="rounded-lg shadow-md overflow-hidden">
            <img
              src={styledQRDataUrl}
              alt={`Branded QR Code for ${eventName || 'event'}`}
              className="rounded-lg"
              style={{ maxWidth: '400px', width: '100%', height: 'auto' }}
            />
          </div>
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <QrCode className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* URL Display */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Event URL:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-white px-3 py-2 text-sm text-gray-800">
            {url}
          </code>
          <button
            onClick={copyUrlToClipboard}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadQRCode}
          disabled={!styledQRDataUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </button>
        
        <button
          onClick={() => window.open(url, '_blank')}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <QrCode className="h-4 w-4" />
          Test Link
        </button>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-900">How to use:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Share the branded QR code at your event venue</li>
          <li>• Guests can scan it with their phone camera</li>
          <li>• They'll be taken directly to the photo upload page</li>
          <li>• No app download required!</li>
        </ul>
      </div>
    </div>
  );
}