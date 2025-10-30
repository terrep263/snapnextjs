import Link from 'next/link'
import { Camera, QrCode, Upload, Download, Shield, Clock, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Camera className="h-10 w-10 text-white" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-xl font-bold tracking-wide">SNAPWORXX</div>
              <div className="text-[10px] tracking-widest opacity-90">PHOTOGRAPHY</div>
            </div>
          </div>

          {/* Create Event Button */}
          <Link 
            href="/create"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-purple-600 shadow-lg transition-all hover:shadow-xl hover:scale-105"
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
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <h1 className="mb-6 text-5xl md:text-7xl font-bold leading-tight">
            Every Moment Captured.<br />
            Every Memory<br />
            Preserved.
          </h1>
          <p className="mb-10 text-lg md:text-xl max-w-3xl mx-auto font-light">
            Use a simple QR code to collect all photos and videos taken by guests at<br />
            your event, so you never miss a single memory.
          </p>
          <Link
            href="/create"
            className="inline-block rounded-full bg-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:bg-purple-700 hover:scale-105"
          >
            Create My Event
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get your event photo sharing set up in minutes
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Your Package</h3>
              <p className="text-gray-600">
                Select Basic or Premium based on your event needs
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Setup</h3>
              <p className="text-gray-600">
                Get your custom QR code and upload link immediately after payment
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Share with Guests</h3>
              <p className="text-gray-600">
                Display the QR code at your event or share the link
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collect & Download</h3>
              <p className="text-gray-600">
                All photos upload automatically. Download everything when ready
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
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features to make photo sharing effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <QrCode className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">QR Code Access</h3>
              <p className="text-gray-600">
                Guests scan and upload photos instantly without downloading any apps
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Unlimited Uploads</h3>
              <p className="text-gray-600">
                No limits on the number of photos and videos your guests can share
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Download</h3>
              <p className="text-gray-600">
                Download all photos at once in full resolution when your event ends
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Password Protection</h3>
              <p className="text-gray-600">
                Premium events include optional password protection for privacy
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Extended Storage</h3>
              <p className="text-gray-600">
                Keep your memories safe with 30-90 days of secure cloud storage
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live Photo Feed</h3>
              <p className="text-gray-600">
                Premium includes live feed so you can see uploads in real-time
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
              One-time payment. No subscriptions.
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
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
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
              <div className="text-xs tracking-widest opacity-80">PHOTOGRAPHY</div>
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
