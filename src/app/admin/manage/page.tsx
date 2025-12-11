'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';

interface AdminAccount {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  created_at: string;
}

export default function AdminManagePage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'admin',
  });

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'verify' }),
      });

      const data = await res.json();

      if (!data.authenticated) {
        router.push('/admin/login');
        return;
      }

      setCurrentUser(data.email);
      setCurrentRole(data.role);

      // Only super_admin can access this page
      if (data.role !== 'super_admin') {
        setError('Only super admins can manage admin accounts');
        return;
      }

      loadAdmins();
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/admin/login');
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/admin/list-admins', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load admins');
      }

      const data = await res.json();
      setAdmins(data.admins || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admin accounts');
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('All fields required');
      return;
    }

    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create admin');
        return;
      }

      setSuccess(`Admin account created successfully!`);
      setFormData({ email: '', password: '', fullName: '', role: 'admin' });
      setShowAddForm(false);
      loadAdmins();
    } catch (err) {
      setError('Server error');
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (adminEmail === currentUser) {
      setError('Cannot delete your own account');
      return;
    }

    if (!confirm(`Delete admin account: ${adminEmail}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete admin');
        return;
      }

      setSuccess('Admin account deleted');
      loadAdmins();
    } catch (err) {
      setError('Server error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (currentRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">Only super admins can manage admin accounts.</p>
          <button
            onClick={handleLogout}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1">
      <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image 
            src="/purple logo/purplelogo.png" 
            alt="SnapWorxx Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-gray-700 hover:text-purple-600 font-semibold text-sm transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <span className="text-3xl">👥</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Admin Accounts</h1>
          <p className="text-gray-600">Logged in as: <span className="font-semibold text-gray-900">{currentUser}</span></p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Add Admin Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add New Admin
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Admin Account</h2>
            <form onSubmit={handleAddAdmin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Min 12 characters"
                />
                <p className="text-xs text-gray-600 mt-1">At least 12 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="admin">Admin (manage promos only)</option>
                  <option value="super_admin">Super Admin (full access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Create Admin Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin Accounts List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Current Admin Accounts
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Total: <span className="font-semibold text-gray-900">{admins.length}</span> account{admins.length !== 1 ? 's' : ''}
            </p>

            {admins.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <span className="text-3xl">👤</span>
                </div>
                <p className="text-gray-600 font-semibold mb-1">No Admin Accounts Yet</p>
                <p className="text-gray-500 text-sm mb-6">Create your first admin account to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Email</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Role</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Added</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, index) => (
                      <tr key={admin.id} className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                        <td className="py-4 px-4 text-gray-900 font-medium">{admin.full_name}</td>
                        <td className="py-4 px-4 text-gray-600 text-sm">{admin.email}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            admin.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.role === 'super_admin' ? '👑 Super Admin' : '🔑 Admin'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            admin.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.is_active ? '✓ Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-center">
                            {admin.email === currentUser ? (
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">You</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all border border-red-200 hover:border-red-300"
                                title="Delete this admin account"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Super Admins have full access to all admin features. Regular Admins can only manage promotional events. You cannot delete your own account for security reasons.
          </p>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
