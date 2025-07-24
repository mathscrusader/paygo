// app/admin/levels/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DeleteLevelButton from '@/components/DeleteLevelButton';

// Fetch all levels
async function fetchLevels() {
  const { data, error } = await supabase
    .from('UpgradeLevel')
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data;
}

export default async function AdminLevelsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  const levels = await fetchLevels();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Upgrade Levels</h1>
        <Link
          href="/admin/levels/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + New Level
        </Link>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Key</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-left">Icon</th>
              <th className="p-3 text-left">Styles</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((lvl) => (
              <tr key={lvl.id} className="border-t">
                <td className="p-3">{lvl.key}</td>
                <td className="p-3">{lvl.name}</td>
                <td className="p-3 text-right">₦{lvl.price.toLocaleString()}</td>
                <td className="p-3">{lvl.icon}</td>
                <td className="p-3">
                  <code className="text-xs">{lvl.color}, {lvl.bgColor}, {lvl.borderColor}</code>
                </td>
                <td className="p-3 text-center space-x-2">
                  <Link
                    href={`/admin/levels/edit/${lvl.id}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                  <DeleteLevelButton id={lvl.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}