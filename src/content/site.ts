/**
 * Site content constants — marketing copy and trust signals used across the
 * public marketing pages (homepage, /pricing, /about, /vs, /occasions).
 *
 * Everything a non-developer needs to update lives in this one file.
 */

export const SITE = {
  name: 'SnapWorxx',
  url: 'https://snapworxx.com',
  supportEmail: 'hello@snapworxx.com',
  company: 'ATLV Solutions',
  companyLocation: 'Orlando, Florida',
} as const;

/**
 * Founder block shown on /about and in the footer (audit D3.3).
 *
 * `photo` points at /public/founder.jpg. If it is ever set back to null the
 * page renders an initials avatar instead — it will never show a broken image
 * or a stock face.
 *
 * No social links by design — the founder trust signal here is the name, the
 * face and a reachable email, not a follower count.
 */
export const FOUNDER = {
  name: 'Terre Polite',
  title: 'Founder, SnapWorxx',
  location: `${SITE.company} · ${SITE.companyLocation}`,
  photo: '/founder.jpg' as string | null,
  story: [
    'I didn’t set out to build this. I went looking for something that already did it, and I tried what was out there. Everything I found was close but not quite — one was missing a feature I actually needed, another had bugs I kept hitting, and when I reported them I’d wait weeks for a fix that sometimes never came.',
    'That’s a bad place to be when the event is on Saturday. A gallery that half works is worse than no gallery at all, because by then you’ve already told your guests to scan the code.',
    'So I built SnapWorxx as the version I wanted: one QR code, nothing for guests to download, the full-resolution set yours to keep, and a real person who answers when something goes wrong. That last part is most of why it exists.',
  ],
} as const;

/**
 * The free path — the low-commitment secondary CTA for a visitor who is not
 * ready to buy (audit D2.2 / D4.2 / action plan item 8).
 *
 * This is the existing self-serve free event funnel shipped in PR #61. It was
 * already built and simply never surfaced from the homepage: one free event per
 * email, 30-day gallery, no card.
 */
export const FREE_EVENT_PATH = '/free'

/** Plain-language description of the free offer, used wherever it is mentioned. */
export const FREE_OFFER_SUMMARY =
  'One free event per email. 30-day gallery, no card, nothing to install.'

/**
 * Link to a real, viewable gallery.
 *
 * TODO (Terre): confirm this slug matches the sample freebie event created by
 * setup_sample_freebie_event.sql. If the slug differs, change it here only.
 * This is currently referenced only from the pricing section as a secondary
 * "see it before you sign up" link — the primary free path is FREE_EVENT_PATH.
 */
export const SAMPLE_GALLERY_PATH = '/e/sample-event-slug/gallery';

/**
 * Pricing — single source of truth for the pricing section, the /pricing page
 * and the Product/Offer JSON-LD.
 */
export const PLANS = [
  {
    id: 'basic',
    name: 'Basic Event',
    price: 29,
    href: '/create?plan=basic',
    // Value anchor (audit D4.3)
    anchor: 'One night, one price.',
    features: [
      'Unlimited uploads',
      'QR code + upload link',
      '30-day storage',
      'Instant setup',
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Event',
    price: 49,
    href: '/create?plan=premium',
    // Value anchor (audit D4.3)
    anchor:
      'Less than a single hour of a wedding photographer — for every guest’s photos, forever.',
    features: [
      'Everything in Basic',
      'Live feed view',
      'Password protection',
      '90-day storage',
      'Bulk download in full resolution',
      'Instant setup',
    ],
    popular: true,
  },
] as const;

/** Trust line shown under both pricing CTAs (audit D3.4). */
export const CHECKOUT_TRUST_LINE =
  'Secure checkout via Stripe · We never sell your photos · Full-resolution download is yours to keep';

/**
 * Scope honesty — what SnapWorxx is NOT for (audit D2.B).
 */
export const SCOPE_HONESTY =
  'SnapWorxx is built for one-off events — weddings, birthdays, showers, graduations, church and community days. It is not a subscription, not a business media library, and not a replacement for your photographer.';

/**
 * FAQ — answers the four objections the audit flags as unhandled (D1.4):
 * retention, guest participation, privacy, and what happens after storage ends.
 * This array is also the source for the FAQPage JSON-LD.
 */
export const FAQS = [
  {
    q: 'How long do I keep the photos?',
    a: 'Basic keeps your gallery live for 30 days, Premium for 90 days. Download the full-resolution set any time inside that window — once the files are on your drive they are yours permanently, with no watermark and no expiry. Need longer than 90 days? Email hello@snapworxx.com before your window closes.',
  },
  {
    q: 'What happens after storage ends?',
    a: 'The gallery link stops working and the files come off our servers. Nothing you have already downloaded is affected. We email the host before the window closes so nobody loses a photo by forgetting.',
  },
  {
    q: 'How do I get guests to actually upload?',
    a: 'This is the real question, and it is mostly a placement problem. Your dashboard generates a printable QR code — put it on the tables, the bar, the program and the exit. Guests point a phone camera at it and the upload screen opens in their browser. There is no app to download and no account to create, so the drop-off between "scan" and "uploaded" is a single tap.',
  },
  {
    q: 'Do my guests need an app or an account?',
    a: 'No. Scanning the QR code opens a normal web page. No download, no signup, no login — that is the whole point.',
  },
  {
    q: 'Are my photos private?',
    a: 'Your gallery lives at its own link — nothing on this site links to it and there is no directory of galleries, so someone has to be given the link or scan your QR code. Premium adds a password, so the link alone is not enough to open the gallery. We do not sell, license or train on your photos, and you can ask us to delete an event at any time.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. You pay once per event — $29 or $49 — and that is the end of it. No recurring charge, no auto-renewal, no card kept on file for later.',
  },
  {
    q: 'Can I try it before I pay?',
    a: 'Yes. You can set up one free event per email at snapworxx.com/free — no card, nothing to install, and the gallery stays up for 30 days. It is the same product your guests would use, not a demo.',
  },
] as const;

/**
 * Occasion positioning (audit D1.3 / action plan item 13).
 */
export const OCCASIONS = [
  {
    slug: 'weddings',
    label: 'Weddings',
    headline: 'Every candid your photographer didn’t get',
    blurb:
      'Your photographer gets the day. Your guests get the night — the dance floor, the table your parents were at, the ten minutes you were somewhere else. One QR code puts all of it in the same gallery.',
    job: 'Be the couple who did it right — and relive the day through everyone else’s eyes.',
  },
  {
    slug: 'birthdays',
    label: 'Birthdays & milestones',
    headline: 'Keep the whole night, not just the group chat',
    blurb:
      'The candle goes out, forty phones go up, and the photos scatter across four group chats. One QR code on the table collects them all in one place while the party is still happening.',
    job: 'Get every angle, from every person in the room, without chasing anyone.',
  },
  {
    slug: 'church-and-community',
    label: 'Church & community',
    headline: 'Share it back with the whole congregation',
    blurb:
      'Pastoral appreciations, homecomings, banquets, youth days. Everyone who was there can add what they shot, and everyone who was there can have the whole set back — no Facebook album, no one person stuck sorting it.',
    job: 'Collect from the whole room, then share it back with everyone who was there.',
  },
] as const;
