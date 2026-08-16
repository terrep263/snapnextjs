import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PricingSection from '@/components/site/Pricing'
import ProductPreview from '@/components/site/ProductPreview'
import Faq from '@/components/site/Faq'
import { FaqJsonLd, ProductJsonLd } from '@/components/site/JsonLd'
import { OCCASIONS, FREE_EVENT_PATH } from '@/content/site'

/**
 * Occasion landing pages (audit D1.3 and action plan item 13 — the real wedge
 * visible in the sitemap, faith/community and milestone events, never reached
 * the generic hero).
 */

const DETAIL: Record<
  string,
  {
    title: string
    description: string
    intro: string
    beats: { h: string; p: string }[]
  }
> = {
  weddings: {
    title: 'Wedding QR Photo Gallery — every guest photo in one place',
    description:
      'A QR code guest photo gallery for weddings. Guests scan the code on the table and upload the candids your photographer did not get — no app, no signup. $29 or $49, one time.',
    intro:
      'Your photographer gets the ceremony, the portraits and the first dance. Your guests get everything in between — and right now most of that ends up scattered across four group chats and never reaches you.',
    beats: [
      {
        h: 'Relive the day through everyone else’s eyes',
        p: 'The table your parents were at. The ten minutes you were signing paperwork. The dance floor at 11pm. Those are the photos couples say they wish they had, and they already exist — they are just on other people’s phones.',
      },
      {
        h: 'Nothing for your guests to download',
        p: 'A wedding crowd spans four generations. Asking your aunt to install an app on the day is how you get a 20% upload rate. A phone camera pointed at a QR code opens the upload page in the browser — that is the whole ask.',
      },
      {
        h: 'Put the code where people already look',
        p: 'Print it for the table numbers, the bar, the program and the photo booth. Placement is the single biggest thing that decides whether guests actually upload.',
      },
      {
        h: 'The full-resolution set is yours to keep',
        p: 'Download everything at once at the resolution guests shot it. Once those files are on your drive they do not expire with the gallery.',
      },
    ],
  },
  birthdays: {
    title: 'Birthday & Milestone Photo Sharing — one QR code, every phone',
    description:
      'Collect every photo and video from a birthday, graduation, anniversary or milestone party with one QR code. Guests scan and upload from their phone — no app, no signup. $29 or $49, one time.',
    intro:
      'The candle goes out, forty phones go up, and by the next morning the photos are spread across four group chats, two people who never post, and one cousin who swears they will send them later.',
    beats: [
      {
        h: 'Keep the whole night, not just the group chat',
        p: 'One code on the table collects every angle from every person in the room, while the party is still happening.',
      },
      {
        h: 'Nobody has to be chased',
        p: 'No "can you send me that one?" texts a week later. Guests upload in the moment because it takes one tap, not an app install.',
      },
      {
        h: 'Watch it fill up live',
        p: 'Premium shows uploads landing in real time — put the live feed on a TV and the room turns into the slideshow.',
      },
      {
        h: 'One price, one night',
        p: 'No subscription and no per-guest fee. You pay once for the event and download everything in full resolution afterwards.',
      },
    ],
  },
  'church-and-community': {
    title: 'Church & Community Event Photo Sharing — collect and share it back',
    description:
      'A QR code photo gallery for pastoral appreciations, homecomings, banquets, youth days and community events. Everyone who was there can add photos, and everyone who was there can have the whole set back.',
    intro:
      'Pastoral appreciations, homecomings, banquets, youth days, community days. Everyone brings a phone, and afterwards one person ends up with a folder nobody else can get to.',
    beats: [
      {
        h: 'Share it back with the whole congregation',
        p: 'The job is not just collecting photos — it is getting them back out to everyone who was there. One link does both directions.',
      },
      {
        h: 'Nobody gets stuck sorting it',
        p: 'No Facebook album, no volunteer spending their Monday night collating photos from six people. Uploads land in one gallery as they happen.',
      },
      {
        h: 'It works for a room that is not tech-heavy',
        p: 'No app, no account, no password for guests. If someone can point a phone camera at a code taped to a table, they can contribute.',
      },
      {
        h: 'Group funds, one clear price',
        p: 'A single one-time charge of $29 or $49 for the whole event — easy to put on a form and easy to justify to whoever signs off on it.',
      },
    ],
  },
}

export function generateStaticParams() {
  return OCCASIONS.map((o) => ({ occasion: o.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ occasion: string }>
}): Promise<Metadata> {
  const { occasion } = await params
  const detail = DETAIL[occasion]
  if (!detail) return {}
  return {
    title: detail.title,
    description: detail.description,
    alternates: { canonical: `/occasions/${occasion}` },
  }
}

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ occasion: string }>
}) {
  const { occasion } = await params
  const meta = OCCASIONS.find((o) => o.slug === occasion)
  const detail = DETAIL[occasion]
  if (!meta || !detail) notFound()

  return (
    <div className="min-h-screen bg-white">
      <ProductJsonLd />
      <FaqJsonLd />
      <SiteHeader />

      <section className="bg-white pb-10 pt-16">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-600">
            {meta.label}
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            {meta.headline}
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-600">{detail.intro}</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/create"
              className="rounded-full bg-purple-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg transition-all hover:bg-purple-700"
            >
              Create My Event
            </Link>
            <Link
              href={FREE_EVENT_PATH}
              className="rounded-full border-2 border-purple-600 px-8 py-4 text-center text-lg font-semibold text-purple-700 transition-all hover:bg-purple-50"
            >
              Try one event free
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="space-y-10">
            {detail.beats.map((beat) => (
              <div key={beat.h}>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{beat.h}</h2>
                <p className="leading-relaxed text-gray-700">{beat.p}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 rounded-2xl border border-purple-100 bg-purple-50 p-6 leading-relaxed text-gray-700">
            <strong className="font-semibold text-gray-900">The job:</strong>{' '}
            {meta.job}
          </p>
        </div>
      </section>

      <ProductPreview />
      <PricingSection />
      <Faq />

      <section className="bg-white pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Other occasions
          </h2>
          <ul className="space-y-2">
            {OCCASIONS.filter((o) => o.slug !== occasion).map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/occasions/${o.slug}`}
                  className="text-purple-700 underline underline-offset-4"
                >
                  {o.label} — {o.headline}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
