'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';

interface Setting {
  enabled: boolean;
}

interface Settings {
  promo_enabled?: Setting;
  affiliate_enabled?: Setting;
  stripe_payments_enabled?: Setting;
  email_notifications_enabled?: Setting;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>('');
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      const data = await res.json();

      if (!data.authenticated) {
        router.push('/admin/login');
        return;
      }

      setCurrentUser(data.email);
      loadSettings();
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/admin/login');
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await res.json();
      setSettings(data.settings || {});
      setLoading(false);
    } catch (err) {
      console.error('Load settings error:', err);
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const toggleSetting = async (settingKey: string) => {
    setSaving(settingKey);
    setError('');
    setSuccess('');

    const currentValue = (settings as any)[settingKey] || { enabled: false };
    const newValue = { enabled: !currentValue.enabled };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey,
          settingValue: newValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update setting');
        setSaving(null);
        return;
      }

      setSettings({
        ...settings,
        [settingKey]: newValue,
      });

      setSuccess(`${settingKey.replace(/_/g, ' ')} updated!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Server error');
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const featureToggles = [
    {
      key: 'promo_enabled',
      name: 'Free Promo System',
      description: 'Allow users to create free promotional events',
      icon: '🎉',
    },
    {
      key: 'affiliate_enabled',
      name: 'Affiliate Program',
      description: 'Enable affiliate system for partner commissions',
      icon: '🤝',
    },
    {
      key: 'stripe_payments_enabled',
      name: 'Stripe Payments',
      description: 'Enable paid events with Stripe payment processing',
      icon: '💳',
    },
    {
      key: 'email_notifications_enabled',
      name: 'Email Notifications',
      description: 'Send email notifications to users and admins',
      icon: '📧',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1">
      <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image 
            src="/purple logo/purplelogo.png" 
            alt="SnapWorxx Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-gray-700 hover:text-purple-600 font-semibold text-sm transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Feature Settings</h1>
          <p className="text-gray-600">Manage system features and capabilities. Logged in as: <span className="font-semibold text-gray-900">{currentUser}</span></p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Feature Toggles */}
        <div className="grid gap-4 mb-8">
          {featureToggles.map((feature) => {
            const isEnabled = (settings as any)[feature.key]?.enabled || false;
            const isSaving = saving === feature.key;

            return (
              <div
                key={feature.key}
                className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      isEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>

                  <button
                    onClick={() => toggleSetting(feature.key)}
                    disabled={isSaving}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      isEnabled
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-300 hover:bg-gray-400'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ℹ️ About Feature Toggles</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>
              <strong>🎉 Free Promo System:</strong> Users can create free promotional events with limited photos
            </li>
            <li>
              <strong>🤝 Affiliate Program:</strong> Partners can register and earn commissions on referrals
            </li>
            <li>
              <strong>💳 Stripe Payments:</strong> Users can purchase paid event plans with credit cards
            </li>
            <li>
              <strong>📧 Email Notifications:</strong> System sends transactional emails (password resets, confirmations, etc.)
            </li>
          </ul>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
