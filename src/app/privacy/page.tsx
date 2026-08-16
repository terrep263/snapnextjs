import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { SITE } from '@/content/site'

/**
 * Plain-language privacy statement (audit D3.4 — the site stored guests'
 * personal photos with no privacy or data-handling statement anywhere, which a
 * buyer weighs at the moment of purchase).
 *
 * TODO (Vincent): this describes what the product actually does today and is
 * written to be true, not to be legal boilerplate. Before a big push, have
 * counsel review it and add any state/GDPR-specific language you need.
 */

export const metadata: Metadata = {
  title: 'Privacy — what happens to your photos',
  description:
    'What SnapWorxx does with your event photos: your own gallery link, optional password protection, 30–90 day storage windows, no selling, no licensing, no AI training, and deletion on request.',
  alternates: { canonical: '/privacy' },
}

const LAST_UPDATED = 'August 16, 2026'

const SECTIONS = [
  {
    h: 'The short version',
    p: [
      'Your gallery lives at its own link, which is not browsable from anywhere on this site. We do not sell your photos, license them to anyone, or use them to train AI models. When your storage window ends the files come off our servers. Ask us to delete an event sooner and we delete it.',
    ],
  },
  {
    h: 'Who can see your gallery',
    p: [
      'Every event gallery has its own link. Nothing on this site links to it and there is no directory of galleries — someone has to be given the link or scan your QR code to get in.',
      'Premium events can also be locked behind a password you set. With a password on, the link alone is not enough to open the gallery.',
      'You are the one who decides who gets the link and the QR code. If you print the code and put it on a public table, anyone at that event can upload and view.',
    ],
  },
  {
    h: 'How long we keep the photos',
    p: [
      'Basic events stay live for 30 days. Premium events stay live for 90 days. We email the host before the window closes.',
      'When the window ends the gallery link stops working and the files are removed from our storage. Anything you downloaded before then is unaffected — those files are on your device and are yours permanently.',
    ],
  },
  {
    h: 'What we never do',
    p: [
      'We do not sell your photos or videos. We do not license them to stock libraries, advertisers or anyone else. We do not use them to train AI models. We do not put them on our own marketing pages unless you specifically tell us in writing that we may.',
    ],
  },
  {
    h: 'What we collect besides photos',
    p: [
      'From hosts: the email address and event details you enter when you create an event, so we can send you the gallery link, the QR code and the storage reminder.',
      'From guests: nothing beyond the files they choose to upload. Guests do not create accounts and are not asked for an email address.',
      'Payments are handled by Stripe. Card numbers go to Stripe directly and never touch our servers — we only ever see whether a payment succeeded.',
    ],
  },
  {
    h: 'Who processes data for us',
    p: [
      'Supabase for database and file storage. Stripe for payments. An email provider for the transactional emails that carry your gallery link and reminders. Each of these is a processor acting on our instructions, not a party we sell data to.',
    ],
  },
  {
    h: 'Deleting an event',
    p: [
      'Email us from the address you used to create the event and we will delete the gallery and its files. If a guest wants a specific photo of themselves removed, the host can remove it from the gallery, or email us and we will.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="mb-3 text-4xl font-bold text-gray-900 md:text-5xl">
            What happens to your photos
          </h1>
          <p className="mb-12 text-sm text-gray-500">Last updated {LAST_UPDATED}</p>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.h}>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{section.h}</h2>
                {section.p.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mb-4 leading-relaxed text-gray-700"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <p className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 leading-relaxed text-gray-700">
            Questions about any of this? Email{' '}
            <a href={`mailto:${SITE.supportEmail}`} className="text-purple-700 underline">
              {SITE.supportEmail}
            </a>{' '}
            or use the{' '}
            <Link href="/contact" className="text-purple-700 underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
