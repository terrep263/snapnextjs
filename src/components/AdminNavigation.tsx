'use client';

import Link from 'next/link';
import { ChevronRight, Lock, Settings, BarChart3, Shield, Zap } from 'lucide-react';

interface AdminLink {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'Access' | 'Management' | 'Analytics' | 'Settings' | 'System';
  requiresAuth?: boolean;
}

export default function AdminNavigation() {
  const adminLinks: AdminLink[] = [
    // Access Section
    {
      href: '/admin/login',
      label: 'Admin Login',
      description: 'Authenticate and access admin panel',
      icon: <Lock className="h-5 w-5" />,
      category: 'Access',
      requiresAuth: false
    },
    
    // Management Section
    {
      href: '/admin/dashboard',
      label: 'Admin Dashboard',
      description: 'Overview and main administrative hub',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'Management'
    },
    {
      href: '/admin/manage',
      label: 'Manage Content',
      description: 'Create, edit, and delete admin content',
      icon: <Settings className="h-5 w-5" />,
      category: 'Management'
    },
    {
      href: '/admin/settings',
      label: 'Admin Settings',
      description: 'Configure admin panel preferences',
      icon: <Settings className="h-5 w-5" />,
      category: 'Settings'
    },
    
    // System Section
    {
      href: '/admin/bootstrap',
      label: 'Bootstrap/Setup',
      description: 'Initialize and configure system',
      icon: <Zap className="h-5 w-5" />,
      category: 'System',
      requiresAuth: false
    },
  ];

  const categories = Array.from(new Set(adminLinks.map(link => link.category)));
  const groupedLinks = categories.reduce((acc, category) => {
    acc[category] = adminLinks.filter(link => link.category === category);
    return acc;
  }, {} as Record<string, AdminLink[]>);

  const categoryColors = {
    'Access': 'border-red-200 bg-red-50',
    'Management': 'border-blue-200 bg-blue-50',
    'Analytics': 'border-green-200 bg-green-50',
    'Settings': 'border-yellow-200 bg-yellow-50',
    'System': 'border-purple-200 bg-purple-50',
  };

  const categoryIcons = {
    'Access': <Lock className="h-4 w-4" />,
    'Management': <BarChart3 className="h-4 w-4" />,
    'Analytics': <BarChart3 className="h-4 w-4" />,
    'Settings': <Settings className="h-4 w-4" />,
    'System': <Shield className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Admin Navigation</h1>
          <p className="text-lg text-gray-600">Quick access to all administrative functions</p>
        </div>

        {/* Navigation Grid by Category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-purple-600">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{category}</h2>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Category Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedLinks[category].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative overflow-hidden rounded-lg border-2 p-6 transition-all hover:shadow-lg hover:scale-105 ${
                      categoryColors[category as keyof typeof categoryColors]
                    }`}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>

                    {/* Content */}
                    <div className="relative">
                      {/* Icon and Label */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-purple-600">
                            {link.icon}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {link.label}
                          </h3>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        {link.description}
                      </p>

                      {/* Auth Badge */}
                      {link.requiresAuth === false && (
                        <div className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                          No auth required
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-16 rounded-lg bg-white shadow-lg p-8 border-2 border-purple-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Navigation Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div key={category} className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {groupedLinks[category].length}
                </div>
                <div className="text-sm text-gray-600">{category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Total Admin Routes: {adminLinks.length}</p>
          <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
