import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { OrganizationJsonLd } from '@/components/site/JsonLd'
import { FOUNDER, SITE, SCOPE_HONESTY } from '@/content/site'

export const metadata: Metadata = {
  title: 'About — who builds SnapWorxx',
  description:
    'SnapWorxx is built and run by Terre Polite in Orlando, Florida. Who we are, why we built a QR guest photo gallery for weddings and events, and how to reach a human.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  const initial = FOUNDER.name.trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-white">
      <OrganizationJsonLd />
      <SiteHeader />

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="mb-10 text-4xl font-bold text-gray-900 md:text-5xl">
            Why I built SnapWorxx
          </h1>

          <div className="mb-10 flex flex-col items-start gap-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center">
            {FOUNDER.photo ? (
              <img
                src={FOUNDER.photo}
                alt={`${FOUNDER.name}, founder of SnapWorxx`}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold text-white"
              >
                {initial}
              </div>
            )}
            <div>
              <div className="text-xl font-bold text-gray-900">{FOUNDER.name}</div>
              <div className="text-gray-600">{FOUNDER.title}</div>
              <div className="text-sm text-gray-500">{FOUNDER.location}</div>
              {(FOUNDER.linkedin || FOUNDER.x) && (
                <div className="mt-2 flex gap-4 text-sm">
                  {FOUNDER.linkedin && (
                    <a
                      href={FOUNDER.linkedin}
                      className="font-medium text-purple-700 underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      LinkedIn
                    </a>
                  )}
                  {FOUNDER.x && (
                    <a
                      href={FOUNDER.x}
                      className="font-medium text-purple-700 underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      X
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 text-lg leading-relaxed text-gray-700">
            {FOUNDER.story.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <h2 className="mb-4 mt-14 text-2xl font-bold text-gray-900">
            What we will and will not do with your photos
          </h2>
          <p className="mb-4 leading-relaxed text-gray-700">
            Your gallery lives at its own link, with no directory and nothing on
            this site pointing at it. We do not sell your photos, license them,
            or use them to train anything. Ask us to delete an event and we
            delete it. The longer version is on the{' '}
            <Link href="/privacy" className="text-purple-700 underline">
              privacy page
            </Link>
            .
          </p>

          <h2 className="mb-4 mt-14 text-2xl font-bold text-gray-900">
            Who SnapWorxx is not for
          </h2>
          <p className="leading-relaxed text-gray-700">{SCOPE_HONESTY}</p>

          <h2 className="mb-4 mt-14 text-2xl font-bold text-gray-900">
            Reach a human
          </h2>
          <p className="leading-relaxed text-gray-700">
            Email{' '}
            <a href={`mailto:${SITE.supportEmail}`} className="text-purple-700 underline">
              {SITE.supportEmail}
            </a>{' '}
            and you get me, not a ticket queue. If something is wrong with your
            event, say so before the day — that is the fastest fix there is.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/create"
              className="rounded-full bg-purple-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition-all hover:bg-purple-700"
            >
              Create My Event
            </Link>
            <Link
              href="/contact"
              className="rounded-full border-2 border-purple-600 px-8 py-4 text-center text-lg font-semibold text-purple-700 transition-all hover:bg-purple-50"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
