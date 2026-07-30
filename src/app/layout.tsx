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

export const metadata: Metadata = {
  metadataBase: new URL("https://snapworxx.com"),
  title: "Never Miss The Moments | SnapWorxx",
  description: "SnapWorxx helps you capture every moment — in the moment, while it's happening. Live in minutes. Nothing to download. Everyone gets the photos.",
  openGraph: {
    title: "Never Miss The Moments | SnapWorxx",
    description: "SnapWorxx helps you capture every moment — in the moment, while it's happening. Live in minutes. Nothing to download. Everyone gets the photos.",
    url: "https://snapworxx.com",
    siteName: "SnapWorxx",
    type: "website",
    images: [
      {
        url: "/purple%20logo/purplelogo.png",
        alt: "SnapWorxx",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Never Miss The Moments | SnapWorxx",
    description: "SnapWorxx helps you capture every moment — in the moment, while it's happening. Live in minutes. Nothing to download. Everyone gets the photos.",
    images: ["/purple%20logo/purplelogo.png"],
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
