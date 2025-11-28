'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, AlertCircle, Gift, Calendar, MapPin, User, Mail } from 'lucide-react';
import { Button, TextInput } from '@/components/forms';

interface TokenValidation {
  valid: boolean;
  reason?: 'not_found' | 'already_claimed' | 'expired';
  token?: string;
  expiresAt?: string;
  claimedAt?: string;
}

export default function ClaimEventPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [validating, setValidating] = useState(true);
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    location: '',
    yourName: '',
    emailAddress: '',
  });

  // Validate token on mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);
      const response = await fetch(`/api/claim/validate-token?token=${encodeURIComponent(token)}`);
      const result = await response.json();

      if (result.success) {
        setValidation(result.data);
      } else {
        setValidation({ valid: false, reason: 'not_found' });
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setValidation({ valid: false, reason: 'not_found' });
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create free event directly (bypasses Stripe)
      const response = await fetch('/api/claim/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          location: formData.location,
          yourName: formData.yourName,
          emailAddress: formData.emailAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed error for debugging
        const errorMsg = result.details
          ? `${result.error}: ${result.details}${result.hint ? ` (${result.hint})` : ''}`
          : result.error || 'Failed to create event';
        setError(errorMsg);
        console.error('Event creation failed:', result);
        setLoading(false);
        return;
      }

      // Success - store ownership in localStorage
      console.log('✅ Free event created:', result);
      
      // Store user email for ownership verification
      localStorage.setItem('userEmail', formData.emailAddress);
      
      // Store owned event IDs
      const ownedEvents = JSON.parse(localStorage.getItem('ownedEvents') || '[]');
      if (!ownedEvents.includes(result.eventId)) {
        ownedEvents.push(result.eventId);
        localStorage.setItem('ownedEvents', JSON.stringify(ownedEvents));
      }
      
      // Redirect to event dashboard
      router.push(`/dashboard/${result.eventId}?claimed=true`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating your claim link...</p>
        </div>
      </div>
    );
  }

  // Invalid token states
  if (!validation?.valid) {
    const errorMessages: Record<string, { title: string; description: string; extra?: string }> = {
      not_found: {
        title: 'Invalid Link',
        description: 'This promotional link is invalid or does not exist.',
      },
      already_claimed: {
        title: 'Already Claimed',
        description: 'This promotional link has already been used.',
        extra: validation?.claimedAt ? `Claimed on ${new Date(validation.claimedAt).toLocaleDateString()}` : undefined,
      },
      expired: {
        title: 'Link Expired',
        description: 'This promotional link has expired.',
        extra: validation?.expiresAt ? `Expired on ${new Date(validation.expiresAt).toLocaleDateString()}` : undefined,
      },
    };

    const errorInfo = errorMessages[validation?.reason || 'not_found'];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
          <p className="text-gray-600 mb-4">{errorInfo.description}</p>
          {errorInfo.extra && (
            <p className="text-sm text-gray-500 mb-6">{errorInfo.extra}</p>
          )}
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Valid token - show event creation form
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo - matching email style */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            <Image 
              src="/purple logo/purplelogo.png" 
              alt="SnapWorxx" 
              width={80} 
              height={80}
              className="object-contain"
            />
            <div className="bg-purple-600 px-6 py-4 rounded-lg flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Your Event is Ready!
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Subtitle */}
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600 mb-2">
            Create your event gallery with unlimited uploads and storage
          </p>
          <p className="text-sm text-gray-500">
            All premium features included • No credit card required
          </p>
        </div>

        {/* Features Banner */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-600 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-purple-800 mb-4">✨ What's Included</h2>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>Unlimited photo & video uploads</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>Unlimited storage space</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>Beautiful gallery display</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>QR code sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>Download all photos as ZIP</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>30-day event duration</span>
            </li>
          </ul>
        </div>

        {/* Event Creation Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Event</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Name *
              </label>
              <TextInput
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                placeholder="Birthday Party, Wedding, Conference..."
                required
                className="w-full"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Date *
              </label>
              <TextInput
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            {/* Location (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location (Optional)
              </label>
              <TextInput
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Venue or city"
                className="w-full"
              />
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name *
              </label>
              <TextInput
                type="text"
                name="yourName"
                value={formData.yourName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <TextInput
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send your event details and dashboard link here
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {loading ? 'Creating Your Event...' : 'Claim Event →'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By claiming this event, you agree to our{' '}
              <Link href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-purple-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        {/* Footer - matching email style */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <Image 
            src="/purple logo/purplelogo.png" 
            alt="SnapWorxx" 
            width={40} 
            height={40}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500">
            © 2025 SnapWorxx. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Questions? Visit{' '}
            <Link href="/" className="text-purple-600 hover:underline">
              snapworxx.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
