import Link from 'next/link'
import { Check, Lock, ShieldCheck } from 'lucide-react'
import {
  PLANS,
  CHECKOUT_TRUST_LINE,
  FREE_EVENT_PATH,
  FREE_OFFER_SUMMARY,
  SAMPLE_GALLERY_PATH,
} from '@/content/site'

/**
 * Pricing section.
 *
 * Fixes four audit findings:
 *  - D4.3: each tier now carries value-anchor copy near the price
 *          ("One night, one price", "Less than a single hour of a wedding
 *          photographer") instead of a bare number.
 *  - D3.4: a payment/privacy trust line sits directly under both CTAs.
 *  - D2.2/D4.2: the free event path sits beside the buy buttons for visitors
 *          who are not ready, with the sample gallery as a look-only fallback.
 */
export default function Pricing({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        {heading && (
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Simple Pricing
            </h2>
            <p className="text-lg text-gray-600">
              One-time payment per event. No subscription, no auto-renewal, no
              card kept on file.
            </p>
          </div>
        )}

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {PLANS.map((plan) => {
            const premium = plan.popular
            return (
              <div
                key={plan.id}
                className={
                  premium
                    ? 'relative overflow-hidden rounded-3xl p-8 shadow-2xl'
                    : 'rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-lg'
                }
                style={premium ? { backgroundColor: '#5d1ba6' } : undefined}
              >
                {premium && (
                  <div className="absolute right-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-purple-900">
                    Most Popular
                  </div>
                )}

                <h3
                  className={`mb-2 text-2xl font-bold ${
                    premium ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>

                <div className="mb-2">
                  <span
                    className={`text-5xl font-bold ${
                      premium ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    ${plan.price}
                  </span>
                  <span className={`ml-2 ${premium ? 'text-purple-200' : 'text-gray-600'}`}>
                    one-time
                  </span>
                </div>

                {/* Value anchor (D4.3) */}
                <p
                  className={`mb-6 text-sm leading-relaxed ${
                    premium ? 'text-purple-100' : 'text-gray-600'
                  }`}
                >
                  {plan.anchor}
                </p>

                <ul className="mb-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 h-6 w-6 flex-shrink-0 ${
                          premium ? 'text-white' : 'text-purple-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={premium ? 'text-white' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={
                    premium
                      ? 'block w-full rounded-full bg-white px-8 py-4 text-center text-lg font-semibold text-purple-600 shadow-md transition-all hover:shadow-lg'
                      : 'block w-full rounded-full bg-purple-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg'
                  }
                >
                  Get Started
                </Link>

                {/* Transactional trust, at the moment of purchase (D3.4) */}
                <p
                  className={`mt-4 flex items-start gap-2 text-xs leading-relaxed ${
                    premium ? 'text-purple-100' : 'text-gray-500'
                  }`}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{CHECKOUT_TRUST_LINE}</span>
                </p>
              </div>
            )
          })}
        </div>

        {/* Free path for the not-ready visitor (D2.2, D4.2) */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-3xl border-2 border-dashed border-purple-300 bg-white p-8 text-center">
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              Or start with a free event
            </h3>
            <p className="mb-6 text-gray-600">{FREE_OFFER_SUMMARY}</p>
            <Link
              href={FREE_EVENT_PATH}
              className="inline-block rounded-full border-2 border-purple-600 px-8 py-4 text-lg font-semibold text-purple-700 transition-all hover:bg-purple-50"
            >
              Try one event free
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Same product your guests would use. Upgrade later if you want the
              live feed, a password or bulk download.
            </p>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Rather just look first?{' '}
            <Link
              href={SAMPLE_GALLERY_PATH}
              className="font-semibold text-purple-700 underline underline-offset-4 hover:text-purple-900"
            >
              Open a real sample gallery
            </Link>
            .
          </p>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>
              Read how we handle your photos in our{' '}
              <Link href="/privacy" className="underline hover:text-gray-700">
                privacy statement
              </Link>
              .
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
