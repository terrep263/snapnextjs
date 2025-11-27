'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
        setError(result.error || 'Failed to create event');
        setLoading(false);
        return;
      }

      // Success - redirect to event dashboard
      console.log('✅ Free event created:', result);
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
    const errorMessages = {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Claim Your Free Event! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Create your event gallery with unlimited uploads and storage
          </p>
          <p className="text-sm text-gray-500">
            All premium features included • No credit card required
          </p>
        </div>

        {/* Features Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold mb-4">What You Get (Free!) ✨</h2>
          <ul className="grid md:grid-cols-2 gap-3 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Unlimited photo & video uploads</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Unlimited storage space</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>All premium features</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>QR code sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Beautiful gallery display</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Bulk download ZIP</span>
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
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating Your Event...' : 'Claim Free Event →'}
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

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <Link href="/" className="text-purple-600 hover:underline font-semibold">
              SnapWorxx
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
