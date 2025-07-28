"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Country {
  id?: string;
  name: string;
  code: string;
  currency_symbol?: string;
  market_value?: number;
}

export default function AdminCurrencyPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("name, code, currency_symbol, market_value")
        .order("name");

      if (error) {
        console.error("Error fetching countries:", error.message);
      } else {
        setCountries(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleInputChange = (
    idx: number,
    field: "currency_symbol" | "market_value",
    value: string
  ) => {
    const updated = [...countries];
    if (field === "market_value") {
      updated[idx][field] = parseFloat(value);
    } else {
      updated[idx][field] = value;
    }
    setCountries(updated);
  };

  const handleSave = async (idx: number) => {
    const row = countries[idx];
    setSavingId(row.code);

    const { error } = await supabase
      .from("countries")
      .update({
        currency_symbol: row.currency_symbol || null,
        market_value: row.market_value || null,
      })
      .eq("code", row.code);

    setSavingId(null);
    if (error) {
      alert("Failed to update currency: " + error.message);
    } else {
      alert("Currency updated successfully");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Currency Management</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 py-6 max-w-5xl">
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f0f2ff] text-left text-[#4B3A8C] font-semibold">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Market Value (₦)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      No countries found.
                    </td>
                  </tr>
                ) : (
                  countries.map((country, idx) => (
                    <tr
                      key={country.code}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 font-medium text-gray-800">
                        {country.name}
                      </td>
                      <td className="p-3 text-gray-600">{country.code}</td>
                      <td className="p-3">
                        <input
                          value={country.currency_symbol || ""}
                          onChange={(e) =>
                            handleInputChange(idx, "currency_symbol", e.target.value)
                          }
                          className="w-20 border px-2 py-1 rounded text-sm"
                          placeholder="₦"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={country.market_value || ""}
                          onChange={(e) =>
                            handleInputChange(idx, "market_value", e.target.value)
                          }
                          className="w-24 border px-2 py-1 rounded text-sm"
                          placeholder="Rate"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleSave(idx)}
                          disabled={savingId === country.code}
                          className="bg-[#34296B] hover:bg-[#4B3A8C] text-white px-3 py-1 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {savingId === country.code ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
