"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
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

export default function UpgradePaymentPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [upgradeData, setUpgradeData] = useState<{
    level: string;
    price: number;
    name: string;
  } | null>(null);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const [showOpayWarning, setShowOpayWarning] = useState(false);
  const [banks, setBanks] = useState<BankType[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankType | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedField, setCopiedField] =
    useState<"name" | "number" | "bank" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-only gate
  const [isClient, setIsClient] = useState(false);

  // Transaction number
  const [transactionNumber, setTransactionNumber] = useState<string | null>(
    null
  );

  useEffect(() => {
    setIsClient(true);

    if (loading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    setUserData({
      id: session.user.id,
      name:
        session.user.user_metadata?.fullName ||
        session.user.email?.split("@")[0] ||
        "",
      email: session.user.email || "",
    });

    // Load upgrade info from localStorage
    const sel = localStorage.getItem("paygo-selected-level");
    if (!sel) {
      router.replace("/upgrade");
      return;
    }
    const { id, name, price } = JSON.parse(sel);
    setUpgradeData({ level: id, name, price });

    // Generate TXN number
    setTransactionNumber(`TXN-${Date.now()}`);

    const t = setTimeout(() => setShowOpayWarning(true), 2000);
    return () => clearTimeout(t);
  }, [loading, session, router]);

  // Fetch Banks
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
    const maxSize = 5 * 1024 * 1024; // 5MB

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

  const handleCopy = (text: string, field: "name" | "number" | "bank") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitPayment = async () => {
    setError(null);

    if (
      !file ||
      !selectedBank ||
      !userData ||
      !upgradeData ||
      !transactionNumber
    ) {
      setError("Please select a bank and upload your payment proof.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure we have a fresh session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        throw new Error("Authentication error. Please login again.");
      }

      // Upload to Supabase Storage
      const BUCKET = "payment-evidence";
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `upgrade-evidence/${fileName}`;

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

      // Public (or signed) URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Insert transaction (camelCase to match DB)
      const transactionData = {
  userId: user.id,
  number: transactionNumber,
  amount: Number(upgradeData.price),
  status: "PENDING",
  approved: false,
  evidenceUrl: publicUrl,
  bankId: selectedBank.id,
  type: "upgrade",
  referenceId: upgradeData.level, // or upgradeData.name if that's better
  meta: {
    upgradeLevel: upgradeData.level,
    upgradeName: upgradeData.name,
  },
};


      console.log("Inserting transaction:", transactionData);

      const { error: insertError } = await supabase
        .from("Transaction")
        .insert(transactionData);

      if (insertError) {
        console.error("Detailed insert error:", insertError);
        throw new Error(insertError.message || "Failed to record transaction.");
      }

      localStorage.removeItem("paygo-selected-level");
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setError(err.message || "Payment submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || !upgradeData || !userData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <header className="bg-purple-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-full hover:bg-purple-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Bank Transfer</h1>
          </div>
        </header>

        <main className="p-4 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <button
                onClick={() => setError(null)}
                className="absolute top-1 right-1 text-red-800 hover:text-red-900"
              >
                <X className="h-4 w-4" />
              </button>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
            <h2 className="font-bold text-purple-800 mb-2">Payment Summary</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Upgrade</p>
                <p className="font-medium text-gray-800">{upgradeData.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₦{upgradeData.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Banks */}
          <section className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
            <div className="mb-3">
              <h2 className="font-bold text-purple-800">Choose Bank</h2>
              <p className="text-sm text-gray-500">
                Tap to view details & copy
              </p>
            </div>
            <div className="space-y-3">
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
                    width={40}
                    height={40}
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

          {/* Other methods */}
          <section className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
            <h2 className="font-bold text-purple-800 mb-2">
              Other Payment Methods
            </h2>
            <p className="text-sm text-gray-500">
              Digital Payment and PayPal payment coming Soon.
            </p>
          </section>
        </main>

        {/* Bank Modal */}
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

              {/* Account Details */}
              <div className="space-y-3 mb-4">
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
                        {copiedField === "name" ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

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
                        {copiedField === "number" ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

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
                        {copiedField === "bank" ? (
                          "Copied!"
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
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
                  "Submit Payment"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
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
              {/* <h3 className="text-lg font-bold mb-2">Payment Successful!</h3> */}
              <h3 className="text-lg font-bold mb-2">
                Payment Submitted Successfully!
              </h3>
              <p className="mb-4 text-gray-600">
                Your upgrade to{" "}
                <span className="font-semibold">{upgradeData.name}</span> will
                be processed within 24 hours immianately after payment is
                received.
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

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 shadow-lg">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center text-purple-600 hover:text-purple-800"
          >
            <span className="text-lg">📊</span>
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/upgrade")}
            className="flex flex-col items-center text-purple-600 hover:text-purple-800"
          >
            <span className="text-lg">💳</span>
            <span className="text-xs mt-1">Upgrade</span>
          </button>
          <button
            onClick={() => router.push("/history")}
            className="flex flex-col items-center text-purple-600 hover:text-purple-800"
          >
            <span className="text-lg">🕒</span>
            <span className="text-xs mt-1">History</span>
          </button>
        </nav>
      </div>
    </Suspense>
  );
}
