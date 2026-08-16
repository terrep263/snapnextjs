import type { Metadata } from 'next'
import SiteHeader from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import PricingSection from '@/components/site/Pricing'
import Faq from '@/components/site/Faq'
import { ProductJsonLd, FaqJsonLd } from '@/components/site/JsonLd'
import { SCOPE_HONESTY } from '@/content/site'

export const metadata: Metadata = {
  title: 'Pricing — $29 or $49, one time, per event',
  description:
    'SnapWorxx pricing: Basic $29 and Premium $49, paid once per event. Unlimited guest uploads, QR code and link, 30–90 days of storage, full-resolution download yours to keep. No subscription and no auto-renewal.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProductJsonLd />
      <FaqJsonLd />
      <SiteHeader />

      <section className="bg-white pb-4 pt-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            One price, one event. That&rsquo;s the whole pricing page.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            You pay once, before the event. There is no subscription, no
            auto-renewal, no per-guest fee and no card kept on file for later.
          </p>
        </div>
      </section>

      <PricingSection heading={false} />

      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              What the two tiers actually change
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500">
                    <th className="py-3 pr-4 font-semibold">&nbsp;</th>
                    <th className="py-3 pr-4 font-semibold">Basic $29</th>
                    <th className="py-3 font-semibold">Premium $49</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {[
                    ['Guest uploads', 'Unlimited', 'Unlimited'],
                    ['QR code + upload link', 'Yes', 'Yes'],
                    ['Gallery stays live', '30 days', '90 days'],
                    ['Live feed during the event', 'No', 'Yes'],
                    ['Password on the gallery', 'No', 'Yes'],
                    ['Download everything at once', 'No', 'Yes'],
                    ['Full-resolution files yours to keep', 'Yes', 'Yes'],
                  ].map(([label, basic, premium]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium">{label}</td>
                      <td className="py-3 pr-4">{basic}</td>
                      <td className="py-3">{premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 leading-relaxed text-gray-600">
              {SCOPE_HONESTY}
            </p>
          </div>
        </div>
      </section>

      <Faq />
      <SiteFooter />
    </div>
  )
}
