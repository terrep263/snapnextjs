'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, Download } from 'lucide-react';
import Image from 'next/image';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    // TODO: Upload to Supabase storage
    console.log('Uploading files:', files);

    setTimeout(() => {
      setUploading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">SnapWorxx</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-muted py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Event: {slug}
            </h1>
            <p className="text-muted-foreground">
              Upload your photos to share with everyone at this event!
            </p>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-accent p-12 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <span className="mb-2 text-lg font-semibold text-foreground">
                {uploading ? 'Uploading...' : 'Click to upload photos'}
              </span>
              <span className="text-sm text-muted-foreground">
                or drag and drop (multiple files supported)
              </span>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Event Photos ({photos.length})
              </h2>
              {photos.length > 0 && (
                <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  <Download className="h-4 w-4" />
                  Download All
                </button>
              )}
            </div>

            {photos.length === 0 ? (
              <div className="py-12 text-center">
                <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No photos yet. Be the first to upload!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
