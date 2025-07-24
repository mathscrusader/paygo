// File: app/admin/banks/edit/[id]/EditBankForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface EditBankFormProps {
  bank: {
    id: string;
    name: string;
    accountnumber: string;
    accountname: string;
    logo: string | null;
    status: string;
    statuscolor: string;
  };
}

type Notification = { type: "success" | "error"; message: string } | null;

export default function EditBankForm({ bank }: EditBankFormProps) {
  const [name, setName] = useState(bank.name);
  const [accountNumber, setAccountNumber] = useState(bank.accountnumber);
  const [accountName, setAccountName] = useState(bank.accountname);
  const [logo, setLogo] = useState(bank.logo || "");
  const [status, setStatus] = useState(bank.status);
  const [statusColor, setStatusColor] = useState(bank.statuscolor);
  const [notification, setNotification] = useState<Notification>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/banks/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bank.id,
        name,
        accountnumber: accountNumber,
        accountname: accountName,
        logo,
        status,
        statuscolor: statusColor,
      }),
    });
    if (res.ok) {
      setNotification({ type: "success", message: "Bank account updated successfully. Redirecting in 5 seconds..." });
      setTimeout(() => router.push("/admin/banks"), 5000);
    } else {
      setNotification({ type: "error", message: "Failed to update bank account. Redirecting in 5 seconds..." });
      setTimeout(() => router.push("/admin/banks"), 5000);
    }
  };

  return (
    <>
      {notification && (
        <div
          className={`p-4 mb-4 text-sm rounded ${
            notification.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Bank Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Logo URL</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Status</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-purple-700 text-xs font-medium mb-1">Status Color</label>
            <select
              value={statusColor}
              onChange={(e) => setStatusColor(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="gray">Gray</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.push("/admin/banks")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </>
  );
}