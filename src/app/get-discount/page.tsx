'use client';

import { useState } from 'react';
import { Mail, Gift, CheckCircle, AlertCircle } from 'lucide-react';

export default function GetDiscountPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/discount-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Check your email for your SnapWorxx discount code!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SnapWorxx</span>
            </a>
            <div className="flex gap-4">
              <a href="/create" className="text-gray-600 hover:text-purple-600 transition-colors">
                Create Event
              </a>
              <a href="/" className="text-gray-600 hover:text-purple-600 transition-colors">
                Home
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Get Your SnapWorxx Discount Code
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Planning your own event? Enter your email below to receive an exclusive discount code for your first SnapWorxx event. 
              Start collecting memories with your friends and family for less!
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Events</h3>
              <p className="text-gray-600 text-sm">Create your event in minutes and share with guests</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile Friendly</h3>
              <p className="text-gray-600 text-sm">Optimized for smartphone uploads and sharing</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Great Value</h3>
              <p className="text-gray-600 text-sm">Affordable pricing with exclusive discounts</p>
            </div>
          </div>

          {/* Email Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            {status === 'success' ? (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">Check Your Email!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm">
                    💡 <strong>Next steps:</strong> Check your inbox (and spam folder) for your discount code, 
                    then head to our event creation page to start planning your event with savings!
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setMessage('');
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Request Another Code
                  </button>
                  <a
                    href="/create"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Create Event Now
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Mail className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Enter Your Email for Instant Discount
                  </h2>
                  <p className="text-gray-600">
                    We'll send you a personalized discount code that you can use at checkout
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-800 text-sm">{message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </span>
                    ) : (
                      'Get My Discount Code'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting, you agree to receive promotional emails from SnapWorxx. 
                    You can unsubscribe at any time.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Choose SnapWorxx?</h3>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
              <p className="text-lg mb-4">
                <strong>Powered by SnapWorxx</strong> - Never miss the moments that matter
              </p>
              <p className="text-purple-100">
                Join thousands of event hosts who trust SnapWorxx to capture and share their most precious memories. 
                From weddings to birthdays, corporate events to family gatherings - we make memory collection effortless.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold">SnapWorxx</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Powered by SnapWorxx - Never miss the moments
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
            <a href="/create" className="text-gray-400 hover:text-white transition-colors">Create Event</a>
            <a href="/get-discount" className="text-gray-400 hover:text-white transition-colors">Get Discount</a>
          </div>
        </div>
      </footer>
    </div>
  );
}