
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Users, Clock, Share2, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';

export default function FreeBasicPromoPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [eventPassword, setEventPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const promoEnabled = process.env.NEXT_PUBLIC_PROMO_FREE_BASIC_ENABLED === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/create-promo-free-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, eventDate, email, ownerName, eventPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Store event data in sessionStorage for confirmation page
      sessionStorage.setItem(`promo_event_${data.slug}`, JSON.stringify({
        name: data.name,
        email: data.email,
        password_hash: data.password_hash,
        slug: data.slug
      }));

      router.push(`/promo/confirmation/${data.slug}`);
    } catch (err) {
      console.error(err);
      setError('Server error');
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('claim-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!promoEnabled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Promotion Not Active</h2>
          <p className="text-gray-600">This promotion is not currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation/Branding */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapworxx logo (1).png" alt="Snapworxx" className="w-6 h-6 md:w-8 md:h-8" />
            <span className="text-sm md:text-lg font-bold text-gray-900">Snapworxx</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-xs md:text-sm text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#faq" className="text-xs md:text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            <button onClick={scrollToForm} className="text-xs md:text-sm bg-purple-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-purple-700">
              Claim your event
            </button>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white pt-8 md:pt-16 pb-8 md:pb-12 px-3 md:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6 text-xs md:text-sm font-medium">
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
            Limited-Time Offer
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Your next event is on us.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
            Get one free Snapworxx Basic event (normally $29). Perfect for birthdays, games, parties, and moments you never want to miss.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
              <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">$0</div>
              <div className="text-xs md:text-sm text-gray-600">Free Event</div>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
              <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">∞</div>
              <div className="text-xs md:text-sm text-gray-600">All Photos</div>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
              <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">QR</div>
              <div className="text-xs md:text-sm text-gray-600">Easy Share</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 lg:px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {/* Left: Marketing Content */}
          <div className="md:col-span-1 space-y-4 md:space-y-6">
            {/* What You Get */}
            <div className="bg-purple-50 rounded-2xl p-4 md:p-6 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">What you get:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-gray-700">Shared photo gallery</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-gray-700">Guest uploads via QR code</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-gray-700">30 days of access</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-gray-700">No credit card required</span>
                </li>
              </ul>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6" id="how-it-works">
              <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">3 steps to success:</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">1</span>
                  <span className="text-xs md:text-sm text-gray-600"><strong>Create</strong> your event</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">2</span>
                  <span className="text-xs md:text-sm text-gray-600"><strong>Share</strong> QR code</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">3</span>
                  <span className="text-xs md:text-sm text-gray-600"><strong>Collect</strong> all photos</span>
                </li>
              </ol>
            </div>

            {/* Use Cases */}
            <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Perfect for:</h4>
              <div className="space-y-2 text-xs md:text-sm text-gray-600">
                <p>✓ Birthdays and anniversaries</p>
                <p>✓ Kids' sports and tournaments</p>
                <p>✓ Family reunions and holidays</p>
                <p>✓ Team parties and class events</p>
              </div>
            </div>
          </div>

          {/* Center: Form */}
          <div className="md:col-span-2" id="claim-form">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Claim your free event</h2>
              <p className="text-sm md:text-base text-gray-600 mb-6">One Snapworxx Basic event (normally $29) at no cost.</p>

              {error && (
                <div className="mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs md:text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="grid md:grid-cols-2 gap-3 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Your Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Event Name *</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    required
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="e.g., Sarah's Birthday Party"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-3 h-3 md:w-4 md:h-4" />
                    Event Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={eventPassword}
                    onChange={e => setEventPassword(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="Leave blank for no password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Guests will need this password to access the gallery</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 md:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {loading ? 'Creating your event...' : (
                    <>
                      Create Free Event
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  One free Basic event per email. Your event stays active for 30 days.
                </p>
              </form>
            </div>

            {/* Share Section */}
            <div className="mt-6 md:mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-4 md:p-8 text-white">
              <div className="flex items-start gap-3 md:gap-4">
                <Share2 className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5 md:mt-1" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">Know someone planning an event?</h3>
                  <p className="mb-3 md:mb-4 text-sm md:text-base opacity-90">Share this link so they can claim their own free Snapworxx Basic event while the promo is active.</p>
                  <p className="text-xs md:text-sm opacity-75">Each person can claim one free event. Spread the word!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-4 md:p-8 mb-12 border border-gray-200" id="faq">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Is this really free?</h4>
              <p className="text-gray-600 text-xs md:text-sm">Yes. One full Snapworxx Basic event (normally $29) at no cost. No credit card required.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">What happens after 30 days?</h4>
              <p className="text-gray-600 text-xs md:text-sm">Your event stays active forever. You just won't be able to create new free events after the promo ends.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Can I share this with friends?</h4>
              <p className="text-gray-600 text-xs md:text-sm">Absolutely! Each person can claim one free event while the promo is active.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Can I upgrade later?</h4>
              <p className="text-gray-600 text-xs md:text-sm">Yes. If you love your Basic event, you can upgrade to Premium for advanced features.</p>
            </div>
          </div>
        </div>

        {/* Why Snapworxx */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Why Snapworxx?</h2>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Zero Setup</h3>
              <p className="text-gray-600 text-xs md:text-sm">No app to download, no accounts to create. Just a QR code and everyone starts uploading.</p>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">Everyone Captures</h3>
              <p className="text-gray-600 text-xs md:text-sm">Turn every guest into a photographer. You get every angle, every moment, every perspective.</p>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">One Place</h3>
              <p className="text-gray-600 text-xs md:text-sm">Stop hunting through texts and group chats. All photos in one shared gallery you can actually find.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center py-6 md:py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">Don't miss out</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto">This is a limited-time offer. Claim your free Snapworxx Basic event before the promo ends.</p>
          <button onClick={scrollToForm} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base">
            Get Your Free Event
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12 py-6 md:py-8 px-3 md:px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-xs md:text-sm">
          <p>© 2025 Snapworxx. Never miss the moments.</p>
        </div>
      </div>
    </div>
  );
}
