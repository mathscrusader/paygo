"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Copy, Check, X } from "lucide-react";
import { useAuth } from "@/app/providers";

export default function UpgradePaymentPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [upgradeData, setUpgradeData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"amount" | "number" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const amount = upgradeData?.price || 0;

  useEffect(() => {
    if (loading) return;
    if (!session) return router.replace("/login");

    const upgrade = localStorage.getItem("paygo-selected-level");
    if (!upgrade) return router.replace("/upgrade");

    setUserData({
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.fullName || session.user.email,
    });

    setUpgradeData(JSON.parse(upgrade));

    supabase
      .from("Bank")
      .select("id, name, accountnumber, accountname")
      .then(({ data }) => setBanks(data || []));
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

  const handleSubmit = async () => {
    if (!file || !selectedBank || !upgradeData || !userData) {
      setError("Please complete all fields and upload a proof.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const filename = `${userData.id}-${Date.now()}.${ext}`;
      const path = `upgrade-evidence/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-evidence")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-evidence")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("Transaction").insert({
        userId: userData.id,
        number: `TXN-${Date.now()}`,
        amount: amount,
        status: "PENDING",
        approved: false,
        evidenceUrl: publicUrl,
        bankId: selectedBank.id,
        type: "upgrade",
        referenceId: upgradeData.level,
        meta: {
          upgradeLevel: upgradeData.level,
          upgradeName: upgradeData.name,
        },
      });

      if (insertError) throw insertError;

      localStorage.removeItem("paygo-selected-level");
      setUploadSuccess(true);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userData || !upgradeData || loading) return <div className="p-6 text-center">Loading...</div>;
  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full text-center bg-green-100 p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Evidence Submitted!</h2>
          <p className="text-gray-700 text-sm mb-4">
            Your upgrade to <strong>{upgradeData.name}</strong> will be processed after payment confirmation.
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-300 p-4">
        <h1 className="text-lg font-medium">Bank Transfer</h1>
        <Link href="/dashboard" className="text-red-500 font-medium">Cancel</Link>
      </div>

      <div className="p-4 max-w-xl mx-auto">
        {/* Badge + Amount + Email */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-12 h-12 bg-[#1a237e] rounded-full flex items-center justify-center">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping"></div>
              <div className="absolute inset-1 rounded-full border-2 border-yellow-400 transform rotate-45"></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">NGN {amount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>
        </div>

        {/* Instruction */}
        <p className="text-center text-base mb-4 font-medium">
          Complete this bank transfer to proceed
        </p>

        {/* Selected Bank */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Selected Bank:</p>
            <p className="font-medium text-blue-800">{selectedBank?.name || "None Selected"}</p>
          </div>
          <button
            onClick={() => setSelectedBank(null)}
            className="text-blue-600 text-sm underline"
          >
            Change Bank
          </button>
        </div>

        {/* Bank Selection */}
        {!selectedBank && (
          <div className="space-y-2 mb-4">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className="w-full p-3 border border-gray-300 rounded hover:bg-gray-50 text-left"
              >
                <p className="font-semibold text-gray-800">{bank.name}</p>
                <p className="text-sm text-gray-500">{bank.accountName} • {bank.accountNumber}</p>
              </button>
            ))}
          </div>
        )}

        {/* Bank Details & Upload */}
        {selectedBank && (
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
                <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">🏦 Bank Name</p>
                <p className="font-bold">{selectedBank.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1 flex items-center gap-1">🚹 Account Name</p>
                <p className="font-bold">{selectedBank.accountName}</p>
              </div>
            </div>

            <div className="p-3 border-t border-gray-300">
              <p className="text-sm text-gray-700 mb-3">
                Transfer the exact amount to the account above. Your upgrade will be confirmed after payment. Use your registered name as the transfer description for faster processing.
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
        )}
      </div>
    </div>
  );
}
