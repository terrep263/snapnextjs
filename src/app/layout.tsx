import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TempNavigation from "@/components/TempNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnapWorxx - Event Photo Sharing Made Easy",
  description: "Create custom photo sharing links for your events. Guests scan a QR code, upload photos, and everyone can view and download the gallery.",
  metadataBase: new URL('https://snapworxx.com'),
  keywords: ['event photography', 'photo sharing', 'QR code gallery', 'event photos', 'photo gallery'],
  authors: [{ name: 'SnapWorxx' }],
  creator: 'SnapWorxx',
  publisher: 'SnapWorxx',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snapworxx.com',
    siteName: 'SnapWorxx',
    title: 'SnapWorxx - Event Photo Sharing Made Easy',
    description: 'Create custom photo sharing links for your events. Guests scan a QR code, upload photos, and everyone can view and download the gallery.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SnapWorxx - Event Photo Sharing Made Easy',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@snapworxx',
    creator: '@snapworxx',
    title: 'SnapWorxx - Event Photo Sharing Made Easy',
    description: 'Create custom photo sharing links for your events. Guests scan a QR code, upload photos, and everyone can view and download the gallery.',
    images: ['/og-image.png'],
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <TempNavigation />
      </body>
    </html>
  );
}
