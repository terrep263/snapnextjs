import Link from 'next/link'
import Image from 'next/image'

export default function GuestUploadPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image src="/snapworxx logo (1).png" alt="SnapWorxx" width={160} height={40} className="h-10 w-auto" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Guest Upload Page</h1>
          <p className="text-xl text-gray-600 mb-8">Event Slug: {params.slug}</p>
          <p className="text-gray-500">This page is under construction.</p>
          <p className="text-sm text-gray-400 mt-4">
            This will allow guests to upload photos and videos to the event.
          </p>
        </div>
      </div>
    </div>
  )
}
