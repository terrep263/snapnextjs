import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TempNavigation from "@/components/TempNavigation";

const showTempNavigation = process.env.NODE_ENV !== 'production';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * NOTE: openGraph.images / twitter.images are deliberately NOT set here.
 * src/app/opengraph-image.tsx and src/app/twitter-image.tsx generate those via
 * next/og and Next wires them up automatically — setting `images` here would
 * override the generated ones.
 *
 * Audit D5.1: the title and description now carry the category keywords a buyer
 * actually searches ("QR guest photo gallery", "no app"), which the previous
 * brand-only title did not.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://snapworxx.com"),
  title: {
    default: "SnapWorxx — QR Guest Photo Gallery for Weddings & Events (No App)",
    template: "%s | SnapWorxx",
  },
  description:
    "Collect every guest photo and video from your wedding, birthday or community event with one QR code. Guests scan and upload from their phone — no app, no signup. One free event, or $29 one-time. Full-resolution download yours to keep.",
  keywords: [
    "QR photo sharing",
    "guest photo gallery",
    "wedding photo app no download",
    "event photo sharing",
    "QR code photo upload",
    "wedding QR code photos",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SnapWorxx — QR Guest Photo Gallery for Weddings & Events (No App)",
    description:
      "One QR code collects every guest photo and video from your event. No app, no signup. Try one event free, or $29 one-time.",
    url: "https://snapworxx.com",
    siteName: "SnapWorxx",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapWorxx — QR Guest Photo Gallery for Weddings & Events (No App)",
    description:
      "One QR code collects every guest photo and video from your event. No app, no signup. Try one event free, or $29 one-time.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/purple logo/purplelogo.png", sizes: "32x32", type: "image/png" },
      { url: "/purple logo/purplelogo.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/purple logo/purplelogo.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/purple logo/purplelogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/purple logo/purplelogo.png" />
        <script
          src="https://pushlapgrowth.com/affiliate-tracker.js"
          data-affiliate
          data-program-id="e4fb576e-d34e-49f4-aec3-66f6d36f1ef2"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {showTempNavigation && <TempNavigation />}
      </body>
    </html>
  );
}
