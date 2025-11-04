'use client';

import { Suspense } from 'react';
import CreateEventContent from './CreateEventContent';

export default function CreateEvent() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CreateEventContent />
    </Suspense>
  );
}
