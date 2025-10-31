'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, ArrowLeft, Check } from 'lucide-react';

export default function CreateEvent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    emailAddress: '',
    yourName: ''
  });
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const packagePrice = selectedPackage === 'premium' ? 4900 : 2900; // $49 or $29 in cents
      
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          emailAddress: formData.emailAddress,
          yourName: formData.yourName,
          package: selectedPackage,
          price: packagePrice
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to create checkout session');
      }

      const { url } = result;
      
      // Redirect to checkout (could be Stripe or mock)
      window.location.href = url;
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SnapWorxx</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Create Your Event
            </h1>
            <p className="text-gray-600">
              Set up your photo sharing in under 2 minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Details Section */}
            <div className="rounded-lg bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Event Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    placeholder="Sarah & John's Wedding"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Event Date
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    placeholder="sarah@example.com"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your event link and QR code will be sent here
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="yourName"
                    value={formData.yourName}
                    onChange={handleInputChange}
                    placeholder="Sarah Smith"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Package Selection */}
            <div className="rounded-lg bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Choose Your Package</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Package */}
                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    selectedPackage === 'basic'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage('basic')}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Basic Package</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$29</span>
                        <span className="text-gray-500"> one time</span>
                      </div>
                    </div>
                    {selectedPackage === 'basic' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Unlimited uploads</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">QR code + upload link</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">30-day storage</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Event setup included</span>
                    </li>
                  </ul>
                </div>

                {/* Premium Package */}
                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    selectedPackage === 'premium'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage('premium')}
                >
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Premium Package</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$49</span>
                        <span className="text-gray-500"> one time</span>
                      </div>
                    </div>
                    {selectedPackage === 'premium' && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Everything in Basic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Text view enabled</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Password protection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">90-day storage</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Bulk download</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-800">{error}</p>
                {error.includes('Stripe') && (
                  <p className="mt-2 text-xs text-red-600">
                    Note: This is a development environment. In production, make sure to configure your Stripe API keys.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading || !formData.eventName.trim() || !formData.emailAddress.trim()}
                className="w-full rounded-full bg-purple-600 py-4 text-lg font-semibold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading 
                  ? 'Creating...' 
                  : `Create My Event - $${selectedPackage === 'premium' ? '49' : '29'}`
                }
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Secure payment powered by Stripe
                {process.env.NODE_ENV === 'development' && (
                  <span className="block text-xs text-orange-600">
                    (Development mode - mock checkout will be used)
                  </span>
                )}
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
