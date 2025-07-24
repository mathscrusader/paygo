// app/upgrade/benefits/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type UpgradeLevelRow = {
  key: string;
  name: string;
  price: number;
  icon?: string | null;
  color?: string | null;
  bgcolor?: string | null;
  bordercolor?: string | null;
  description?: string | null;
};

export default function LevelBenefitsPage() {
  const router = useRouter();
  const [levelData, setLevelData] = useState<UpgradeLevelRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("paygo-selected-level");
    if (!stored) {
      router.push("/upgrade");
      return;
    }

    let key: string | undefined;
    try {
      const parsed = JSON.parse(stored);
      key = parsed?.id;
    } catch {
      router.push("/upgrade");
      return;
    }

    if (!key) {
      router.push("/upgrade");
      return;
    }

    supabase
      .from<UpgradeLevelRow>("UpgradeLevel")
      .select(
        "key, name, price, icon, color, bgcolor, bordercolor, description"
      )
      .eq("key", key)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error("Failed to load level:", error);
          setLoadError("Failed to load level benefits.");
          router.push("/upgrade");
        } else {
          setLevelData(data);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="p-6 text-center">Loading benefits…</div>;
  }

  if (loadError || !levelData) {
    return (
      <div className="p-6 text-center text-red-600">
        {loadError || "Unable to load this level."}
      </div>
    );
  }

  const {
    key,
    name,
    price,
    color = "text-gray-700",
    bgcolor = "bg-gray-100",
    bordercolor = "border-gray-300",
    description = "",
  } = levelData;

  const benefits = (description ?? "")
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const handleProceedToPayment = () => {
    // Payment page reads paygo-selected-level, but we also keep your old key just in case
    const payload = { id: key, name, price };
    localStorage.setItem("paygo-selected-level", JSON.stringify(payload));
    localStorage.setItem("paygo-upgrade-data", JSON.stringify(payload));
    router.push("/upgrade/loading");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("NGN", "₦");

  return (
    <div className="min-h-screen pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-purple-600 text-white">
        <Link href="/upgrade" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-xl">Level Benefits</span>
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Level Header */}
        <div className={cn("p-4 rounded-lg border", bordercolor, bgcolor)}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              {/* Render an icon if you want, based on levelData.icon */}
            </div>
            <div>
              <h2 className="text-lg font-bold">{name}</h2>
              <p className="font-medium">{formatCurrency(price)}</p>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-3 bg-purple-50 border-b border-gray-200">
            <h3 className="font-bold text-sm text-purple-800">
              Benefits &amp; Features
            </h3>
          </div>
          <div className="p-3">
            {benefits.length === 0 ? (
              <p className="text-sm text-gray-500">No benefits listed.</p>
            ) : (
              <ul className="space-y-2">
                {benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className={cn("h-4 w-4 shrink-0 mt-0.5", color)} />
                    <span className="text-gray-800">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button
          onClick={handleProceedToPayment}
          className={cn(
            "w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl",
            "transition-all duration-300 ease-in-out",
            "hover:shadow-lg active:scale-[0.98]"
          )}
        >
          Proceed to Payment
        </Button>

        <p className="text-center text-xs text-gray-500">
          Your upgrade will be activated immediately after payment is confirmed
        </p>
      </div>
    </div>
  );
}
