import { QrCode } from 'lucide-react'

/**
 * Desired-result visualisation (audit D1.5 — the site showed only decorative
 * stock footage, so a visitor never saw what "winning" actually looks like:
 * a filled gallery the morning after, and the live feed while it's happening).
 *
 * ============================================================================
 * ACTION REQUIRED (Vincent)
 * ============================================================================
 * The two frames below are UI mockups drawn in markup — they show the real
 * SnapWorxx layout but not real photos, because only you can produce a real
 * screenshot of a filled gallery.
 *
 * To swap in real screenshots, drop the files in /public/product/ and set:
 *   GALLERY_SHOT  = '/product/gallery.png'    (the grid, morning after)
 *   FEED_SHOT     = '/product/live-feed.png'  (the live feed, mid-event)
 * The mockups disappear automatically once these are set.
 * ============================================================================
 */
const GALLERY_SHOT: string | null = null
const FEED_SHOT: string | null = null

/** Neutral placeholder tiles — deliberately abstract, never fake photos. */
const TILE_TONES = [
  'from-purple-200 to-purple-300',
  'from-amber-100 to-amber-200',
  'from-slate-200 to-slate-300',
  'from-rose-100 to-rose-200',
  'from-purple-100 to-purple-200',
  'from-sky-100 to-sky-200',
  'from-stone-200 to-stone-300',
  'from-emerald-100 to-emerald-200',
  'from-violet-200 to-violet-300',
]

function GalleryMockup() {
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
          {TILE_TONES.map((tone, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg bg-gradient-to-br ${tone}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FeedMockup() {
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
        {TILE_TONES.slice(0, 3).map((tone, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br ${tone}`} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 h-2 w-3/4 rounded bg-gray-200" />
              <div className="h-2 w-1/2 rounded bg-gray-100" />
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
            {GALLERY_SHOT ? (
              <img
                src={GALLERY_SHOT}
                alt="A filled SnapWorxx gallery the morning after an event, showing guest photos in a grid with a download-all button"
                className="w-full rounded-2xl border border-gray-200 shadow-xl"
              />
            ) : (
              <GalleryMockup />
            )}
            <p className="mt-4 text-sm text-gray-500">
              The morning after: one gallery, full resolution, yours to download
              and keep.
            </p>
          </div>

          <div>
            {FEED_SHOT ? (
              <img
                src={FEED_SHOT}
                alt="The SnapWorxx live feed on a phone, showing guest photos arriving during the event"
                className="mx-auto w-full max-w-[260px] rounded-[2rem] shadow-2xl"
              />
            ) : (
              <FeedMockup />
            )}
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
