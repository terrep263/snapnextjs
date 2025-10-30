'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Camera, QrCode, Mail, Layout, Loader2, ExternalLink, Calendar } from 'lucide-react'

interface EventDetails {
  eventId: string
  eventName: string
  eventSlug: string
  packageType: string
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchEventDetails()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-event-by-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventDetails(data)
      }
    } catch (err) {
      console.error('Error fetching event details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600">
              Your event has been created successfully
            </p>
          </div>

          {/* Dashboard Access */}
          {eventDetails && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4">
                  <Layout className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    🎉 Your Event Dashboard is Ready!
                  </h3>
                  <p className="text-gray-700 mb-4">
                    <strong>{eventDetails.eventName}</strong> is all set up. Access your dashboard now to view photos as they're uploaded!
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/${eventDetails.eventId}`)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Layout className="h-5 w-5" />
                    Go to Dashboard
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Info */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📧 Check Your Email
            </h2>
            <p className="text-gray-700 mb-6">
              We've sent a confirmation email to your registered email address with:
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Your unique QR code</h3>
                  <p className="text-sm text-gray-600">
                    Print-ready QR code for guests to scan and upload photos
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Event upload link</h3>
                  <p className="text-sm text-gray-600">
                    Share this link directly with guests via text or social media
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Dashboard access link</h3>
                  <p className="text-sm text-gray-600">
                    View and download all photos from your event dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 What's Next?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Display the QR Code</h3>
                  <p className="text-sm text-gray-600">
                    Print the QR code from your email and display it prominently at your event
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Share the Link</h3>
                  <p className="text-sm text-gray-600">
                    Share your event link via text, email, or social media with all attendees
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Collect Memories</h3>
                  <p className="text-sm text-gray-600">
                    Guests scan the code or use the link to upload their photos and videos instantly
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Download & Enjoy</h3>
                  <p className="text-sm text-gray-600">
                    After your event, download all photos from your dashboard in one click
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Need help? Contact us at support@snapworxx.com</p>
            <Link
              href="/"
              className="text-primary hover:text-primary-dark font-semibold"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
