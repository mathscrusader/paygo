"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type Bank = {
  id: number;
  logo: string | null;
  name: string;
  accountnumber: string;
  accountname: string;
  status: string;
  statuscolor: string;
  badge: string;
};

export default function BanksTableClient({ banks }: { banks: Bank[] }) {
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bank account?")) return;
    await fetch("/api/admin/banks/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="w-full table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Logo</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Account Number</th>
            <th className="p-3 text-left">Account Name</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Badge Color</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => (
            <tr key={bank.id} className="border-t">
              <td className="p-3">
                {bank.logo ? (
                  <img src={bank.logo} alt="logo" className="w-10 h-10 object-cover" />
                ) : (
                  <span className="text-gray-400">No logo</span>
                )}
              </td>
              <td className="p-3">{bank.name}</td>
              <td className="p-3 font-mono">{bank.accountnumber}</td>
              <td className="p-3">{bank.accountname}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 text-sm rounded-full bg-${bank.statuscolor}-100 text-${bank.statuscolor}-800`}
                >
                  {bank.status}
                </span>
              </td>
              <td className="p-3">{bank.badge}</td>
              <td className="p-3 space-x-2">
                <Link
                  href={`/admin/banks/edit/${bank.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(bank.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
