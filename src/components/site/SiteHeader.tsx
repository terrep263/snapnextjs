import Link from 'next/link'

/**
 * Marketing site header (audit D2.4 / D4.1 — the site previously had no
 * navigation at all, so pricing was reachable only by scrolling).
 *
 * `transparent` is used over the homepage hero video; every other page gets
 * the solid variant.
 */
export default function SiteHeader({
  transparent = false,
}: {
  transparent?: boolean
}) {
  const links = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/features', label: 'How it works' },
    { href: '/about', label: 'About' },
  ]

  return (
    <header
      className={
        transparent
          ? 'absolute top-0 left-0 right-0 z-50 px-6 py-6'
          : 'sticky top-0 z-50 border-b border-gray-200 bg-white px-6 py-4'
      }
    >
      <div className="container mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label="SnapWorxx home">
          <img
            src={transparent ? '/purple logo/whitelogo.png' : '/purple logo/purplelogo.png'}
            alt="SnapWorxx — QR guest photo galleries for weddings and events"
            className={transparent ? 'h-16 md:h-20 lg:h-24 w-auto' : 'h-10 md:h-12 w-auto'}
          />
        </Link>

        <nav
          aria-label="Main"
          className={`hidden items-center gap-8 text-base font-medium md:flex ${
            transparent ? 'text-white' : 'text-gray-700'
          }`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Mobile nav: pricing is the one link that must always be one tap away */}
          <Link
            href="/pricing"
            className={`text-base font-medium md:hidden ${
              transparent ? 'text-white' : 'text-gray-700'
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/create"
            className="rounded-full bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-purple-700 md:px-8 md:text-lg"
          >
            Create My Event
          </Link>
        </div>
      </div>
    </header>
  )
}
