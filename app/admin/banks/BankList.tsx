// File: app/admin/banks/BankList.tsx
"use client";

import React from "react";
import Link from "next/link";

// Helper to map statuscolor to Tailwind classes
function getStatusColorClasses(statuscolor: string) {
  switch (statuscolor) {
    case "green":
      return "bg-green-100 text-green-800";
    case "red":
      return "bg-red-100 text-red-800";
    case "yellow":
      return "bg-yellow-100 text-yellow-800";
    case "blue":
      return "bg-blue-100 text-blue-800";
    case "purple":
      return "bg-purple-100 text-purple-800";
    case "gray":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export interface Bank {
  id: string | number;
  logo: string | null;
  name: string;
  accountname: string;
  accountnumber: string;
  statuscolor: string;
  status: string;
}

interface BankListProps {
  banks: Bank[];
}

export default function BankList({ banks }: BankListProps) {
  const handleDelete = async (id: string | number) => {
    if (!confirm("Delete this bank account?")) return;
    await fetch("/api/admin/banks/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {banks.map((bank) => (
          <div key={bank.id} className="bg-white rounded-xl shadow-sm p-3">
            <div className="flex items-start gap-2">
              {bank.logo ? (
                <img
                  src={bank.logo}
                  alt="logo"
                  className="w-10 h-10 object-contain rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-400 text-xs">No logo</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-purple-900 text-sm truncate">
                    {bank.name}
                  </h3>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full ${getStatusColorClasses(
                      bank.statuscolor
                    )} whitespace-nowrap`}
                  >
                    {bank.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {bank.accountname}
                </p>
                <p className="text-xs font-mono text-gray-800 truncate">
                  {bank.accountnumber}
                </p>
                <div className="mt-1.5 flex gap-1.5">
                  <Link
                    href={`/admin/banks/edit/${bank.id}`}
                    className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-2 text-left text-purple-800 text-xs">Logo</th>
              <th className="p-2 text-left text-purple-800 text-xs">Name</th>
              <th className="p-2 text-left text-purple-800 text-xs">Account No.</th>
              <th className="p-2 text-left text-purple-800 text-xs">Account Name</th>
              <th className="p-2 text-left text-purple-800 text-xs">Status</th>
              <th className="p-2 text-left text-purple-800 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.id} className="hover:bg-purple-50 transition-colors">
                <td className="p-2">
                  {bank.logo ? (
                    <img src={bank.logo} alt="logo" className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                      <span className="text-purple-400 text-[10px]">No logo</span>
                    </div>
                  )}
                </td>
                <td className="p-2 font-medium text-purple-900 text-xs max-w-[120px] truncate">
                  {bank.name}
                </td>
                <td className="p-2 font-mono text-xs max-w-[100px] truncate">
                  {bank.accountnumber}
                </td>
                <td className="p-2 text-xs max-w-[120px] truncate">
                  {bank.accountname}
                </td>
                <td className="p-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full ${getStatusColorClasses(
                      bank.statuscolor
                    )}`}
                  >
                    {bank.status}
                  </span>
                </td>
                <td className="p-2 space-x-1">
                  <Link
                    href={`/admin/banks/edit/${bank.id}`}
                    className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors inline-block"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors inline-block"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
