"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Copy,
  Upload,
  User,
  Hash,
  CreditCard,
  Check,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OpayWarningPopup } from "@/components/opay-warning-popup";
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

type PaymentMethod = {
  id: string;
  name: string;
  logo: string;
  demoAddress?: string;
};

export default function SelectBankPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  // Form data saved previously (fullName, email, payId, etc.)
  const [formData, setFormData] = useState<any>(null);

  // Data lists
  const [banks, setBanks] = useState<BankType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Selection
  const [selectedMethod, setSelectedMethod] = useState<
    BankType | PaymentMethod | null
  >(null);

  // Upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] =
    useState<"amount" | "number" | "bank" | "name" | null>(null);

  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOpayWarning, setShowOpayWarning] = useState(false);

  // Auto close success popup
  const SUCCESS_AUTO_CLOSE_MS = 8000;
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [showSuccess]);

  // Generate number
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

    // Load formData
    const stored = localStorage.getItem("paygo-pay-id-form");
    if (!stored) {
      router.push("/buy-pay-id");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setFormData(parsed);
    } catch {
      router.push("/buy-pay-id");
      return;
    }

    // txn number
    setTransactionNumber(`PAY-${Date.now()}`);

    // small animations + warning
    setTimeout(() => setIsLoaded(true), 100);
    const t = setTimeout(() => setShowOpayWarning(true), 2000);
    return () => clearTimeout(t);
  }, [loading, session, router]);

  // Fetch Banks (no client-side seeding!)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("Bank")
        .select(
          "id, name, logo, accountnumber, accountname, status, statuscolor, badge"
        );
      if (error) {
        console.error("Supabase fetch Bank error:", error);
        setError("Failed to load bank information.");
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
    })();
  }, []);

  // Fetch other payment methods (digital/crypto), if you use that table
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("PaymentMethod")
        .select("id, name, logo, demoAddress");
      if (error) {
        console.error("Supabase fetch PaymentMethod error:", error);
        return;
      }
      setPaymentMethods(data || []);
    })();
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

  const amount = 7250; // static here; use formData.amount if you saved it

  const handleSubmitPayment = async () => {
    setError(null);

    if (
      !file ||
      !selectedMethod ||
      !formData ||
      !transactionNumber ||
      !session?.user?.id
    ) {
      setError("Please select a method and upload payment evidence.");
      return;
    }

    setIsSubmitting(true);
    try {
      // fresh auth
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user?.id) {
        throw new Error("Authentication error. Please login again.");
      }

      // Upload to storage
      const BUCKET = "payment-evidence";
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `payid-evidence/${fileName}`;

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

      // Distinguish bank vs other
      const isBank = (selectedMethod as any).accountNumber;

      // Build meta
      const meta: any = {
        payId: formData.payId,
        fullName: formData.fullName,
        email: formData.email,
      };
      if (isBank) {
        meta.bankName = (selectedMethod as BankType).name;
        meta.accountName = (selectedMethod as BankType).accountName;
        meta.accountNumber = (selectedMethod as BankType).accountNumber;
      } else {
        const pm = selectedMethod as PaymentMethod;
        meta.methodName = pm.name;
        meta.demoAddress = pm.demoAddress;
      }

      // Insert transaction
      const transactionData = {
        userId: user.id,
        number: transactionNumber,
        amount: Number(amount),
        status: "PENDING",
        approved: false,
        evidenceUrl: publicUrl,
        bankId: isBank ? (selectedMethod as BankType).id : null,
        type: "activation", // per your Option A choice
        referenceId: formData.payId,
        meta,
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

      localStorage.removeItem("paygo-pay-id-form");
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Submission failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-50">
        <div className="animate-pulse text-purple-600">
          Loading payment options...
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-50">
        <div className="text-purple-600">Loading form data…</div>
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
              className="p-1 rounded-full hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Select Payment</h1>
          </div>
        </header>

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

        {/* Payment Summary */}
        <main className="p-4 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
            <h2 className="font-bold text-purple-800 mb-2">Payment Summary</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-800">{formData.fullName}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{formData.email}</p>
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₦{Number(amount).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(String(amount), "amount")
                    }
                    className="p-2 rounded hover:bg-gray-100"
                  >
                    <Copy className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <section className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-purple-800">Bank Transfer</h2>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Transfer directly to any of these accounts
            </p>
            <div className="space-y-3">
              {banks.map((bank, idx) => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedMethod(bank)}
                  className={cn(
                    "w-full p-3 flex items-center gap-3 border rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all",
                    isLoaded
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4",
                    bank.status.includes("fast")
                      ? "border-purple-200"
                      : "border-gray-200"
                  )}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={bank.logo}
                      alt={bank.name}
                      fill
                      className="object-contain rounded-full"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).src =
                          "/placeholder.svg")
                      }
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">{bank.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${bank.statusColor}`}
                      >
                        {bank.badge} {bank.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {bank.accountName} • {bank.accountNumber}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Other Methods */}
          {paymentMethods.length > 0 && (
            <section className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
              <h2 className="font-bold text-purple-800 mb-3">Other Methods</h2>
              <p className="text-sm text-gray-500 mb-4">Digital payment options</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((meth, idx) => (
                  <button
                    key={meth.id}
                    onClick={() => setSelectedMethod(meth)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all",
                      isLoaded
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-90"
                    )}
                    style={{ transitionDelay: `${idx * 100 + 300}ms` }}
                  >
                    <div className="relative w-12 h-12 mb-2">
                      <Image
                        src={meth.logo}
                        alt={meth.name}
                        fill
                        className="object-contain"
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).src =
                            "/placeholder.svg")
                        }
                      />
                    </div>
                    <span className="font-medium text-sm text-gray-800">
                      {meth.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate w-full">
                      {meth.demoAddress}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Modal */}
        {selectedMethod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setSelectedMethod(null);
                  setFile(null);
                  setPreview(null);
                  setUploadStatus("idle");
                }}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Details
              </h3>

              {/* User & Amount */}
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {formData.fullName}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {formData.email}
                </p>
                <div className="flex justify-between items-center">
                  <p>
                    <span className="font-medium">Amount:</span> ₦
                    {Number(amount).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleCopy(String(amount), "amount")}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Method Info */}
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                {"accountNumber" in selectedMethod ? (
                  <>
                    <p>
                      <span className="font-medium">Bank Name:</span>{" "}
                      {(selectedMethod as BankType).name}
                    </p>
                    <p>
                      <span className="font-medium">Account Name:</span>{" "}
                      {(selectedMethod as BankType).accountName}
                    </p>
                    <div className="flex justify-between items-center">
                      <p>
                        <span className="font-medium">Account Number:</span>{" "}
                        {(selectedMethod as BankType).accountNumber}
                      </p>
                      <button
                        onClick={() =>
                          handleCopy(
                            (selectedMethod as BankType).accountNumber,
                            "number"
                          )
                        }
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {(selectedMethod as PaymentMethod).demoAddress}
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(
                          (selectedMethod as PaymentMethod).demoAddress ?? "",
                          "bank"
                        )
                      }
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  Upload Payment Evidence
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={triggerFileInput}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 text-gray-700 hover:bg-gray-50"
                >
                  {preview ? "Change File" : "Select File"}
                </button>
                {preview && (
                  <div className="mt-2 relative">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    <img
                      src={preview}
                      alt="preview"
                      className="max-h-40 object-contain rounded border border-gray-200"
                    />
                    {uploadStatus === "success" && (
                      <div className="absolute bottom-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Upload successful!
                      </div>
                    )}
                  </div>
                )}
                {uploadStatus === "error" && (
                  <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitPayment}
                disabled={isSubmitting || uploadStatus !== "success"}
                className={cn(
                  "w-full mt-4 text-white py-3 text-md font-medium",
                  isSubmitting || uploadStatus !== "success"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                )}
              >
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </div>
          </div>
        )}

        {/* Success Popup */}
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

        {/* Bottom Nav (placeholder) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 shadow-lg">
          {/* Your nav buttons here */}
        </nav>
      </div>
    </Suspense>
  );
}
