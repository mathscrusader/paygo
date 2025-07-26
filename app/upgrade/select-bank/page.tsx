"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/providers";
import { supabase } from "@/lib/supabase";

type Bank = {
  id: string;
  name: string;
  logo: string;
  accountnumber: string;
  accountname: string;
  status?: string;
  emoji?: string;
};

export default function SelectUpgradeBankPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [formData, setFormData] = useState<any>(null);
  const [upgradeLevel, setUpgradeLevel] = useState<{ price: number } | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const storedForm = localStorage.getItem("paygo-pay-id-form");
      const levelData = localStorage.getItem("paygo-selected-level");

      if (!storedForm || !levelData) {
        router.push("/upgrade");
        return;
      }

      try {
        setFormData(JSON.parse(storedForm));
        setUpgradeLevel(JSON.parse(levelData));
      } catch {
        router.push("/upgrade");
        return;
      }

      supabase
        .from("Bank")
        .select("id, name, logo, accountnumber, accountname")
        .then(({ data }) => {
          if (data) {
            const withStatus = data.map((b, idx) => ({
              ...b,
              status: idx % 2 === 0 ? "fast" : "normal",
              emoji: idx % 2 === 0 ? "⚡" : "🏦",
            }));
            setBanks(withStatus);
          }
        });

      setIsVisible(true);
    }, 200);

    return () => clearTimeout(timeout);
  }, [router]);

  const handleBankSelect = (bank: Bank) => {
    localStorage.setItem("paygo-selected-bank", JSON.stringify(bank));
    router.push("/upgrade/payment");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "fast and reliable":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "fast":
        return "text-green-700 bg-green-100 border-green-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getGlowStyle = (status: string) => {
    switch (status) {
      case "fast and reliable":
        return "shadow-blue-200";
      case "fast":
        return "shadow-green-200";
      default:
        return "";
    }
  };

  if (!formData || !upgradeLevel) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#6B46C1] text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/upgrade">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Select Bank</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 mb-6 text-center">
          Choose your preferred bank for payment
        </p>

        {/* Banks Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {banks.map((bank, index) => (
            <div
              key={bank.id}
              className={`relative bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-purple-300 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out ${
                getGlowStyle(bank.status || "") ? `hover:${getGlowStyle(bank.status || "")}` : ""
              } ${isVisible ? "animate-fade-in opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "both",
              }}
              onClick={() => handleBankSelect(bank)}
            >
              {/* Logo */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                  <Image
                    src={bank.logo || "/placeholder.svg"}
                    alt={bank.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Name */}
              <h3 className="text-center font-medium text-gray-800 mb-2">
                {bank.name}
              </h3>

              {/* Badge */}
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(bank.status || "")} ${
                    bank.status !== "normal" ? "animate-pulse-slow" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 100 + 200}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <span>{bank.emoji}</span>
                  <span>{bank.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div
          className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${
            isVisible ? "animate-slide-up opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{
            animationDelay: "600ms",
            animationFillMode: "both",
          }}
        >
          <h3 className="font-semibold text-purple-800 mb-2">
            Payment Details
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-purple-600">Email:</span> {formData.email}
            </p>
            <p>
              <span className="text-purple-600">Amount:</span>{" "}
              ₦{upgradeLevel.price?.toLocaleString()}
            </p>
            <p>
              <span className="text-purple-600">Service:</span> Upgrade Payment
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
