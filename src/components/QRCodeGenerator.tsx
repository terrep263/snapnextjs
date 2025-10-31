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
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${eventName || 'event'}-qr-code.png`;
    link.href = qrCodeDataUrl;
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
      {/* QR Code Display */}
      <div className="flex justify-center">
        {qrCodeDataUrl ? (
          <div className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code for ${eventName || 'event'}`}
              width={size}
              height={size}
              className="rounded-md"
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
          disabled={!qrCodeDataUrl}
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
          <li>• Share the QR code at your event venue</li>
          <li>• Guests can scan it with their phone camera</li>
          <li>• They'll be taken directly to the photo upload page</li>
          <li>• No app download required!</li>
        </ul>
      </div>
    </div>
  );
}