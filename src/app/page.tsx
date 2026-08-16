import Link from 'next/link'
import { Camera, QrCode, Upload, Download, Shield, Clock, Zap } from 'lucide-react'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import Pricing from '@/components/site/Pricing'
import Faq from '@/components/site/Faq'
import ProductPreview from '@/components/site/ProductPreview'
import SocialProof, { getEventCount } from '@/components/site/SocialProof'
import { OrganizationJsonLd, ProductJsonLd, FaqJsonLd } from '@/components/site/JsonLd'
import { OCCASIONS, FREE_EVENT_PATH, SCOPE_HONESTY } from '@/content/site'

// The live event count is read from Supabase; refresh it hourly.
export const revalidate = 3600

export default async function Home() {
  const eventCount = await getEventCount()

  return (
    <div className="min-h-screen bg-white">
      <OrganizationJsonLd />
      <ProductJsonLd />
      <FaqJsonLd />

      <SiteHeader transparent />

      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/hero-poster"
            aria-hidden="true"
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
          <div className="mb-6">
            <img
              src="/purple logo/whitelogo.png"
              alt="SnapWorxx"
              className="h-24 md:h-32 lg:h-36 w-auto mx-auto"
            />
          </div>

          {/*
            The locked tagline stays, moved to the eyebrow slot. The h1 below now
            names the category and the ICP so a cold visitor can confirm fit in
            five seconds without reading the subhead (audit D1.1, D2.1).
          */}
          <p className="mb-4 text-2xl md:text-4xl font-bold tracking-tight text-white">
            Never Miss The Moments
          </p>

          <h1 className="mb-6 text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl mx-auto">
            Every guest&rsquo;s photos from your wedding, birthday or
            celebration &mdash; one QR code, no app.
          </h1>

          <p className="mb-6 text-lg md:text-xl max-w-3xl mx-auto font-light">
            SnapWorxx helps you capture every moment &mdash; in the moment. Not after.
            Not when somebody finally gets around to sending it. While it&rsquo;s happening.
          </p>

          <p className="mb-8 text-sm md:text-base tracking-wide opacity-80">
            Live in minutes &middot; Nothing to download &middot; Everyone gets the photos
          </p>

          {/* Primary buy path, plus a real free path for the not-ready visitor (D2.2) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:bg-purple-700"
            >
              Create My Event
            </Link>
            <Link
              href={FREE_EVENT_PATH}
              className="rounded-full border-2 border-white/70 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
            >
              Try one event free
            </Link>
          </div>
          <p className="mt-4 text-sm opacity-80">No card. One free event per email.</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
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
            {[
              {
                icon: Camera,
                title: 'Set Up Your Event',
                body: 'Basic or Premium. One payment, one event.',
              },
              {
                icon: Zap,
                title: 'Get Your Code',
                body: 'Your QR code and gallery link are live the moment you pay.',
              },
              {
                icon: QrCode,
                title: 'Put It Where People Are',
                body:
                  'On the table, in the program, in the group text. Guests point their phone and they’re in — and that placement is what decides whether they actually upload.',
              },
              {
                icon: Download,
                title: 'Everyone Gets Them',
                body:
                  'Photos land as they’re taken. Keep them all — and share them back with everyone who was there.',
              },
            ].map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                      <step.icon className="h-10 w-10 text-white" aria-hidden="true" />
                    </div>
                    <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                      <span className="text-2xl font-bold text-purple-600">{i + 1}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What the finished thing actually looks like (D1.5) */}
      <ProductPreview />

      {/* Occasion positioning — the wedge the sitemap already proves (D1.3) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for the night it only happens once
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Same QR code, different room. Pick the one that sounds like yours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {OCCASIONS.map((occasion) => (
              <Link
                key={occasion.slug}
                href={`/occasions/${occasion.slug}`}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-purple-600">
                  {occasion.label}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{occasion.headline}</h3>
                <p className="text-gray-600 leading-relaxed">{occasion.blurb}</p>
                <span className="mt-4 inline-block font-semibold text-purple-700">
                  See how it works for {occasion.label.toLowerCase()} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof — renders nothing until there is something real to show (D3.1, D3.2) */}
      <SocialProof eventCount={eventCount} />

      {/* Everything You Need Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What You Get
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everyone who was there. Every angle. Every candid your photographer
              didn&rsquo;t get &mdash; not just the handful that made it to the group chat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: QrCode,
                title: 'No App. No Signup.',
                body:
                  'Guests point their phone at the code and start adding. Nothing to download, nothing to remember later.',
              },
              {
                icon: Upload,
                title: 'Every Angle',
                body: 'No limits. Every photo and video, from every person in the room.',
              },
              {
                icon: Download,
                title: 'Yours To Keep',
                body:
                  'Download the whole gallery in full resolution. One click, and it’s permanent — those files don’t expire with the gallery.',
              },
              {
                icon: Shield,
                title: 'Only Your People',
                body:
                  'Premium galleries lock behind a password, so what happened stays with the people it belongs to.',
              },
              {
                icon: Clock,
                title: 'Room To Breathe',
                body:
                  '30 to 90 days of secure storage, and we email you before the window closes so nothing is lost.',
              },
              {
                icon: Zap,
                title: 'Watch It Happen',
                body:
                  'Premium shows photos appearing live, while the event is still going.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-16 w-16 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      <Faq />

      {/* Scope honesty — who this is not for (D2.B) */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6">
          <p className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center leading-relaxed text-gray-600">
            {SCOPE_HONESTY}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
