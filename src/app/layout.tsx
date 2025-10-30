import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapWorxx - Event Photo Sharing Made Easy",
  description: "Create custom photo sharing links for your events. Guests scan a QR code, upload photos, and everyone can view and download the gallery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
