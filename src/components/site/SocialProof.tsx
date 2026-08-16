import { testimonials } from '@/content/testimonials'

/**
 * Social-proof band (audit D3.1 Quantity proof 0/4 and D3.2 Story proof 0/5).
 *
 * Two independent halves, each of which hides itself when it has nothing real
 * to show — the page never ships an invented number or an invented quote:
 *
 *  1. Event counter — a live count of active events read from Supabase.
 *     Hidden when the count can't be read or is zero.
 *  2. Host quotes — read from src/content/testimonials.ts. That file ships
 *     empty on purpose; fill it with real hosts and this half turns on.
 */

/** Reads the real number of active events. Returns null if unavailable. */
export async function getEventCount(): Promise<number | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { count, error } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    if (error || typeof count !== 'number') return null
    return count
  } catch {
    return null
  }
}

/** Rounds down to a clean, defensible floor: 43 -> 40, 128 -> 100. */
function floorToMilestone(n: number): number {
  if (n < 10) return n
  if (n < 100) return Math.floor(n / 10) * 10
  if (n < 1000) return Math.floor(n / 100) * 100
  return Math.floor(n / 1000) * 1000
}

export default function SocialProof({ eventCount }: { eventCount: number | null }) {
  const showCount = typeof eventCount === 'number' && eventCount > 0
  const showQuotes = testimonials.length > 0

  if (!showCount && !showQuotes) return null

  const milestone = showCount ? floorToMilestone(eventCount as number) : 0

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        {showCount && (
          <div className="mb-14 text-center">
            <p className="text-5xl font-bold text-purple-600 md:text-6xl">
              {milestone.toLocaleString('en-US')}
              {milestone < (eventCount as number) ? '+' : ''}
            </p>
            <p className="mt-3 text-lg text-gray-600">
              events captured on SnapWorxx — weddings, birthdays, graduations,
              church and community days.
            </p>
          </div>
        )}

        {showQuotes && (
          <>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                Hosts who stopped chasing the group chat
              </h2>
              <p className="text-lg text-gray-600">
                Real hosts, real events, in their own words.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={`${t.name}-${t.occasion}`}
                  className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                  <blockquote className="text-lg leading-relaxed text-gray-800">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-4">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={`${t.name}, ${t.occasion}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700"
                      >
                        {t.name.trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.occasion}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
