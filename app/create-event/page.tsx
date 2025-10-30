import React, { Suspense } from 'react'
import CreateEventClient from './CreateEventClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* Client component handles all client-side hooks and state */}
      <CreateEventClient />
    </Suspense>
  )
}
type PackageType = 'basic' | 'premium'
