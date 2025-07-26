"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/providers";

type Bank = {
  id: string;
  name: string;
  accountnumber: string;
  accountname: string;
};

export default function UpgradePaymentPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [formData, setFormData] = useState<any>(null);
  const [bankId, setBankId] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"amount" | "number" | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{ id: string; name: string; price: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    const form = localStorage.getItem("paygo-pay-id-form");
    const bank = localStorage.getItem("paygo-selected-bank");
    const upgrade = localStorage.getItem("paygo-selected-level");

    if (!form || !bank || !upgrade) {
      router.push("/upgrade/select-bank");
      return;
    }

    try {
      setFormData(JSON.parse(form));
      setBankId(JSON.parse(bank)?.id || null);
      setUpgradeData(JSON.parse(upgrade));
    } catch {
      router.push("/upgrade/select-bank");
    }
  }, [loading, session, router]);

  useEffect(() => {
    const fetchBank = async () => {
      if (!bankId) return;
      const { data, error } = await supabase
        .from("Bank")
        .select("id, name, accountnumber, accountname")
        .eq("id", bankId)
        .single();

      if (error || !data) {
        setError("Failed to fetch bank details.");
        return;
      }

      setSelectedBank(data);
    };

    fetchBank();
  }, [bankId]);

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
    router.push("/upgrade/select-bank");
  };

  const handleSubmit = async () => {
    if (!file || !selectedBank || !formData || !session?.user?.id || !upgradeData) {
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
      const path = `upgrade-evidence/${filename}`;

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
        number: `UPG-${Date.now()}`,
        amount: upgradeData.price,
        status: "PENDING",
        approved: false,
        evidenceUrl: publicUrl,
        bankId: selectedBank.id,
        type: "upgrade",
        referenceId: upgradeData.id,
        meta: {
          upgradeLevel: upgradeData.id,
          fullName: formData.fullName,
          email: formData.email,
          bankName: selectedBank.name,
          accountName: selectedBank.accountname,
          accountNumber: selectedBank.accountnumber,
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

  if (!formData || !selectedBank || !upgradeData || loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full text-center bg-green-100 p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Payment Evidence Submitted!</h2>
          <p className="text-gray-700 text-sm mb-4">
            We've received your payment proof. Your upgrade will be activated after confirmation.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const amount = upgradeData.price;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-300 p-4">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-medium">Bank Transfer</h1>
        <Link href="/dashboard" className="text-red-500 font-medium">Cancel</Link>
      </div>

      {/* Content */}
      <div className="p-4 max-w-xl mx-auto">
        {/* Logo + Amount */}
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

        <p className="text-center text-base mb-4 font-medium">
          Complete this bank transfer to proceed
        </p>

        {/* Bank Info */}
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
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">🔢 Account Number</p>
              <div className="flex justify-between items-center">
                <p className="font-bold">{selectedBank.accountnumber}</p>
                <button
                  onClick={() => handleCopy(selectedBank.accountnumber, "number")}
                  className="bg-orange-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                >
                  {copiedField === "number" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === "number" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">🏦 Bank Name</p>
              <p className="font-bold">{selectedBank.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">🚹 Account Name</p>
              <p className="font-bold">{selectedBank.accountname}</p>
            </div>
          </div>

          {/* Upload */}
          <div className="p-3 border-t border-gray-300">
            <p className="text-sm text-gray-700 mb-3">
              Transfer the exact amount to the account above. Your upgrade will be processed automatically after confirmation. Use your registered name as the transfer description for faster processing.
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
