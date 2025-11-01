'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Camera, Home, Plus, BarChart3, Image, CheckCircle } from 'lucide-react';

export default function TempNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/create', label: 'Create Event', icon: Plus },
    { href: '/success?session_id=temp', label: 'Success Page', icon: CheckCircle },
    { href: '/dashboard/sample-event-id', label: 'Dashboard', icon: BarChart3 },
    { href: '/e/sample-event-slug', label: 'Event Gallery', icon: Image },
    { href: '/test-upload', label: '🧪 Test Upload', icon: Camera },
  ];

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all hover:bg-purple-700 md:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop Navigation - Fixed Left Sidebar */}
      <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 transform md:block">
        <div className="rounded-lg bg-white/95 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-6 flex flex-col items-center gap-2">
            <img 
              src="/purple logo/purplelogo.png" 
              alt="Snapworxx Logo" 
              className="h-16 w-auto"
            />
            <span className="text-sm font-semibold text-gray-800">Dev Nav</span>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-purple-100 hover:text-purple-700"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation - Full Screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden">
          <div className="fixed bottom-0 left-0 right-0 rounded-t-lg bg-white p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex flex-col items-center gap-3">
                <img 
                  src="/purple logo/purplelogo.png" 
                  alt="Snapworxx Logo" 
                  className="h-16 w-auto"
                />
                <span className="text-lg font-semibold text-gray-800">Dev Navigation</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 rounded-md p-3 text-base font-medium text-gray-700 transition-colors hover:bg-purple-100 hover:text-purple-700"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}