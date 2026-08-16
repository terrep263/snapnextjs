import Link from 'next/link'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import PricingSection from './Pricing'
import { CustomFaqJsonLd, ProductJsonLd } from './JsonLd'
import { FREE_EVENT_PATH } from '@/content/site'

/**
 * Shared layout for the /vs comparison pages (audit D5.3 and action plan item
 * 12 — the site had no comparison pages at all, and both spotlight competitors
 * run comparison content).
 *
 * Competitor facts here come from the third-party category audit, not from our
 * own testing. Every page carries the "check before you decide" line so the
 * comparison stays honest as their pricing moves.
 */

export interface VsRow {
  label: string
  us: string
  them: string
}

export interface VsContent {
  competitor: string
  slug: string
  h1: string
  intro: string
  /** Honest summary of when the competitor is the better pick. */
  whenThemBetter: string[]
  /** Where SnapWorxx genuinely wins. */
  whenUsBetter: string[]
  rows: VsRow[]
  faqs: { q: string; a: string }[]
}

export default function VsPage({ content }: { content: VsContent }) {
  return (
    <div className="min-h-screen bg-white">
      <ProductJsonLd />
      <CustomFaqJsonLd faqs={content.faqs} />
      <SiteHeader />

      <section className="bg-white pb-10 pt-16">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            {content.h1}
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-600">{content.intro}</p>
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

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">
            Side by side
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-sm uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-4 font-semibold">&nbsp;</th>
                  <th className="px-5 py-4 font-semibold text-purple-700">SnapWorxx</th>
                  <th className="px-5 py-4 font-semibold">{content.competitor}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {content.rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 font-medium text-gray-900">{row.label}</td>
                    <td className="px-5 py-4">{row.us}</td>
                    <td className="px-5 py-4">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {content.competitor} details are taken from a third-party audit of
            this category, not from our own account with them. Pricing and
            features change — check their site before you decide.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Pick SnapWorxx when
              </h2>
              <ul className="space-y-3 text-gray-700">
                {content.whenUsBetter.map((item) => (
                  <li key={item} className="leading-relaxed">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Pick {content.competitor} when
              </h2>
              <ul className="space-y-3 text-gray-700">
                {content.whenThemBetter.map((item) => (
                  <li key={item} className="leading-relaxed">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="bg-white py-20">
        <div className="container mx-auto max-w-3xl px-6">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            SnapWorxx vs {content.competitor}: common questions
          </h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {content.faqs.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <h3 className="text-lg font-semibold text-gray-900">{item.q}</h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-2xl font-light text-purple-600 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 pr-10 leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
