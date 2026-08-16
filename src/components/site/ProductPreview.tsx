import { QrCode } from 'lucide-react'

/**
 * Desired-result visualisation (audit D1.5 — the site showed only decorative
 * stock footage, so a visitor never saw what "winning" actually looks like:
 * a filled gallery the morning after, and the live feed while it's happening).
 *
 * The frames below are the real SnapWorxx layout rendered around real photos
 * from the public sample gallery, rather than a flat screenshot. That keeps
 * them sharp on any display, responsive at every breakpoint, and correct as
 * the UI evolves — a PNG screenshot goes stale the moment the layout changes.
 *
 * To change which photos appear, swap the entries below for any image URL from
 * the sample gallery.
 */

/** Real photos from the public sample gallery (/e/sample-event-slug/gallery). */
const GALLERY_TILES = [
  { src: '/api/img/sample-event-slug/1786907348145-joansbirthday21.jpg', alt: 'Guests laughing together at a table during a 60th birthday celebration' },
  { src: '/api/img/sample-event-slug/1786902009112-classy-wedding-couple-embrace.jpg', alt: 'A bride and groom embracing in a car after their wedding' },
  { src: '/api/img/sample-event-slug/1786907338296-joansbirthday16.jpg', alt: 'Three guests posing together at a birthday party table' },
  { src: '/api/img/sample-event-slug/1786907335071-joansbirthday14.jpg', alt: 'A group of guests photographed together at a birthday celebration' },
  { src: '/api/img/sample-event-slug/1786902041603-groom-holds-bride-s-hand-while-walking-on-cobblestone-path.jpg', alt: 'A bride and groom walking hand in hand along a cobblestone path' },
  { src: '/api/img/sample-event-slug/1786907352895-joansbirthday31.jpg', alt: 'A guest smiling with a baby at a family celebration' },
  { src: '/api/img/sample-event-slug/1786907333318-joansbirthday13.jpg', alt: 'Guests seated around a decorated table at a birthday party' },
  { src: '/api/img/sample-event-slug/1786902045853-stylish-bride-and-groom-on-old-european-street.jpg', alt: 'A bride and groom on a city street after their ceremony' },
  { src: '/api/img/sample-event-slug/1786907375839-joansbirthday99.jpg', alt: 'Two guests taking a selfie together at a birthday party' },
]

/** The three most recent arrivals, as the feed shows them mid-event. */
const FEED_TILES = [
  { src: '/api/img/sample-event-slug/1786907375839-joansbirthday99.jpg', alt: 'Two guests taking a selfie at the party' },
  { src: '/api/img/sample-event-slug/1786907349767-joansbirthday22.jpg', alt: 'Guests together at the celebration' },
  { src: '/api/img/sample-event-slug/1786907327666-joansbirthday101.jpg', alt: 'A guest photographed with a young family member' },
]

function GalleryFrame() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 truncate rounded bg-white px-3 py-1 text-xs text-gray-500">
          snapworxx.com/e/your-event/gallery
        </span>
      </div>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">Your Event</div>
            <div className="text-xs text-gray-500">All photos · newest first</div>
          </div>
          <div className="rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white">
            Download all
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GALLERY_TILES.map((tile) => (
            <img
              key={tile.src}
              src={tile.src}
              alt={tile.alt}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FeedFrame() {
  return (
    <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[2rem] border-8 border-gray-900 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-[10px] text-white">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Live
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="text-xs font-semibold text-gray-900">Live feed</div>
        {FEED_TILES.map((tile, i) => (
          <div key={tile.src} className="flex items-center gap-2">
            <img
              src={tile.src}
              alt={tile.alt}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium text-gray-700">
                A guest just added a photo
              </div>
              <div className="text-[9px] text-gray-400">
                {i === 0 ? 'just now' : i === 1 ? '1 min ago' : '2 min ago'}
              </div>
            </div>
          </div>
        ))}
        <div className="rounded-lg bg-purple-50 px-3 py-2 text-center text-[10px] font-medium text-purple-700">
          3 new photos just landed
        </div>
      </div>
    </div>
  )
}

export default function ProductPreview() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            This is what you wake up to
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Every candid, from every phone in the room, in one gallery — and a
            live feed you can watch fill up while the party is still going.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <GalleryFrame />
            <p className="mt-4 text-sm text-gray-500">
              The morning after: one gallery, full resolution, yours to download
              and keep.
            </p>
          </div>

          <div>
            <FeedFrame />
            <p className="mt-4 text-center text-sm text-gray-500">
              During the event: photos land in the live feed as guests upload
              them (Premium).
            </p>
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-3xl items-start gap-4 rounded-2xl border border-purple-100 bg-purple-50 p-6">
          <QrCode className="mt-1 h-8 w-8 shrink-0 text-purple-600" aria-hidden="true" />
          <p className="leading-relaxed text-gray-700">
            <strong className="font-semibold text-gray-900">
              What your guests see:
            </strong>{' '}
            they point a phone camera at the QR code on the table, the upload
            page opens in their browser, and they pick photos. No app, no
            signup, no account — the gap between &ldquo;scan&rdquo; and
            &ldquo;uploaded&rdquo; is one tap.
          </p>
        </div>
      </div>
    </section>
  )
}
