'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Home,
  ChevronRight,
  Map,
  Calendar,
  Users,
  Shield
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const adminLinks = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Events & analytics',
      section: 'main'
    },
    {
      href: '/admin/manage',
      label: 'Admin Accounts',
      icon: Shield,
      description: 'Manage admin users',
      section: 'system'
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      description: 'System configuration',
      section: 'system'
    },
    {
      href: '/admin/resources',
      label: 'Resources',
      icon: Map,
      description: 'Page directory',
      section: 'system'
    },
  ];

  // Group links by section
  const mainLinks = adminLinks.filter(link => link.section === 'main');
  const systemLinks = adminLinks.filter(link => link.section === 'system');

  const renderLinks = (links: typeof adminLinks) => {
    return links.map((link) => {
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
    });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen flex flex-col">
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
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Overview
          </h3>
          <div className="space-y-2">
            {renderLinks(mainLinks)}
          </div>
        </div>

        {/* System Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System
          </h3>
          <div className="space-y-2">
            {renderLinks(systemLinks)}
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Links
          </h3>
          <div className="space-y-2">
            <Link
              href="/"
              className="group flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              <Home className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              <span className="text-sm">View Site</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-t from-gray-50 to-transparent">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Admin Control Panel</p>
          <p>Manage events, users, and system settings</p>
        </div>
      </div>
    </div>
  );
}
