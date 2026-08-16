/**
 * Real host testimonials (audit D3.2 — Story proof, currently 0/5).
 *
 * ============================================================================
 * ACTION REQUIRED (Vincent)
 * ============================================================================
 * This array is intentionally EMPTY. The social-proof band on the homepage
 * renders nothing while it is empty, so the site never ships invented quotes,
 * stock faces or fake names.
 *
 * To turn the section on, collect 4–6 real hosts (the sitemap already holds
 * ~40 real events to source from — weddings, birthdays, pastoral
 * appreciations) and fill in the entries below. The audit asks for:
 *
 *   first name + photo + occasion + outcome quote
 *
 * A good outcome quote sounds like the host, not like marketing. The audit's
 * own example:
 *   "We got every dance-floor candid our photographer missed."
 *
 * Photos go in /public/testimonials/ (square, ~200x200 is plenty). Leave
 * `photo` as null and the card shows an initial instead of a broken image.
 * ============================================================================
 */

export interface Testimonial {
  /** First name only, as the host gave it. */
  name: string;
  /** e.g. 'Wedding · Orlando, FL' or 'Pastoral appreciation · Atlanta, GA' */
  occasion: string;
  /** One sentence, in the host's words, about the outcome they got. */
  quote: string;
  /** e.g. '/testimonials/maria.jpg' — or null for an initial avatar. */
  photo: string | null;
}

export const testimonials: Testimonial[] = [
  // Example of the shape — uncomment and replace with a REAL host once collected:
  //
  // {
  //   name: 'Maria',
  //   occasion: 'Wedding · Orlando, FL',
  //   quote: 'We got every dance-floor candid our photographer missed.',
  //   photo: '/testimonials/maria.jpg',
  // },
];
