// File: app/admin/banks/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import BankList, { Bank } from './BankList';

async function fetchBanks(): Promise<Bank[]> {
  const { data: banks, error } = await supabase
    .from('Bank')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return banks || [];
}

export default async function AdminBanksPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  let banks: Bank[];
  try {
    banks = await fetchBanks();
  } catch (e: any) {
    console.error('Error loading banks:', e);
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Failed to load bank accounts: {e.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-16">
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Bank Accounts</h1>
          <Link
            href="/admin/banks/new"
            className="px-4 py-2 bg-white text-purple-700 rounded-full font-medium hover:bg-purple-100 transition-colors text-sm"
          >
            + Add New Bank
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <BankList banks={banks} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-purple-100 flex justify-around p-2">
        <Link href="/admin" className="flex flex-col items-center text-purple-700 p-1">
          {/* Dashboard Icon */}
        </Link>
        <Link href="/admin/banks" className="flex flex-col items-center text-purple-700 font-bold p-1">
          {/* Banks Icon */}
        </Link>
        <Link href="/admin/payids" className="flex flex-col items-center text-purple-700 p-1">
          {/* Pay IDs Icon */}
        </Link>
      </nav>

      {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-purple-100 flex justify-around p-2">
              <Link href="/admin" className="flex flex-col items-center text-purple-700 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[10px] mt-0.5">Dashboard</span>
              </Link>
              <Link href="/admin/banks" className="flex flex-col items-center text-purple-700 font-bold p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9-4 9 4m-9-4v20m-6-9l9 4 9-4m-9-7v10" />
                </svg>
                <span className="text-[10px] mt-0.5">Banks</span>
              </Link>
              <Link href="/admin/payid" className="flex flex-col items-center text-purple-700 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-[10px] mt-0.5">Pay IDs</span>
              </Link>
            </nav>
    </div>
  );
}
