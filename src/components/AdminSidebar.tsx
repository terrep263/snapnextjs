'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, FileText, Home, ChevronRight } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const adminLinks = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Main admin hub'
    },
    {
      href: '/admin/manage',
      label: 'Manage Content',
      icon: FileText,
      description: 'Edit content'
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Admin settings'
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/admin/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/purple logo/purplelogo.png" 
            alt="Snapworxx" 
            className="h-12 w-auto"
          />
          <div>
            <h2 className="text-sm font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">Snapworxx</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                  {link.label}
                </p>
                <p className="text-xs text-gray-500">{link.description}</p>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 text-purple-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-100 bg-gradient-to-t from-gray-50 to-transparent">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Admin Section</p>
          <p>Manage all aspects of your Snapworxx platform from here.</p>
        </div>
      </div>
    </div>
  );
}
