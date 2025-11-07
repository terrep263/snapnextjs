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
          dark: '#000000', // Black QR code
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
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
    const padding = 80;
    const topPadding = 100;
    const bottomPadding = 80;
    const qrSize = size;
    
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + topPadding + bottomPadding;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw diamond pattern background
    drawDiamondPattern(ctx, canvas.width, canvas.height);
    
    // Draw purple rounded border
    drawRoundedBorder(ctx, padding, topPadding, qrSize, '#7c3aed', 16, 8);
    
    // Draw corner photo frames (4 purple squares)
    drawCornerFrames(ctx, padding, topPadding, qrSize);
    
    // Draw QR code
    const qrImage = new window.Image();
    qrImage.onload = () => {
      ctx.drawImage(qrImage, padding, topPadding, qrSize, qrSize);
      
      // Draw center circular logo with camera
      const centerX = padding + qrSize / 2;
      const centerY = topPadding + qrSize / 2;
      drawCenterLogo(ctx, centerX, centerY);
      
      // Draw top text
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEVER MISS THE MOMENTS', canvas.width / 2, 30);
      
      // Draw bottom text
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('snapworxx.com', canvas.width / 2, canvas.height - 20);
      
      // Convert to data URL
      setStyledQRDataUrl(canvas.toDataURL('image/png'));
    };
    qrImage.src = qrDataUrl;
  };

  const drawDiamondPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#7c3aed';
    const dotSize = 6;
    const spacing = 20;
    const opacity = 0.15;
    ctx.globalAlpha = opacity;
    
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        // Draw diamond shape (rotated square)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-dotSize / 2, -dotSize / 2, dotSize, dotSize);
        ctx.restore();
      }
    }
    
    ctx.globalAlpha = 1;
  };

  const drawRoundedBorder = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, radius: number, borderWidth: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const borderX = x - 15;
    const borderY = y - 15;
    const borderSize = size + 30;
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(borderX + radius, borderY);
    ctx.lineTo(borderX + borderSize - radius, borderY);
    ctx.quadraticCurveTo(borderX + borderSize, borderY, borderX + borderSize, borderY + radius);
    ctx.lineTo(borderX + borderSize, borderY + borderSize - radius);
    ctx.quadraticCurveTo(borderX + borderSize, borderY + borderSize, borderX + borderSize - radius, borderY + borderSize);
    ctx.lineTo(borderX + radius, borderY + borderSize);
    ctx.quadraticCurveTo(borderX, borderY + borderSize, borderX, borderY + borderSize - radius);
    ctx.lineTo(borderX, borderY + radius);
    ctx.quadraticCurveTo(borderX, borderY, borderX + radius, borderY);
    ctx.closePath();
    ctx.stroke();
  };

  const drawCornerFrames = (ctx: CanvasRenderingContext2D, padding: number, topPadding: number, qrSize: number) => {
    const frameSize = 30;
    const frameThickness = 3;
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = frameThickness;
    
    // Top-left
    ctx.strokeRect(padding - 8, topPadding - 8, frameSize, frameSize);
    // Top-right
    ctx.strokeRect(padding + qrSize - frameSize + 8, topPadding - 8, frameSize, frameSize);
    // Bottom-left
    ctx.strokeRect(padding - 8, topPadding + qrSize - frameSize + 8, frameSize, frameSize);
    // Bottom-right
    ctx.strokeRect(padding + qrSize - frameSize + 8, topPadding + qrSize - frameSize + 8, frameSize, frameSize);
  };

  const drawCenterLogo = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const logoRadius = 28;
    
    // White circle background
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoRadius + 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Purple circle
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Camera icon (white)
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Camera body (trapezoid-like)
    const bodyLeft = centerX - 10;
    const bodyTop = centerY - 5;
    ctx.strokeRect(bodyLeft, bodyTop, 20, 12);
    
    // Camera lens circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.stroke();
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