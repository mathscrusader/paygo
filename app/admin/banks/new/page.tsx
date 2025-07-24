// app/admin/banks/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewBankPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    accountnumber: "",
    accountname: "",
    logo: "",
    status: "Active", // Default value
    statuscolor: "purple", // Default value
    badge: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Basic validation
    if (
      !form.name ||
      !form.accountnumber ||
      !form.accountname ||
      !form.status ||
      !form.statuscolor ||
      !form.badge
    ) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/banks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create bank");
      }
      router.push("/admin/banks");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 pb-16">
      {/* Header */}
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center">
          <Link href="/admin/banks" className="mr-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Add New Bank</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Bank Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. First Bank"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Account Number *</label>
              <input
                type="text"
                value={form.accountnumber}
                onChange={handleChange("accountnumber")}
                className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                placeholder="e.g. 1234567890"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Account Name *</label>
              <input
                type="text"
                value={form.accountname}
                onChange={handleChange("accountname")}
                className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo}
                onChange={handleChange("logo")}
                className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={handleChange("status")}
                  className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Status Color */}
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">Status Color *</label>
                <select
                  value={form.statuscolor}
                  onChange={handleChange("statuscolor")}
                  className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                </select>
              </div>
            </div>

            {/* Badge Text */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Badge Text *</label>
              <input
                type="text"
                value={form.badge}
                onChange={handleChange("badge")}
                className="w-full p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="e.g. Recommended"
              />
            </div>

            {/* Preview */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Preview:</h3>
              <div className="flex items-center space-x-3">
                {form.logo ? (
                  <img src={form.logo} alt="Preview" className="w-10 h-10 object-contain rounded-lg" />
                ) : (
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xs">Logo</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-purple-900">{form.name || "Bank Name"}</p>
                  <span className={`text-xs px-2 py-1 rounded-full bg-${form.statuscolor}-100 text-${form.statuscolor}-800`}>
                    {form.status || "Status"}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-lg font-medium text-white ${isSubmitting ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} transition-colors`}
            >
              {isSubmitting ? 'Creating...' : 'Create Bank Account'}
            </button>
          </form>
        </div>
      </main>

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