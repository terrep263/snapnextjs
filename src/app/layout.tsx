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
  icons: {
    icon: "/purple logo/purplelogo.png",
    apple: "/purple logo/purplelogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <TempNavigation />
      </body>
    </html>
  );
}
