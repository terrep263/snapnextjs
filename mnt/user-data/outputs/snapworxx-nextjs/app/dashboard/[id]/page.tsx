'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function DashboardPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image src="/snapworxx logo (1).png" alt="SnapWorxx" width={160} height={40} className="h-10 w-auto" />
            </Link>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              Home
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Dashboard</h1>
          <p className="text-xl text-gray-600 mb-8">Event ID: {params.id}</p>
          <p className="text-gray-500 mb-4">This page is under construction.</p>
          <p className="text-sm text-gray-400">
            This will display uploaded photos, event details, and download options.
          </p>
        </div>
      </div>
    </div>
  )
}
