'use client';

import Link from 'next/link';

export default function BankActions({ bankId }: { bankId: string }) {
  const handleDelete = async () => {
    if (!confirm('Delete this bank account?')) return;
    await fetch('/api/admin/banks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bankId }),
    });
    window.location.reload();
  };

  return (
    <>
      <Link
        href={`/admin/banks/edit/${bankId}`}
        className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors inline-block"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors inline-block"
      >
        Delete
      </button>
    </>
  );
}