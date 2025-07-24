"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Upload,
  X,
  User,
  Hash,
  CreditCard,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { OpayWarningPopup } from "@/components/opay-warning-popup";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/providers";

type BankType = {
  id: string;
  name: string;
  logo: string;
  accountNumber: string;
  accountName: string;
  status: string;
  statusColor: string;
  badge: string;
};

export default function ActivationPaymentPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [activationData, setActivationData] = useState<any>(null);

  const [banks, setBanks] = useState<BankType[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankType | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedField, setCopiedField] =
    useState<"amount" | "number" | "bank" | "name" | null>(null);

  const [showOpayWarning, setShowOpayWarning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isClient, setIsClient] = useState(false);

  // Auto close success popup
  const SUCCESS_AUTO_CLOSE_MS = 8000;
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [showSuccess]);

  // Generate txn number
  const [transactionNumber, setTransactionNumber] = useState<string | null>(
    null
  );

  // Init
  useEffect(() => {
    setIsClient(true);
    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    // read activation payload
    const stored = localStorage.getItem("paygo-activation-data");
    if (!stored) {
      router.push("/dashboard");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setActivationData(parsed);
    } catch {
      router.push("/dashboard");
      return;
    }

    setTransactionNumber(`ACT-${Date.now()}`);

    const t = setTimeout(() => setShowOpayWarning(true), 2000);
    return () => clearTimeout(t);
  }, [loading, session, router]);

  // Fetch banks
  useEffect(() => {
    const fetchBanks = async () => {
      const { data, error } = await supabase
        .from("Bank")
        .select(
          "id, name, logo, accountnumber, accountname, status, statuscolor, badge"
        );

      if (error) {
        console.error("Error loading banks:", error);
        setError("Failed to load bank information. Please try again.");
        return;
      }

      setBanks(
        (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          logo: b.logo,
          accountNumber: b.accountnumber,
          accountName: b.accountname,
          status: b.status,
          statusColor: b.statuscolor,
          badge: b.badge,
        }))
      );
    };

    fetchBanks();
  }, []);

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setUploadStatus("error");
      setError("No file selected");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(f.type)) {
      setUploadStatus("error");
      setError("Please upload an image (JPEG, PNG, or WebP)");
      return;
    }

    if (f.size > maxSize) {
      setUploadStatus("error");
      setError("File size too large (max 5MB)");
      return;
    }

    setUploadStatus("uploading");
    setFile(f);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setUploadStatus("success");
    };
    reader.onerror = () => {
      setUploadStatus("error");
      setError("Failed to read file");
    };
    reader.readAsDataURL(f);
  };

  const handleCopy = (
    text: string,
    field: "amount" | "number" | "bank" | "name"
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const amount = activationData?.amount ?? 15700; // fallback

  const handleSubmitPayment = async () => {
    setError(null);

    if (
      !file ||
      !selectedBank ||
      !activationData ||
      !transactionNumber ||
      !session?.user?.id
    ) {
      setError("Please select a bank and upload your payment proof.");
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user?.id) {
        throw new Error("Authentication error. Please login again.");
      }

      // Upload evidence
      const BUCKET = "payment-evidence";
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `activation-evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message || "File upload failed.");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      // Insert into Transaction table
      const transactionData = {
  userId: user.id,
  number: transactionNumber,
  amount: Number(amount),
  status: "PENDING",
  approved: false,
  evidenceUrl: publicUrl,
  bankId: selectedBank.id,
  type: "activation",
  referenceId: activationData.payId,
  meta: {
    payId: activationData.payId,
    accountNumber: activationData.accountNumber,
    bankName: activationData.bankName,
    accountName: activationData.accountName,
  },
};


      const { data: insertData, error: insertError } = await supabase
        .from("Transaction")
        .insert(transactionData)
        .select();

      console.log("Insert response (data):", insertData);
      console.log("Insert response (error):", insertError);

      if (insertError) {
        throw new Error(insertError.message || "Failed to record transaction.");
      }

      // clear, show popup
      localStorage.removeItem("paygo-activation-data");
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setError(err.message || "Payment submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!activationData) {
    return <div className="p-6 text-center">Loading activation data…</div>;
  }

  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <div className="min-h-screen flex flex-col bg-white pb-20">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-300 p-4">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-medium">PAY ID Activation Payment</h1>
          </div>
          <Link href="/dashboard" className="text-red-500 font-medium">
            Cancel
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <button
              onClick={() => setError(null)}
              className="absolute top-1 right-1 text-red-800 hover:text-red-900"
            >
              <X className="h-4 w-4" />
            </button>
            <strong>Error: </strong> {error}
          </div>
        )}

        {/* Summary Card */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-[#1a237e] rounded-full flex items-center justify-center">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-orange-400"></div>
                <div className="absolute inset-1 rounded-full border-2 border-yellow-400 rotate-45"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                NGN {Number(amount).toLocaleString()}
              </div>
              <div className="text-gray-600 text-sm">
                PAY ID: {activationData.payId}
              </div>
            </div>
          </div>

          <p className="text-center text-base mb-4">
            Complete this bank transfer to activate your PAY ID
          </p>

          {/* Choose Bank */}
          <section className="bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="font-bold text-purple-800 mb-2 text-sm">
              Choose Bank
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Tap to view details & copy
            </p>
            <div className="space-y-2">
              {banks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBank(b)}
                  className={cn(
                    "w-full p-3 flex items-center gap-3 border rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors",
                    selectedBank?.id === b.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200"
                  )}
                >
                  <Image
                    src={b.logo}
                    alt={b.name}
                    width={36}
                    height={36}
                    className="rounded-full border border-gray-200"
                  />
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">{b.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${b.statusColor}`}
                      >
                        {b.badge}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Modal when bank selected */}
        {selectedBank && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
              <button
                onClick={() => {
                  setSelectedBank(null);
                  setUploadStatus("idle");
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold mb-4">Bank Details</h3>
              <p className="mb-2 text-red-600 text-sm">
                Please transfer the exact amount and upload a receipt or
                screenshot below:
              </p>

              {/* Copy fields */}
              <div className="space-y-3 mb-4">
                {/* Amount */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Amount</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">
                        NGN {Number(amount).toLocaleString()}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(String(amount), "amount")
                        }
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      >
                        {copiedField === "amount" ? "Copied!" : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Name */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Account Name</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">
                        {selectedBank.accountName}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(selectedBank.accountName, "name")
                        }
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      >
                        {copiedField === "name" ? "Copied!" : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Account Number</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">
                        {selectedBank.accountNumber}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(selectedBank.accountNumber, "number")
                        }
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      >
                        {copiedField === "number" ? "Copied!" : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Bank Name</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">
                        {selectedBank.name}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedBank.name, "bank")}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      >
                        {copiedField === "bank" ? "Copied!" : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Proof */}
              <div className="mb-4">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Payment proof preview"
                      className="w-full h-48 object-contain rounded border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setPreview(null);
                        setFile(null);
                        setUploadStatus("idle");
                      }}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                    {uploadStatus === "success" && (
                      <div className="absolute bottom-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Upload successful!
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      onClick={triggerFileInput}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        uploadStatus === "error"
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                      )}
                    >
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload payment proof
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        (Screenshot or receipt)
                      </p>
                      {uploadStatus === "uploading" && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 text-purple-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="text-xs text-purple-600">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>
                    {uploadStatus === "error" && (
                      <p className="mt-1 text-xs text-red-500">{error}</p>
                    )}
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <Button
                onClick={handleSubmitPayment}
                disabled={isSubmitting || uploadStatus !== "success"}
                className={cn(
                  "w-full text-white py-3 text-md font-medium",
                  isSubmitting || uploadStatus !== "success"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Submit Payment Evidence"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center relative">
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Evidence Submitted!</h3>
              <p className="mb-4 text-gray-600 text-sm">
                We’ve received your payment evidence. We’ll verify it and
                activate your PAY ID once payment is confirmed (usually within
                24 hours).
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Opay Warning */}
        {showOpayWarning && (
          <OpayWarningPopup onClose={() => setShowOpayWarning(false)} />
        )}
      </div>
    </Suspense>
  );
}
