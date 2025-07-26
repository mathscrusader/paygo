"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/providers";

type Bank = {
  id: string;
  name: string;
  accountNumber: string;
  accountName: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [formData, setFormData] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"amount" | "number" | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const amount = 7250;

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    const form = localStorage.getItem("paygo-pay-id-form");
    const bank = localStorage.getItem("paygo-selected-bank");

    if (!form || !bank) {
      router.push("/buy-pay-id");
      return;
    }

    try {
      setFormData(JSON.parse(form));
      setSelectedBank(JSON.parse(bank));
    } catch {
      router.push("/buy-pay-id");
    }
  }, [loading, session, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setFile(f);
  };

  const handleCopy = (text: string, field: "amount" | "number") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleChangeBank = () => {
    router.push("/buy-pay-id/select-bank");
  };

  const handleSubmit = async () => {
    if (!file || !selectedBank || !formData || !session?.user?.id) {
      setError("Please upload payment proof.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) throw new Error("Auth failed");

      const ext = file.name.split(".").pop();
      const filename = `${user.id}-${Date.now()}.${ext}`;
      const path = `payid-evidence/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-evidence")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-evidence")
        .getPublicUrl(path);

      const transactionData = {
        userId: user.id,
        number: `PAY-${Date.now()}`,
        amount,
        status: "PENDING",
        approved: false,
        evidenceUrl: publicUrl,
        bankId: selectedBank.id,
        type: "activation",
        referenceId: formData.payId,
        meta: {
          payId: formData.payId,
          fullName: formData.fullName,
          email: formData.email,
          bankName: selectedBank.name,
          accountName: selectedBank.accountName,
          accountNumber: selectedBank.accountNumber,
        },
      };

      const { error: insertError } = await supabase
        .from("Transaction")
        .insert(transactionData);

      if (insertError) throw insertError;

      localStorage.removeItem("paygo-selected-bank");
      localStorage.removeItem("paygo-pay-id-form");
      setUploadSuccess(true);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData || !selectedBank || loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full text-center bg-green-100 p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Payment Evidence Submitted!</h2>
          <p className="text-gray-700 text-sm mb-4">
            We’ve received your payment evidence. Your PAY ID will be activated after confirmation (usually within 24 hours).
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-300 p-4">
        <h1 className="text-lg font-medium">Bank Transfer</h1>
        <Link href="/dashboard" className="text-red-500 font-medium">Cancel</Link>
      </div>

      {/* Content */}
      <div className="p-4 max-w-xl mx-auto">
        {/* Row 1: Logo + Amount/Email */}
        <div className="flex items-center justify-between mb-2 gap-4 flex-wrap sm:flex-nowrap">
          <div className="w-12 h-12 bg-[#1a237e] rounded-full flex items-center justify-center">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping"></div>
              <div className="absolute inset-1 rounded-full border-2 border-yellow-400 transform rotate-45"></div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">NGN {amount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{formData.email}</p>
          </div>
        </div>

        {/* Row 2: Instruction */}
        <p className="text-center text-base mb-4 font-medium">
          Complete this bank transfer to proceed
        </p>

        {/* Selected Bank Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Selected Bank:</p>
            <p className="font-medium text-blue-800">{selectedBank.name}</p>
          </div>
          <button onClick={handleChangeBank} className="text-blue-600 text-sm underline">Change Bank</button>
        </div>

        {/* Bank Details */}
        <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
          <div className="bg-gray-100 p-3 space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-1">Amount</p>
              <div className="flex justify-between items-center">
                <p className="font-bold">₦{amount.toLocaleString()}</p>
                <button
                  onClick={() => handleCopy(String(amount), "amount")}
                  className="bg-orange-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  {copiedField === "amount" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === "amount" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <span>🔢</span> Account Number
              </p>
              <div className="flex justify-between items-center">
                <p className="font-bold">{selectedBank.accountNumber}</p>
                <button
                  onClick={() => handleCopy(selectedBank.accountNumber, "number")}
                  className="bg-orange-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  {copiedField === "number" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === "number" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <span>🏦</span> Bank Name
              </p>
              <p className="font-bold">{selectedBank.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <span>🚹</span> Account Name
              </p>
              <p className="font-bold">{selectedBank.accountName}</p>
            </div>
          </div>

          {/* Upload */}
          <div className="p-3 border-t border-gray-300">
            <p className="text-sm text-gray-700 mb-3">
              Transfer the exact amount to the account above. Your PAY ID will be generated automatically after payment confirmation. Use your registered name as the transfer description for faster processing.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              onClick={() => fileInputRef.current?.click()}
              className="block border border-gray-300 rounded p-3 text-center text-gray-600 cursor-pointer hover:bg-gray-50"
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="w-full h-32 object-contain rounded" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-white p-1 rounded-full shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : "Click to upload image"}
            </label>

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !file}
              className={`mt-4 w-full py-2.5 text-sm font-medium rounded flex justify-center items-center gap-2 ${
                isSubmitting || !file
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-400 hover:bg-orange-500 text-black"
              }`}
            >
              {isSubmitting ? "Processing..." : "I have made this bank Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
