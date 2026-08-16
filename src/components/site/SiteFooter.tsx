import Link from 'next/link'
import { Camera } from 'lucide-react'
import { FOUNDER, SITE, SCOPE_HONESTY } from '@/content/site'

/**
 * Marketing site footer.
 *
 * Carries three things the audit flagged as missing:
 *  - real internal links to every page in the sitemap (D2.4, D5.3)
 *  - a founder byline with a face (D3.3)
 *  - the scope-honesty line: who this is NOT for (D2.B)
 */
export default function SiteFooter() {
  const initial = FOUNDER.name.trim().charAt(0).toUpperCase()

  return (
    <footer className="bg-purple-900 text-white">
      <div className="container mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Camera className="h-8 w-8" aria-hidden="true" />
              <div>
                <div className="text-lg font-bold">SNAPWORXX</div>
                <div className="text-xs tracking-widest opacity-80">
                  GUEST PHOTO GALLERIES
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-purple-200">
              One QR code. Every guest&rsquo;s photos from your event, in one
              gallery, with nothing to download.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Product
            </h2>
            <ul className="space-y-2 text-sm text-purple-100">
              <li><Link href="/free" className="hover:text-white">Try one event free</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/features" className="hover:text-white">How it works</Link></li>
              <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/create" className="hover:text-white">Create my event</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Occasions
            </h2>
            <ul className="space-y-2 text-sm text-purple-100">
              <li><Link href="/occasions/weddings" className="hover:text-white">Weddings</Link></li>
              <li><Link href="/occasions/birthdays" className="hover:text-white">Birthdays &amp; milestones</Link></li>
              <li><Link href="/occasions/church-and-community" className="hover:text-white">Church &amp; community</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Compare &amp; contact
            </h2>
            <ul className="space-y-2 text-sm text-purple-100">
              <li><Link href="/vs/snapworxx-vs-pix-wedding" className="hover:text-white">SnapWorxx vs Pix Wedding</Link></li>
              <li><Link href="/vs/snapworxx-vs-guestpix" className="hover:text-white">SnapWorxx vs GuestPix</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy &amp; your photos</Link></li>
            </ul>
          </div>
        </div>

        {/* Scope honesty — who this is not for (D2.B) */}
        <p className="mt-12 border-t border-purple-800 pt-8 text-sm leading-relaxed text-purple-200">
          {SCOPE_HONESTY}
        </p>

        {/* Founder byline (D3.3) */}
        <div className="mt-8 flex flex-col items-start gap-4 border-t border-purple-800 pt-8 sm:flex-row sm:items-center">
          {FOUNDER.photo ? (
            <img
              src={FOUNDER.photo}
              alt={`${FOUNDER.name}, founder of SnapWorxx`}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-xl font-bold text-white"
            >
              {initial}
            </div>
          )}
          <p className="text-sm leading-relaxed text-purple-100">
            Built and run by {FOUNDER.name} — {FOUNDER.location}.{' '}
            <Link href="/about" className="underline hover:text-white">
              Read why I built this
            </Link>
            , or email me at{' '}
            <a href={`mailto:${SITE.supportEmail}`} className="underline hover:text-white">
              {SITE.supportEmail}
            </a>
            .
          </p>
        </div>

        <p className="mt-8 text-sm text-purple-300">
          © {new Date().getFullYear()} SnapWorxx. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
