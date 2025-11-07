'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Camera, Home, Plus, BarChart3, Image, CheckCircle, Users, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TempNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/create', label: 'Create Event', icon: Plus },
    { href: '/success?session_id=temp', label: 'Success Page', icon: CheckCircle },
    { href: '/dashboard/sample-event-id', label: 'Dashboard', icon: BarChart3 },
    { href: '/e/sample-event-slug', label: 'Event Gallery', icon: Image },
    { href: '/affiliate/register', label: '💼 Join Affiliates', icon: Users },
    { href: '/affiliate/dashboard', label: '📊 Affiliate Dashboard', icon: DollarSign },
    { href: '/create?ref=TEST1234', label: '🔗 Test Referral Link', icon: CheckCircle },
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

      {/* Desktop Navigation - Fixed Left Sidebar with Collapse */}
      <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 transform md:block">
        <div className={`rounded-lg bg-white/95 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isCollapsed ? 'p-3 w-20' : 'p-6 w-56'
        }`}>
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Logo and Title */}
          <div className={`flex flex-col items-center gap-2 overflow-hidden transition-all duration-300 ${
            isCollapsed 
              ? 'mb-0 h-0 opacity-0' 
              : 'mb-6 h-auto opacity-100'
          }`}>
            <img 
              src="/purple logo/purplelogo.png" 
              alt="Snapworxx Logo" 
              className="h-20 md:h-24 w-auto"
            />
            <span className="text-sm font-semibold text-gray-800">Dev Nav</span>
          </div>

          {/* Navigation Links */}
          <nav className={`space-y-2 ${isCollapsed ? 'space-y-3' : ''}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md transition-all duration-300 hover:bg-purple-100 hover:text-purple-700 ${
                    isCollapsed 
                      ? 'justify-center p-2' 
                      : 'gap-3 px-3 py-2 text-sm font-medium text-gray-700'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={isCollapsed ? 'h-5 w-5 flex-shrink-0' : 'h-4 w-4 flex-shrink-0'} />
                  {!isCollapsed && <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.label}</span>}
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