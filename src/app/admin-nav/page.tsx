import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin-auth';
import AdminNavigation from '@/components/AdminNavigation';

export const metadata = {
  title: 'Admin Navigation - Snapworxx',
  description: 'Admin section navigation and quick links',
};

export default async function AdminNavigationPage() {
  const session = await verifyAdminSession();
  if (!session?.authenticated) {
    redirect('/admin/login');
  }
  return <AdminNavigation />;
}
