/**
 * Real host testimonials (audit D3.2 — Story proof).
 *
 * Every quote below is a real host's own words, used verbatim. Do not tighten,
 * shorten or "improve" them — an edited testimonial is not a testimonial. The
 * only field written by anyone other than the host is `occasion`.
 *
 * To add another: collect the quote from the host, drop it in with their first
 * name and last initial, and give it an occasion label. Headshots are optional
 * — leave `photo` as null and the card renders an initials avatar rather than
 * a broken image. Photos go in /public/testimonials/.
 *
 * The homepage band hides itself entirely while this array is empty, so this
 * file is the on/off switch for social proof on the site.
 */

export interface Testimonial {
  /** First name and last initial, as the host agreed to be credited. */
  name: string;
  /** Short label for the event type, e.g. 'Birthday celebration'. */
  occasion: string;
  /** The host's own words. Verbatim — never edited. */
  quote: string;
  /** e.g. '/testimonials/joan.jpg' — or null for an initials avatar. */
  photo: string | null;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Joan H.',
    occasion: 'Birthday celebration',
    quote:
      'SnapWorxx made sharing photos from my birthday party incredibly easy. Everyone scanned the QR code and added their pictures to one gallery, so I received moments from every part of the celebration without chasing anyone afterward.',
    photo: null,
  },
  {
    name: 'Toni W.',
    occasion: 'Conference presentation',
    quote:
      'SnapWorxx was a great addition to my conference presentation. Attendees could scan the QR code without downloading an app, making it simple to capture and share photos from throughout the event in one convenient gallery.',
    photo: null,
  },
  {
    name: 'Tresha M.',
    occasion: 'Brother’s birthday party',
    quote:
      'I used SnapWorxx for my brother’s birthday, and it worked perfectly. Our family and friends uploaded their photos as the party was happening, and we ended up with one complete collection of memories from everyone’s perspective.',
    photo: null,
  },
];
