import Link from 'next/link'
import { QrCode, Download, Shield, Check, Clock, Smartphone, Zap, Users, Camera } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Image src="/snapworxx logo (1) copy.png" alt="SnapWorxx" width={192} height={48} className="h-12 w-auto" />
            </div>
            <Link
              href="/create"
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
            >
              Create My Event
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://ik.imagekit.io/wuvdhuyuq/12526894_720_1280_30fps.mp4?updatedAt=1761092264961" type="video/mp4" />
          </video>
          {/* Dark Overlay for logo visibility */}
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Image src="/snapworxx logo (1).png" alt="SnapWorxx" width={256} height={144} className="h-28 sm:h-32 lg:h-36 w-auto drop-shadow-2xl" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Every Moment Captured.<br />
              Every Memory<br />
              Preserved.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Use a simple QR code to collect all photos and videos taken by guests at your event, so you never miss a single memory.
            </p>

            {/* CTA Button */}
            <Link
              href="/create"
              className="inline-block text-white px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 bg-primary hover:bg-primary-dark"
            >
              Create My Event
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Get your event photo sharing set up in minutes
          </p>
          <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
            {[
              {
                number: '1',
                icon: Smartphone,
                title: 'Choose Your Package',
                description: 'Select Basic or Premium based on your event needs',
              },
              {
                number: '2',
                icon: Zap,
                title: 'Instant Setup',
                description: 'Get your custom QR code and upload link immediately after payment',
              },
              {
                number: '3',
                icon: Users,
                title: 'Share with Guests',
                description: 'Display the QR code at your event or share the link',
              },
              {
                number: '4',
                icon: Download,
                title: 'Collect & Download',
                description: 'All photos upload automatically. Download everything when ready',
              },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                    {step.number}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4">Everything You Need</h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Powerful features to make photo sharing effortless
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR Code Access',
                description: 'Guests scan and upload photos instantly without downloading any apps',
              },
              {
                icon: Camera,
                title: 'Unlimited Uploads',
                description: 'No limits on the number of photos and videos your guests can share',
              },
              {
                icon: Download,
                title: 'Easy Download',
                description: 'Download all photos at once in full resolution when your event ends',
              },
              {
                icon: Shield,
                title: 'Password Protection',
                description: 'Premium events include optional password protection for privacy',
              },
              {
                icon: Clock,
                title: 'Extended Storage',
                description: 'Keep your memories safe with 30-90 days of secure cloud storage',
              },
              {
                icon: Zap,
                title: 'Live Photo Feed',
                description: 'Premium includes live photo feed so you can see uploads in real-time',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 text-center mb-4">Simple Pricing</h2>
          <p className="text-xl text-gray-600 text-center mb-16">One-time payment. No subscriptions.</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Basic Package */}
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 transition-all hover:shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Event</h3>
              <div className="mb-6">
                <span className="text-6xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600 ml-2 text-lg">one-time</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">Unlimited uploads</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">QR code + upload link</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">30-day storage</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">Instant setup</span>
                </li>
              </ul>
              <Link
                href="/create?package=basic"
                className="block w-full bg-primary hover:bg-primary-dark text-white text-center px-6 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Package */}
            <div className="bg-primary text-white rounded-3xl p-8 relative shadow-2xl transform hover:scale-105 transition-transform">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium Event</h3>
              <div className="mb-6">
                <span className="text-6xl font-bold">$49</span>
                <span className="ml-2 text-lg text-white/80">one-time</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>Feed view enabled</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>Password protection</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>90-day storage</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>Bulk download</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span>Instant setup</span>
                </li>
              </ul>
              <Link
                href="/create?package=premium"
                className="block w-full bg-white hover:bg-gray-50 text-primary text-center px-6 py-4 rounded-full font-bold transition-all shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image src="/snapworxx logo (1) copy.png" alt="SnapWorxx" width={160} height={40} className="h-10 w-auto" />
            </div>
            <p className="text-white/80">© 2025 SnapWorxx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
