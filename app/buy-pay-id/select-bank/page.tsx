"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Bank {
  id: string;
  name: string;
  accountnumber: string;
  accountname: string;
  logo: string;
  status: string;
  statuscolor: string;
  badge: string;
}

export default function SelectBankPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Load form data
    const storedFormData = localStorage.getItem("paygo-pay-id-form");
    if (storedFormData) {
      setFormData(JSON.parse(storedFormData));
    }

    const fetchBanks = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: sbError } = await supabase
          .from("Bank")
          .select("*")
          .order("name", { ascending: true });

        if (sbError) throw sbError;
        if (!data || data.length === 0) throw new Error("No banks available");

        setBanks(data);
      } catch (err: any) {
        console.error("Bank fetch error:", err);
        setError(err.message || "Failed to load banks");
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  const handleBankSelect = (bank: Bank) => {
    localStorage.setItem("paygo-selected-bank", JSON.stringify({
      id: bank.id,
      name: bank.name,
      accountNumber: bank.accountnumber,
      accountName: bank.accountname,
      logo: bank.logo,
      status: bank.status,
      statusColor: bank.statuscolor,
      badge: bank.badge
    }));
    router.push("/buy-pay-id/payment");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          <p>Loading banks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h3 className="text-red-600 font-medium mb-2">Error Loading Banks</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-[#6B46C1] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Select Payment Method</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <p className="text-gray-600 mb-6 text-center">
          Choose your preferred bank for payment
        </p>

        {/* Banks Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {banks.map((bank) => (
            <div
              key={bank.id}
              onClick={() => handleBankSelect(bank)}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center">
                {/* Bank Logo */}
                <div className="w-16 h-16 relative mb-3">
                  <Image
                    src={bank.logo}
                    alt={bank.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-bank.png";
                      target.classList.add("object-contain");
                    }}
                  />
                </div>
                
                {/* Bank Name */}
                <h3 className="text-center font-medium text-gray-800 mb-2">
                  {bank.name}
                </h3>
                
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bank.statuscolor === 'green' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {bank.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary - Only show if formData exists */}
        {formData && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-purple-600">Amount:</span> ₦7,250
              </p>
              {formData.email && (
                <p>
                  <span className="text-purple-600">Email:</span> {formData.email}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}