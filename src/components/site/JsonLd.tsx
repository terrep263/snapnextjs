import { SITE, PLANS, FAQS } from '@/content/site'

/**
 * Structured data (audit D5.5 — Organization, Product/Offer and FAQ schema
 * were all absent, so AI assistants and rich results had no machine-readable
 * price or product data to read).
 */

function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is generated from local constants only — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLd() {
  return (
    <Script
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE.name,
        legalName: SITE.company,
        url: SITE.url,
        logo: `${SITE.url}/purple logo/purplelogo.png`,
        email: SITE.supportEmail,
        description:
          'SnapWorxx is a QR code guest photo gallery for weddings, birthdays and community events. Guests scan a code and upload photos and video from their phone — no app, no signup.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Orlando',
          addressRegion: 'FL',
          addressCountry: 'US',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: SITE.supportEmail,
          availableLanguage: 'English',
        },
      }}
    />
  )
}

export function ProductJsonLd() {
  return (
    <Script
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'SnapWorxx QR Guest Photo Gallery',
        description:
          'A one-time-priced QR code photo gallery for a single event. Guests scan a QR code and upload photos and video from their phone browser — no app download and no account. The host downloads the full-resolution set.',
        brand: { '@type': 'Brand', name: SITE.name },
        url: SITE.url,
        image: `${SITE.url}/og-image.png`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: Math.min(...PLANS.map((p) => p.price)),
          highPrice: Math.max(...PLANS.map((p) => p.price)),
          offerCount: PLANS.length,
          offers: PLANS.map((plan) => ({
            '@type': 'Offer',
            name: plan.name,
            price: plan.price,
            priceCurrency: 'USD',
            url: `${SITE.url}${plan.href}`,
            availability: 'https://schema.org/InStock',
            // One-time purchase per event — no recurring charge.
            category: 'one-time purchase',
          })),
        },
      }}
    />
  )
}

export function FaqJsonLd() {
  return (
    <Script
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }}
    />
  )
}

/** FAQ schema for pages that carry their own question set (e.g. /vs pages). */
export function CustomFaqJsonLd({
  faqs,
}: {
  faqs: ReadonlyArray<{ q: string; a: string }>
}) {
  return (
    <Script
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }}
    />
  )
}
