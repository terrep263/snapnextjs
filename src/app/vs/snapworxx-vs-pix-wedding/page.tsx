import type { Metadata } from 'next'
import VsPage, { VsContent } from '@/components/site/VsPage'

export const metadata: Metadata = {
  title: 'SnapWorxx vs Pix Wedding — QR guest photo galleries compared',
  description:
    'An honest comparison of SnapWorxx and Pix Wedding for collecting guest photos. Pricing, free trial, storage, downloads and which one fits a wedding, a birthday or a church event.',
  alternates: { canonical: '/vs/snapworxx-vs-pix-wedding' },
}

const content: VsContent = {
  competitor: 'Pix Wedding',
  slug: 'snapworxx-vs-pix-wedding',
  h1: 'SnapWorxx vs Pix Wedding',
  intro:
    'Both collect guest photos through a QR code with nothing for guests to download. Pix Wedding is built for couples and only couples. SnapWorxx is built for any one-off event — weddings included, but also birthdays, graduations, banquets and church days — at a flat one-time price, with one free event to start on.',
  whenUsBetter: [
    'You want to try the real thing free. SnapWorxx gives you one free event with 25 uploads, a 7-day event window, and no card.',
    'Your event is not a wedding. Birthdays, graduations, pastoral appreciations, banquets and community days all get the same product and the same price.',
    'You want the lowest one-time entry price. SnapWorxx starts at $29 against a $49 entry tier.',
    'You want the full-resolution set in one download and permanently yours, with no ongoing account.',
    'You want two options, not a ladder. Two tiers, clear deltas, no upsell path to think about.',
  ],
  whenThemBetter: [
    'You want a larger free trial specifically. Pix offers around 20 uploads free; SnapWorxx gives you a whole free event but only one per email.',
    'You are a couple and want wedding-specific framing, wedding testimonials and a wedding-shaped onboarding.',
    'You want a third pricing rung with more headroom for a very large wedding.',
  ],
  rows: [
    { label: 'Entry price', us: '$29 one-time', them: 'Around $49 one-time (Starter)' },
    { label: 'Top tier', us: '$49 one-time (Premium)', them: 'Around $89 one-time (Pro)' },
    { label: 'Pricing model', us: 'One-time, per event', them: 'One-time, per event' },
    { label: 'Free option', us: 'One free event per email, 25 uploads, 7-day event window, no card', them: 'Free trial, around 20 uploads, no card' },
    { label: 'Guest app or signup', us: 'None', them: 'None' },
    { label: 'Occasions covered', us: 'Weddings, birthdays, graduations, church & community', them: 'Weddings' },
    { label: 'Guest uploads', us: 'Unlimited on both tiers', them: 'Capped by tier' },
    { label: 'Gallery stays live', us: '30 days (Basic) / 90 days (Premium)', them: 'Varies by tier' },
    { label: 'Password on the gallery', us: 'Premium', them: 'Yes' },
    { label: 'Live feed during the event', us: 'Premium', them: 'Yes (live slideshow)' },
    { label: 'Bulk full-resolution download', us: 'Premium, yours permanently', them: 'Yes' },
  ],
  faqs: [
    {
      q: 'Is SnapWorxx cheaper than Pix Wedding?',
      a: 'At the entry tier, yes — $29 against roughly $49 — and at the top tier, $49 against roughly $89. Both are one-time charges per event with no subscription. Check Pix’s current pricing before you decide; these numbers come from a third-party category audit rather than our own account.',
    },
    {
      q: 'Can I try either one for free?',
      a: 'Both. Pix offers a trial of roughly 20 uploads with no card. SnapWorxx gives you one free event per email — 25 uploads, a 7-day event window, no card — at snapworxx.com/free. Theirs lets you test repeatedly at small volume; ours lets you try the real guest flow for one event.',
    },
    {
      q: 'Can I use Pix Wedding for a birthday or a church event?',
      a: 'Pix Wedding is positioned for weddings — the product, the copy and the proof are all couple-shaped. If your event is a birthday, a graduation, a banquet or a church day, SnapWorxx is built for it at the same price as a wedding.',
    },
    {
      q: 'Do my guests need an app with either one?',
      a: 'No. Both work by having a guest point a phone camera at a QR code, which opens an upload page in the browser. No app store, no account, no login for guests on either product.',
    },
    {
      q: 'Who owns the photos?',
      a: 'With SnapWorxx you download the full-resolution set and those files are permanently yours — we do not sell, license or train on your photos. Check any provider’s terms for what they reserve the right to do with uploads.',
    },
  ],
}

export default function Page() {
  return <VsPage content={content} />
}
