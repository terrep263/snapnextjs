'use client';

import { EventData } from '@/lib/gallery-utils';
import { useMemo } from 'react';

export interface EventGalleryHeaderProps {
  event: EventData;
}

/**
 * EventGalleryHeader Component
 * 
 * Mandatory gallery header that displays:
 * - Banner image (events.header_image) or fallback hero section
 * - Profile image (events.profile_image) or initials circle
 * - Event name (events.name)
 * 
 * Fully responsive with mobile, tablet, and desktop breakpoints.
 */
export default function EventGalleryHeader({ event }: EventGalleryHeaderProps) {
  // Generate initials from event name
  const initials = useMemo(() => {
    if (!event.name) return 'E';
    const words = event.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return event.name.substring(0, 2).toUpperCase();
  }, [event.name]);

  // Generate color for initials circle based on event name hash
  const initialsColor = useMemo(() => {
    if (!event.name) return '#9333ea'; // Default purple
    
    // Simple hash function to generate consistent color
    let hash = 0;
    for (let i = 0; i < event.name.length; i++) {
      hash = event.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a color from purple/blue spectrum
    const hue = (hash % 60) + 240; // 240-300 (purple to blue range)
    return `hsl(${hue}, 70%, 50%)`;
  }, [event.name]);

  // Debug: Log image URLs and verify they're valid
  if (typeof window !== 'undefined') {
    console.log('🖼️ EventGalleryHeader received event data:', {
      eventId: event.id,
      eventName: event.name,
      header_image: event.header_image,
      profile_image: event.profile_image,
      hasHeaderImage: !!event.header_image,
      hasProfileImage: !!event.profile_image,
      headerImageType: typeof event.header_image,
      profileImageType: typeof event.profile_image,
    });
  }

  return (
    <div className="relative w-full">
      {/* Banner Section */}
      {event.header_image ? (
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[250px] xl:h-[300px] overflow-hidden">
          <img
            src={event.header_image}
            alt={`${event.name} header`}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              console.error('❌ Header image failed to load:', event.header_image);
              console.error('Error details:', e);
            }}
            onLoad={() => {
              console.log('✅ Header image loaded successfully:', event.header_image);
            }}
          />
          {/* Subtle overlay for better text contrast if needed */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/10" />
        </div>
      ) : (
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[250px] xl:h-[300px] bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center px-4">
            <img
              src="/purple logo/whitelogo.png"
              alt="SnapWorxx Logo"
              className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto mb-3 sm:mb-4 drop-shadow-lg"
            />
            <p className="text-white/90 text-sm sm:text-base md:text-lg font-light tracking-wide">
              every memory, every moment
            </p>
          </div>
        </div>
      )}

      {/* Profile Image Section - Overlaps banner by ~50% */}
      <div className="relative -mt-[40px] sm:-mt-[50px] md:-mt-[50px] lg:-mt-[60px] flex justify-center z-10">
        {event.profile_image ? (
          <div className="relative">
            <img
              src={event.profile_image}
              alt={`${event.name} profile`}
              className="rounded-full border-4 border-white object-cover shadow-lg w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
              loading="eager"
              onError={(e) => {
                console.error('❌ Profile image failed to load:', event.profile_image);
                console.error('Error details:', e);
              }}
              onLoad={() => {
                console.log('✅ Profile image loaded successfully:', event.profile_image);
              }}
            />
          </div>
        ) : (
          <div
            className="rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px] text-lg sm:text-xl md:text-2xl lg:text-3xl"
            style={{
              backgroundColor: initialsColor,
            }}
          >
            <span className="select-none">{initials}</span>
          </div>
        )}
      </div>

      {/* Event Name Section - Centered below profile circle */}
      <div className="pt-3 sm:pt-4 md:pt-5 lg:pt-6 pb-6 sm:pb-8 md:pb-10 text-center px-4">
        <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold text-gray-900 leading-tight">
          {event.name || 'Untitled Event'}
        </h1>
      </div>
    </div>
  );
}

