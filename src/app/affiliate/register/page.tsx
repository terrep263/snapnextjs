'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function AffiliateRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [affiliateData, setAffiliateData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setAffiliateData(result.affiliate);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/purple logo/purplelogo.png" 
                alt="SnapWorxx Logo" 
                className="h-12 md:h-14 lg:h-16 w-auto"
              />
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to SnapWorxx Affiliates! 🎉
              </h1>
              <p className="text-gray-600 mb-6">
                Your affiliate account has been created successfully!
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Your Affiliate Code</h3>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {affiliateData?.referral_code}
                </div>
                <p className="text-sm text-purple-700">
                  Share this code to earn 20% commission on every referral!
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-green-50 p-4 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-900">20% Commission</div>
                  <div className="text-green-700">On every sale</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-blue-900">Customer Discount</div>
                  <div className="text-blue-700">10% off for referrals</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-purple-900">Monthly Payouts</div>
                  <div className="text-purple-700">Via PayPal</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  <strong>Next steps:</strong> Check your email for your affiliate welcome package 
                  with marketing materials and detailed instructions.
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/affiliate/dashboard"
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    href="/create"
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Create Event
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center">
            <img 
              src="/purple logo/purplelogo.png" 
              alt="SnapWorxx Logo" 
              className="h-12 md:h-14 lg:h-16 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join SnapWorxx Affiliates
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Earn 20% commission by referring customers to SnapWorxx
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join hundreds of content creators, event planners, and photographers 
              earning passive income by sharing SnapWorxx with their audience.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join Our Program?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">High Commission Rate</h3>
                    <p className="text-gray-600">
                      Earn 20% commission on every successful referral. With our $29-49 packages, 
                      that's $5.80-9.80 per sale.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Win-Win for Everyone</h3>
                    <p className="text-gray-600">
                      Your referrals get 10% off their first event, making it easy to convert 
                      your audience while you earn.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Growing Market</h3>
                    <p className="text-gray-600">
                      Events are happening every day. From weddings to birthdays, corporate events 
                      to family gatherings - huge opportunity for recurring income.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">💰 Top Affiliate Earnings</h3>
                  <p className="text-purple-100">
                    Our best affiliates earn $500-2000+ per month by sharing SnapWorxx 
                    with event planners, photographers, and their social networks.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="text-center mb-6">
                <UserPlus className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Start Earning Today
                </h2>
                <p className="text-gray-600">
                  Join our affiliate program in under 2 minutes
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Sarah Johnson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="sarah@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.email.trim()}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Creating Account...' : 'Join Affiliate Program'}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-4 text-center">
                By joining, you agree to our affiliate terms and conditions. 
                We'll send you a welcome email with your unique referral code.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}