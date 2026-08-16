import type { Metadata } from 'next'
import Link from 'next/link'
import { QrCode, Upload, Download, Shield, Clock, Zap } from 'lucide-react'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import ProductPreview from '@/components/site/ProductPreview'
import Faq from '@/components/site/Faq'
import { FaqJsonLd } from '@/components/site/JsonLd'
import { FREE_EVENT_PATH } from '@/content/site'

export const metadata: Metadata = {
  title: 'How it works — QR code guest photo sharing, step by step',
  description:
    'How SnapWorxx works: buy an event, get a QR code and upload link instantly, print the code for the tables, and guests upload photos and video from their phone browser. No app, no signup, full-resolution download for the host.',
  alternates: { canonical: '/features' },
}

const STEPS = [
  {
    n: 1,
    title: 'You buy the event',
    body: 'Basic or Premium, one time. Nothing recurring, nothing per guest.',
  },
  {
    n: 2,
    title: 'Your QR code and link arrive immediately',
    body: 'The second the payment clears you get a QR code you can print and a link you can text or drop in the invite. There is no setup call and no waiting.',
  },
  {
    n: 3,
    title: 'You put the code where people already look',
    body: 'The tables, the bar, the program, the exit. This placement is the single biggest thing that decides whether guests actually upload — a code on one table at the back gets scanned by the people at that table.',
  },
  {
    n: 4,
    title: 'Guests scan and upload',
    body: 'A phone camera pointed at the code opens the upload page in the browser. No app store, no account, no password for guests. They pick photos and video and they are done.',
  },
  {
    n: 5,
    title: 'You watch it fill up (Premium)',
    body: 'The live feed shows uploads landing while the event is still going, so you can see it working instead of hoping.',
  },
  {
    n: 6,
    title: 'You download everything and keep it',
    body: 'Bulk download gives you the whole set in full resolution. Once those files are on your drive they are permanent — no watermark, no expiry, no account needed to open them later.',
  },
]

const FEATURES = [
  {
    icon: QrCode,
    title: 'QR code + shareable link',
    body: 'Print it, project it, or text it. Both routes land on the same upload page.',
  },
  {
    icon: Upload,
    title: 'Unlimited photo and video uploads',
    body: 'No cap on how many files your guests add, and video is treated the same as photos.',
  },
  {
    icon: Zap,
    title: 'Live feed (Premium)',
    body: 'Uploads appear in real time during the event.',
  },
  {
    icon: Shield,
    title: 'Password protection (Premium)',
    body: 'Lock the gallery so only the people you give the password to can open it.',
  },
  {
    icon: Clock,
    title: '30–90 days of storage',
    body: '30 days on Basic, 90 on Premium. We email the host before the window closes.',
  },
  {
    icon: Download,
    title: 'Bulk download in full resolution (Premium)',
    body: 'The entire event in one download, at the resolution guests shot it.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <FaqJsonLd />
      <SiteHeader />

      <section className="bg-white pb-10 pt-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            How SnapWorxx works, start to finish
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Six steps, none of which involve your guests downloading anything.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/create"
              className="rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-purple-700"
            >
              Create My Event
            </Link>
            <Link
              href={FREE_EVENT_PATH}
              className="rounded-full border-2 border-purple-600 px-8 py-4 text-lg font-semibold text-purple-700 transition-all hover:bg-purple-50"
            >
              Try one event free
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl space-y-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xl font-bold text-white">
                  {step.n}
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-bold text-gray-900">{step.title}</h2>
                  <p className="leading-relaxed text-gray-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductPreview />

      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            What is included
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100">
                  <feature.icon className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Faq />
      <SiteFooter />
    </div>
  )
}
