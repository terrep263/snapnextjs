import Link from "next/link";
import { Camera } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SnapWorxx</span>
          </div>
          <nav>
            <Link
              href="/create"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create Event
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Share Event Photos{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Create a custom photo sharing link for your event. Guests scan a QR code,
              upload photos, and everyone can view and download the entire gallery.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
              <Link
                href="/create"
                className="rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Your Event
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-border bg-background px-8 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4 rounded-lg bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Create Event</h3>
                <p className="text-muted-foreground">
                  Set up your event in seconds with a custom name and details.
                </p>
              </div>
              <div className="space-y-4 rounded-lg bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Share QR Code</h3>
                <p className="text-muted-foreground">
                  Display the QR code at your event for easy photo uploads.
                </p>
              </div>
              <div className="space-y-4 rounded-lg bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  View & Download
                </h3>
                <p className="text-muted-foreground">
                  All photos instantly appear in your gallery for everyone to enjoy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 SnapWorxx. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
