'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Eye, 
  Copy, 
  ExternalLink, 
  Calendar,
  CheckCircle,
  Clock,
  Share2
} from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  status: string;
  created_at: string;
  program_expires_at?: string;
}

interface Referral {
  id: string;
  event_id: string;
  customer_email: string;
  referral_code: string;
  sale_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      // For now, we'll use email-based lookup
      // In production, you'd want proper authentication
      const response = await fetch('/api/affiliate/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const result = await response.json();

      if (response.ok) {
        setAffiliate(result.affiliate);
        setReferrals(result.referrals || []);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!affiliate) return;
    
    const referralLink = `https://snapworxx.com/create?ref=${affiliate.referral_code}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getReferralStats = () => {
    const totalReferrals = referrals.length;
    const confirmedReferrals = referrals.filter(r => r.status === 'confirmed' || r.status === 'paid').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    
    return { totalReferrals, confirmedReferrals, pendingReferrals };
  };

  const getProgramStatus = () => {
    if (!affiliate?.program_expires_at) {
      return { daysRemaining: null, expirationDate: null, isExpired: false };
    }

    const expirationDate = new Date(affiliate.program_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return { 
      daysRemaining: Math.max(0, daysRemaining), 
      expirationDate: expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      isExpired 
    };
  };

  if (loading && !affiliate) {
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
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Affiliate Dashboard Login
              </h1>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your affiliate email"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !email.trim()}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loginLoading ? 'Accessing Dashboard...' : 'Access Dashboard'}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Don't have an affiliate account? 
                <Link href="/affiliate/register" className="text-purple-600 hover:text-purple-700 underline ml-1">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!affiliate) return null;

  const stats = getReferralStats();
  const referralLink = `https://snapworxx.com/create?ref=${affiliate.referral_code}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img 
                src="/purple logo/purplelogo.png" 
                alt="SnapWorxx Logo" 
                className="h-12 md:h-14 lg:h-16 w-auto"
              />
            </Link>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-900">{affiliate.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Dashboard</h1>
          <p className="text-gray-600">Track your earnings and manage your referrals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${affiliate.total_earnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${affiliate.pending_earnings.toFixed(2)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${affiliate.paid_earnings.toFixed(2)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Program Status Alert */}
        {affiliate?.program_expires_at && (
          <div className={`mt-8 rounded-lg p-6 border-2 ${getProgramStatus().isExpired ? 'bg-red-50 border-red-300' : getProgramStatus().daysRemaining! <= 14 ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-semibold mb-2 ${getProgramStatus().isExpired ? 'text-red-800' : getProgramStatus().daysRemaining! <= 14 ? 'text-yellow-800' : 'text-green-800'}`}>
                  {getProgramStatus().isExpired ? '⏰ Program Expired' : getProgramStatus().daysRemaining! <= 14 ? '⏰ Program Expiring Soon' : '✅ Program Active'}
                </h3>
                <p className={`text-sm ${getProgramStatus().isExpired ? 'text-red-700' : getProgramStatus().daysRemaining! <= 14 ? 'text-yellow-700' : 'text-green-700'}`}>
                  {getProgramStatus().isExpired 
                    ? `Your 90-day affiliate program ended on ${getProgramStatus().expirationDate}. You can still track and receive payments for earned commissions, but cannot generate new referrals.`
                    : `Your 90-day program expires on ${getProgramStatus().expirationDate}. ${getProgramStatus().daysRemaining} days remaining.`
                  }
                </p>
              </div>
              <Calendar className={`h-8 w-8 flex-shrink-0 ${getProgramStatus().isExpired ? 'text-red-600' : getProgramStatus().daysRemaining! <= 14 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
          </div>
        )}

        {/* Launch Program Information */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">🚀 SnapWorxx Launch Affiliate Program</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">60% Commission</div>
              <p className="text-purple-100">Exclusive launch rate on all referrals</p>
            </div>
            <div>
              <div className="font-semibold mb-1">90-Day Duration</div>
              <p className="text-purple-100">Limited-time program from registration</p>
            </div>
            <div>
              <div className="font-semibold mb-1">10% Customer Discount</div>
              <p className="text-purple-100">Your referrals get 10% off first event</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-400 text-xs text-purple-100">
            <strong>Note:</strong> This is a limited-time launch initiative available only for 90 days from registration. 
            After your 90-day window closes, you can still track earnings but cannot generate new referrals.
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Referral Tools */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {affiliate.referral_code}
                  </div>
                  <p className="text-sm text-purple-700">
                    {affiliate.commission_rate}% commission on each sale
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Referral Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copySuccess && (
                    <p className="text-sm text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>

                <a
                  href={referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Test Your Link
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confirmed Sales</span>
                  <span className="font-semibold">{stats.confirmedReferrals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Sales</span>
                  <span className="font-semibold">{stats.pendingReferrals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">
                    {stats.totalReferrals > 0 
                      ? Math.round((stats.confirmedReferrals / stats.totalReferrals) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Referral History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Referrals</h3>
              </div>
              
              <div className="p-6">
                {referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No referrals yet</p>
                    <p className="text-sm text-gray-500">
                      Share your referral link to start earning commissions!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {referral.customer_email}
                            </p>
                            <p className="text-sm text-gray-600">
                              Sale: ${referral.sale_amount.toFixed(2)} • 
                              Commission: ${referral.commission_amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              referral.status === 'confirmed' || referral.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : referral.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {referral.status === 'confirmed' ? 'Confirmed' : 
                               referral.status === 'pending' ? 'Pending' : 
                               referral.status === 'paid' ? 'Paid' : referral.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}