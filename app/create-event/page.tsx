"use client"

// Force dynamic rendering for this client-heavy page (uses next/navigation hooks)
export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'

type PackageType = 'basic' | 'premium'

export default function CreateEventPage() {
  const searchParams = useSearchParams()
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('premium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    email: '',
    name: '',
  })

  useEffect(() => {
    const packageParam = searchParams.get('package')
    if (packageParam === 'basic' || packageParam === 'premium') {
      setSelectedPackage(packageParam)
    }
  }, [searchParams])

  const packages = {
    basic: {
      name: 'Basic Package',
      price: 29,
      features: [
        'Unlimited uploads',
        'QR code + upload link',
        '30-day storage',
        'Event setup included',
      ],
    },
    premium: {
      name: 'Premium Package',
      price: 49,
      popular: true,
      features: [
        'Everything in Basic',
        'Feed view enabled',
        'Password protection',
        '90-day storage',
        'Bulk download',
      ],
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ...formData,
          packageType: selectedPackage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Create Your Event
          </h1>
          <p className="text-xl text-gray-600">
            Set up your photo sharing in under 2 minutes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="eventName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="eventName"
                  name="eventName"
                  required
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="Sarah & John's Wedding"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="sarah@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Your event link and QR code will be sent here
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Sarah Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Package</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setSelectedPackage('basic')}
                className={`text-left p-6 rounded-2xl border-2 transition-all ${
                  selectedPackage === 'basic'
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Package</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-gray-900">$29</span>
                      <span className="text-gray-600 ml-2">one-time</span>
                    </div>
                  </div>
                  {selectedPackage === 'basic' && (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <ul className="space-y-3">
                  {packages.basic.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <Check className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPackage('premium')}
                className={`text-left p-6 rounded-2xl border-2 transition-all relative ${
                  selectedPackage === 'premium'
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-xs font-bold">
                  Most Popular
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Premium Package</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-gray-900">$49</span>
                      <span className="text-gray-600 ml-2">one-time</span>
                    </div>
                  </div>
                  {selectedPackage === 'premium' && (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <ul className="space-y-3">
                  {packages.premium.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <Check className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-8 rounded-full font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : (
              `Create My Event - $${packages[selectedPackage].price}`
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Secure payment powered by Stripe
          </p>
        </form>
      </div>
    </div>
  )
}
