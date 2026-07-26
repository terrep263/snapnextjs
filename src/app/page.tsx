import Link from 'next/link'
import { Camera, QrCode, Upload, Download, Shield, Clock, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/purple logo/whitelogo.png" 
              alt="Snapworxx Logo" 
              className="h-20 md:h-24 lg:h-28 w-auto"
            />
          </div>

          {/* Create Event Button - Purple Style */}
          <Link
            href="/create"
            className="rounded-full bg-purple-600 px-8 py-3 text-lg font-semibold text-white shadow-2xl transition-all hover:bg-purple-700 hover:scale-105"
          >
            Create My Event
          </Link>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/12526894_720_1280_30fps.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white mt-16">
          {/* White Logo Above Text */}
          <div className="mb-8">
            <img 
              src="/purple logo/whitelogo.png" 
              alt="Snapworxx Logo" 
              className="h-32 md:h-40 lg:h-48 w-auto mx-auto"
            />
          </div>
          
          <h1 className="mb-6 text-5xl md:text-7xl font-bold leading-tight">
            Never Miss<br />
            The Moments
          </h1>
          <p className="mb-6 text-lg md:text-xl max-w-3xl mx-auto font-light">
            SnapWorxx helps you capture every moment &mdash; in the moment. Not after.<br />
            Not when somebody finally gets around to sending it. While it&rsquo;s happening.
          </p>
          <p className="text-sm md:text-base tracking-wide opacity-80">
            Live in minutes &middot; Nothing to download &middot; Everyone gets the photos
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              In The Moment. Not After.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The candle goes out. The ball clears the fence. Two seconds, and it&rsquo;s over.
              Everyone in the room is already holding a phone &mdash; SnapWorxx puts what they
              catch in one place while it&rsquo;s still happening.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-purple-600">1</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Set Up Your Event</h3>
              <p className="text-gray-600">
                Basic or Premium. One payment, one event.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Your Code</h3>
              <p className="text-gray-600">
                Your QR code and gallery link are live the moment you pay.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                    <QrCode className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Put It Where People Are</h3>
              <p className="text-gray-600">
                On the table, in the program, in the group text. Guests point their phone and they&rsquo;re in.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                    <Download className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-purple-600">4</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Everyone Gets Them</h3>
              <p className="text-gray-600">
                Photos land as they&rsquo;re taken. Keep them all &mdash; and share them back with everyone who was there.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What You Get
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everyone who was there. Every angle. Everything they saw &mdash; not just the
              handful that made it to the group chat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <QrCode className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No App. No Signup.</h3>
              <p className="text-gray-600">
                Guests point their phone at the code and start adding. Nothing to download, nothing to remember later.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Every Angle</h3>
              <p className="text-gray-600">
                No limits. Every photo and video, from every person in the room.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Yours To Keep</h3>
              <p className="text-gray-600">
                Download the whole gallery in full resolution. One click, and it&rsquo;s permanent.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Only Your People</h3>
              <p className="text-gray-600">
                Premium galleries lock behind a password, so what happened stays with the people it belongs to.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Room To Breathe</h3>
              <p className="text-gray-600">
                30 to 90 days of secure storage, so you don&rsquo;t have to sort through anything the next morning.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Watch It Happen</h3>
              <p className="text-gray-600">
                Premium shows photos appearing live, while the event is still going.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-gray-600">
              You get one shot at the moment. One event, one price. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Event */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Event</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Unlimited uploads</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">QR code + upload link</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">30-day storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Instant setup</span>
                </li>
              </ul>
              <Link
                href="/create?plan=basic"
                className="block w-full text-center rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Event */}
            <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden" style={{backgroundColor: '#5d1ba6'}}>
              <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium Event</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-purple-200 ml-2">one-time</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Everything in Basic</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Feed view enabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Password protection</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">90-day storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Bulk download</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Instant setup</span>
                </li>
              </ul>
              <Link
                href="/create?plan=premium"
                className="block w-full text-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-md transition-all hover:shadow-lg hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="h-8 w-8" />
            <div>
              <div className="text-lg font-bold">SNAPWORXX</div>
              <div className="text-xs tracking-widest opacity-80">NEVER MISS THE MOMENTS</div>
            </div>
          </div>
          <p className="text-purple-200 text-sm">
            © 2025 SnapWorxx. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
