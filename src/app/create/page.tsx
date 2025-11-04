'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, ArrowLeft, Check } from 'lucide-react';

export default function CreateEvent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    emailAddress: '',
    yourName: '',
    discountCode: ''
  });
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountStatus, setDiscountStatus] = useState<{
    applied: boolean;
    percent: number;
    message: string;
    isAffiliate?: boolean;
  } | null>(null);

  // Check for affiliate referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        discountCode: refCode
      }));
      // Auto-validate affiliate code
      validateAffiliateCode(refCode);
    }
  }, [searchParams]);

  const validateAffiliateCode = async (code: string) => {
    try {
      const response = await fetch('/api/affiliate/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setDiscountStatus({
          applied: true,
          percent: 10, // Affiliate referrals get 10% discount
          message: `Affiliate discount applied! You get 10% off.`,
          isAffiliate: true
        });
      }
    } catch (error) {
      console.error('Error validating affiliate code:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset discount status when discount code changes manually
    if (name === 'discountCode' && !searchParams.get('ref')) {
      setDiscountStatus(null);
    }
  };

  const getDisplayPrice = () => {
    const basePrice = selectedPackage === 'premium' ? 49 : 29;
    if (discountStatus?.applied) {
      const discountedPrice = Math.round(basePrice * (1 - discountStatus.percent / 100));
      return {
        original: basePrice,
        discounted: discountedPrice,
        savings: basePrice - discountedPrice
      };
    }
    return { original: basePrice, discounted: basePrice, savings: 0 };
  };

  const validateDiscountCode = async () => {
    if (!formData.discountCode.trim()) return;

    try {
      // First try affiliate validation
      const affiliateResponse = await fetch('/api/affiliate/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: formData.discountCode.trim() }),
      });

      const affiliateResult = await affiliateResponse.json();

      if (affiliateResponse.ok && affiliateResult.valid) {
        setDiscountStatus({
          applied: true,
          percent: 10,
          message: 'Affiliate discount applied! You get 10% off.',
          isAffiliate: true
        });
        return;
      }

      // Fall back to regular discount validation
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          discountCode: formData.discountCode.trim(),
          validateOnly: true
        }),
      });

      const result = await response.json();

      if (response.ok && result.discountApplied) {
        setDiscountStatus({
          applied: true,
          percent: result.discountPercent,
          message: `${result.discountPercent}% discount applied!`,
          isAffiliate: false
        });
      } else {
        setDiscountStatus({
          applied: false,
          percent: 0,
          message: 'Invalid discount code'
        });
      }
    } catch (error) {
      console.error('Error validating discount:', error);
      setDiscountStatus({
        applied: false,
        percent: 0,
        message: 'Error validating code'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const packagePrice = getDisplayPrice().discounted * 100; // Convert to cents

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
          price: packagePrice,
          discountCode: formData.discountCode,
          isAffiliateReferral: discountStatus?.isAffiliate || false
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to create checkout session');
      }

      const { url, discountApplied, discountPercent } = result;
      
      // Update discount status if discount was applied
      if (discountApplied) {
        setDiscountStatus({
          applied: true,
          percent: discountPercent,
          message: `${discountPercent}% discount applied successfully!`,
          isAffiliate: discountStatus?.isAffiliate || false
        });
      }
      
      // Redirect to checkout (could be Stripe or mock)
      window.location.href = url;
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-6 py-8">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img 
              src="/purple logo/purplelogo.png" 
              alt="Snapworxx Logo" 
              className="h-16 md:h-20 lg:h-24 w-auto"
            />
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
            {discountStatus?.applied && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <Check className="h-4 w-4" />
                {discountStatus.message}
              </div>
            )}
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

            {/* Discount Code Section */}
            <div className="rounded-lg bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Discount Code</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Have a discount code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleInputChange}
                      placeholder="SNAP1234"
                      className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={validateDiscountCode}
                      disabled={!formData.discountCode.trim()}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Don't have one? <a href="/get-discount" className="text-purple-600 hover:text-purple-700 underline">Get a discount code here</a>
                  </p>
                </div>

                {/* Discount Status */}
                {discountStatus && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    discountStatus.applied 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-sm ${
                      discountStatus.applied ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {discountStatus.message}
                      {discountStatus.isAffiliate && discountStatus.applied && (
                        <div className="text-xs mt-1 text-green-700">
                          Thanks for using a referral link! 🎉
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              {discountStatus?.applied && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="text-center">
                    <p className="text-sm text-green-800 mb-2">
                      🎉 <strong>{discountStatus.percent}% discount applied!</strong>
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-lg text-gray-500 line-through">
                        ${getDisplayPrice().original}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ${getDisplayPrice().discounted}
                      </span>
                      <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                        Save ${getDisplayPrice().savings}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !formData.eventName.trim() || !formData.emailAddress.trim()}
                className="w-full rounded-full bg-purple-600 py-4 text-lg font-semibold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading 
                  ? 'Creating...' 
                  : `Create My Event - $${getDisplayPrice().discounted}`
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
