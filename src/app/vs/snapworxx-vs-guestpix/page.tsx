import type { Metadata } from 'next'
import VsPage, { VsContent } from '@/components/site/VsPage'

export const metadata: Metadata = {
  title: 'SnapWorxx vs GuestPix — QR guest photo galleries compared',
  description:
    'An honest comparison of SnapWorxx and GuestPix for collecting guest photos at an event. Pricing, free plan, storage windows, downloads, and which one fits your event.',
  alternates: { canonical: '/vs/snapworxx-vs-guestpix' },
}

const content: VsContent = {
  competitor: 'GuestPix',
  slug: 'snapworxx-vs-guestpix',
  h1: 'SnapWorxx vs GuestPix',
  intro:
    'GuestPix is the scale player in this category — over 200,000 hosts across 100+ countries. SnapWorxx is smaller, newer and cheaper, with a flat two-price model, no packages to decode, and one free event to start on. Here is the honest version of where each one wins.',
  whenUsBetter: [
    'You want to try a real event without a card. SnapWorxx’s free event includes 25 uploads over a 7-day event window.',
    'You want one flat price you can read in five seconds — $29 or $49 — instead of comparing packages by event type.',
    'You want the lowest one-time entry price in the category.',
    'You want everything in one download at full resolution and permanently yours.',
    'You want a person to answer your email, not a support queue.',
  ],
  whenThemBetter: [
    'You want to keep using a free plan indefinitely. GuestPix’s free plan (around 50 photos, 30 days) can be reused; SnapWorxx allows one free event per email.',
    'Scale and track record are what convince you. GuestPix has been at this longer and has the host numbers to show.',
    'You need a language other than English, or occasion-specific packages such as memorials.',
    'You want a digital guestbook feature alongside the photo gallery.',
  ],
  rows: [
    { label: 'Entry price', us: '$29 one-time', them: 'Free plan, then paid packages' },
    { label: 'Top tier', us: '$49 one-time (Premium)', them: 'Package pricing by event type' },
    { label: 'Pricing model', us: 'One-time, per event', them: 'One-time, per event' },
    { label: 'Free option', us: 'One free event per email, 25 uploads, 7-day event window', them: 'Free plan, around 50 photos / 30 days' },
    { label: 'Recurring charges', us: 'None', them: 'None' },
    { label: 'Guest app or signup', us: 'None', them: 'None' },
    { label: 'Guest uploads', us: 'Unlimited on both tiers', them: 'Capped by plan' },
    { label: 'Gallery stays live', us: '30 days (Basic) / 90 days (Premium)', them: 'Varies by plan' },
    { label: 'Password on the gallery', us: 'Premium', them: 'Yes' },
    { label: 'Live feed during the event', us: 'Premium', them: 'Yes' },
    { label: 'Digital guestbook', us: 'No', them: 'Yes' },
    { label: 'Bulk full-resolution download', us: 'Premium, yours permanently', them: 'Yes' },
    { label: 'Track record', us: 'Newer, smaller, founder-run', them: '200k+ hosts, 100+ countries' },
  ],
  faqs: [
    {
      q: 'Is GuestPix bigger than SnapWorxx?',
      a: 'Yes, by a wide margin — GuestPix reports over 200,000 hosts across 100+ countries. If scale is the thing that reassures you, that is a fair reason to pick them. SnapWorxx is newer, smaller and run by a named founder you can email directly.',
    },
    {
      q: 'How do the free options compare?',
      a: 'GuestPix caps its free plan at roughly 50 photos over 30 days, and you can keep using it. SnapWorxx gives one free event per email with 25 uploads and a 7-day event window. If you want to try the real guest flow without a card, ours does that; if you want a permanently reusable low-volume option, theirs does.',
    },
    {
      q: 'Which one is cheaper?',
      a: 'For a paid event, SnapWorxx entry is $29 and Premium is $49, one time. GuestPix prices by package and event type, so compare against the specific package that matches your event. Neither charges a recurring fee.',
    },
    {
      q: 'Do my guests need an app with either one?',
      a: 'No. Both are QR-code-to-browser: a guest points a phone camera at the code and the upload page opens. No app store, no account, no login for guests.',
    },
    {
      q: 'What happens to my photos when the storage window ends?',
      a: 'With SnapWorxx the gallery link stops working and the files come off our servers after 30 days (Basic) or 90 days (Premium) — but anything you downloaded before then is permanently yours, full resolution, no watermark. Check GuestPix’s current retention terms for their equivalent.',
    },
  ],
}

export default function Page() {
  return <VsPage content={content} />
}
