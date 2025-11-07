'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Home, Users, FileText, Settings, Zap, AlertCircle } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface PageGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  pages: {
    url: string;
    label: string;
    description: string;
    badge?: string;
    isExternal?: boolean;
  }[];
}

export default function AdminResourcesPage() {
  const pathname = usePathname();

  const pageGroups: PageGroup[] = [
    {
      title: 'Admin Management',
      description: 'Core admin functionality and settings',
      icon: <Users className="w-5 h-5" />,
      pages: [
        {
          url: '/admin/dashboard',
          label: 'Admin Dashboard',
          description: 'Main admin hub with statistics and controls',
        },
        {
          url: '/admin/manage',
          label: 'Manage Admins',
          description: 'Create, edit, and delete admin accounts',
        },
        {
          url: '/admin/settings',
          label: 'Admin Settings',
          description: 'Configure system features and toggles',
        },
        {
          url: '/admin/login',
          label: 'Admin Login',
          description: 'Authenticate to admin panel',
          badge: 'Public',
        },
      ],
    },
    {
      title: 'Event Management',
      description: 'View and manage user events',
      icon: <FileText className="w-5 h-5" />,
      pages: [
        {
          url: '/dashboard/sample-event-id',
          label: 'Event Dashboard',
          description: 'View specific event with photos and details',
          badge: 'Sample',
        },
        {
          url: '/e/sample-event-slug',
          label: 'Event Gallery',
          description: 'View event gallery with header/profile images',
          badge: 'Sample',
        },
        {
          url: '/e/sample-event-slug/upload',
          label: 'Event Upload',
          description: 'Upload media to event',
          badge: 'Sample',
        },
      ],
    },
    {
      title: 'Affiliate & Promo',
      description: 'Affiliate program and promotional events',
      icon: <Zap className="w-5 h-5" />,
      pages: [
        {
          url: '/affiliate/register',
          label: 'Affiliate Registration',
          description: 'Register as affiliate partner',
        },
        {
          url: '/affiliate/dashboard',
          label: 'Affiliate Dashboard',
          description: 'View affiliate earnings and referrals',
        },
        {
          url: '/promo/free-basic',
          label: 'Free Promo Event',
          description: 'Create free promotional event',
        },
      ],
    },
    {
      title: 'User Experience',
      description: 'Public-facing user pages',
      icon: <Home className="w-5 h-5" />,
      pages: [
        {
          url: '/',
          label: 'Home Page',
          description: 'Main landing page',
        },
        {
          url: '/create',
          label: 'Create Event',
          description: 'User event creation page',
        },
        {
          url: '/success',
          label: 'Success Page',
          description: 'Post-payment success confirmation',
        },
        {
          url: '/get-discount',
          label: 'Get Discount',
          description: 'Discount code application',
        },
      ],
    },
    {
      title: 'System & Testing',
      description: 'Development and diagnostic tools',
      icon: <AlertCircle className="w-5 h-5" />,
      pages: [
        {
          url: '/diagnostics',
          label: 'Diagnostics',
          description: 'System health and status checks',
          badge: 'Dev',
        },
        {
          url: '/status',
          label: 'Status',
          description: 'Application status',
        },
        {
          url: '/test-upload',
          label: 'Test Upload',
          description: 'Test media upload functionality',
          badge: 'Dev',
        },
        {
          url: '/test-db',
          label: 'Test Database',
          description: 'Test database connectivity',
          badge: 'Dev',
        },
        {
          url: '/test-email',
          label: 'Test Email',
          description: 'Test email sending',
          badge: 'Dev',
        },
        {
          url: '/test-storage',
          label: 'Test Storage',
          description: 'Test file storage',
          badge: 'Dev',
        },
        {
          url: '/debug-event',
          label: 'Debug Event',
          description: 'Event debugging tools',
          badge: 'Dev',
        },
        {
          url: '/debug-gallery',
          label: 'Debug Gallery',
          description: 'Gallery debugging tools',
          badge: 'Dev',
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resource Center</h1>
                <p className="text-gray-600">Quick access to all pages in the system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-12">
            {pageGroups.map((group, index) => (
              <div key={index} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    {group.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
                    <p className="text-gray-600 text-sm">{group.description}</p>
                  </div>
                </div>

                {/* Pages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.pages.map((page) => (
                    <Link
                      key={page.url}
                      href={page.url}
                      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-purple-300 hover:scale-105"
                    >
                      {/* Badge */}
                      {page.badge && (
                        <div className="absolute top-3 right-3">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            page.badge === 'Dev'
                              ? 'bg-yellow-100 text-yellow-800'
                              : page.badge === 'Sample'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {page.badge}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between pr-12">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {page.label}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                        </div>
                        <p className="text-sm text-gray-600">{page.description}</p>
                        <div className="pt-2">
                          <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                            {page.url}
                          </code>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3">📖 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>Dev Pages:</strong> Development tools (hidden in production)</li>
              <li>✅ <strong>Sample Pages:</strong> Demo pages with sample event ID</li>
              <li>✅ <strong>Public Pages:</strong> Accessible without admin login</li>
              <li>✅ Click any page card to navigate directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
