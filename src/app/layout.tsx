import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TempNavigation from "@/components/TempNavigation";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "SnapWorxx - Event Photo Sharing Made Easy",
  description: "Create custom photo sharing links for your events. Guests scan a QR code, upload photos, and everyone can view and download the gallery.",
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
      </head>
      <body
        className="antialiased"
      >
        {children}
        <TempNavigation />
      </body>
    </html>
  );
}
