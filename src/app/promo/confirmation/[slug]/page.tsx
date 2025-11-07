'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, Copy, Mail, MessageCircle, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [eventData, setEventData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  const eventUrl = `https://snapworxx.com/e/${slug}`;

  useEffect(() => {
    // Retrieve event data from URL search params or sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`promo_event_${slug}`);
      if (stored) {
        setEventData(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, [slug]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(eventUrl)}`;
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${eventData?.name || 'event'}-qrcode.png`;
    link.click();
  };

  const shareViaEmail = () => {
    const subject = `Join ${eventData?.name || 'my event'} on Snapworxx`;
    const body = `Check out my event on Snapworxx!\n\n${eventUrl}\n\nScan the QR code or click the link to upload photos.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const message = `Check out my event: ${eventUrl}`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapworxx logo (1).png" alt="Snapworxx" className="w-8 h-8" />
            <span className="text-lg font-bold text-gray-900">Snapworxx</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your Event is Ready!</h1>
          <p className="text-xl text-gray-600">Share the QR code or link below with your guests to let them upload photos.</p>
        </div>

        {/* Event Details Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 mb-12 border border-purple-200">
          <div className="mb-6">
            <p className="text-sm text-gray-600 font-semibold">EVENT NAME</p>
            <h2 className="text-2xl font-bold text-gray-900">{eventData?.name}</h2>
          </div>
          
          {eventData?.password_hash && (
            <div className="flex items-center gap-2 text-sm text-purple-700 bg-white rounded-lg p-3 mb-6">
              <Lock className="w-4 h-4" />
              <span>This event is password protected</span>
            </div>
          )}

          <p className="text-sm text-gray-600 font-semibold mb-2">EVENT LINK</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-600 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold text-gray-700"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Scan to Upload Photos</h3>
            <div
              ref={qrCodeRef}
              className="bg-white p-8 rounded-2xl border-2 border-gray-200 mb-4"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(eventUrl)}`}
                alt="QR Code"
                width={256}
                height={256}
                className="border border-gray-300"
              />
            </div>
            <button
              onClick={downloadQRCode}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </div>

          {/* Next Steps */}
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Next Steps</h3>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <div>
                  <p className="font-semibold text-gray-900">Share the QR code</p>
                  <p className="text-sm text-gray-600">Print it, display it, or send the link to your guests</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <p className="font-semibold text-gray-900">Guests scan & upload</p>
                  <p className="text-sm text-gray-600">They scan the code and upload photos from their phones</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <div>
                  <p className="font-semibold text-gray-900">View all photos</p>
                  <p className="text-sm text-gray-600">Access the gallery anytime to see all uploads</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Share Options */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Share with Guests</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={shareViaEmail}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              <Mail className="w-5 h-5" />
              Email
            </button>
            <button
              onClick={shareViaSMS}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              <MessageCircle className="w-5 h-5" />
              SMS
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              <Copy className="w-5 h-5" />
              Copy Link
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push(`/e/${slug}`)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Gallery
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push(`/promo/confirmation/${slug}/settings`)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg transition-colors"
          >
            Event Settings
          </button>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/promo/free-basic')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Promo
          </button>
        </div>
      </div>
    </div>
  );
}
