import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Clock, HelpCircle } from 'lucide-react'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { SITE, FOUNDER } from '@/content/site'

export const metadata: Metadata = {
  title: 'Contact — reach a human at SnapWorxx',
  description:
    'Email SnapWorxx directly. Questions about an event you already booked, storage windows, downloads, or whether SnapWorxx fits your event — a person answers.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Talk to a person
          </h1>
          <p className="mb-12 text-lg leading-relaxed text-gray-600">
            There is no support bot here. Email goes to {FOUNDER.name} and the
            small team behind SnapWorxx.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <Mail className="mt-1 h-6 w-6 shrink-0 text-purple-600" aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">Email</h2>
                <a
                  href={`mailto:${SITE.supportEmail}`}
                  className="text-purple-700 underline"
                >
                  {SITE.supportEmail}
                </a>
                <p className="mt-2 text-gray-600">
                  Best for: anything about an event you already booked —
                  downloads, storage windows, a QR code that is not scanning, a
                  guest who cannot upload.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <Clock className="mt-1 h-6 w-6 shrink-0 text-purple-600" aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">
                  If your event is in the next 48 hours
                </h2>
                <p className="text-gray-600">
                  Put the event date in the subject line. Time-sensitive event
                  problems get answered first.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <HelpCircle className="mt-1 h-6 w-6 shrink-0 text-purple-600" aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">
                  Before you email
                </h2>
                <p className="text-gray-600">
                  Storage windows, guest participation and privacy are all
                  answered on the{' '}
                  <Link href="/#faq" className="text-purple-700 underline">
                    FAQ
                  </Link>
                  . If the answer is not there, email us and we will add it.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/create"
              className="inline-block rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-purple-700"
            >
              Create My Event
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
