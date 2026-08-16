import { FAQS } from '@/content/site'

/**
 * FAQ section (audit D1.4 — retention, participation and privacy objections
 * went completely unanswered and there was no FAQ anywhere on the site).
 *
 * Uses native <details>/<summary> so it works with JavaScript disabled and
 * stays crawlable as plain indexable text.
 */
export default function Faq() {
  return (
    <section id="faq" className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            The questions hosts actually ask
          </h2>
          <p className="text-lg text-gray-600">
            Straight answers on storage, guest uploads and privacy.
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-gray-200 border-y border-gray-200">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-gray-900">
                <h3 className="text-lg font-semibold">{item.q}</h3>
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
  )
}
