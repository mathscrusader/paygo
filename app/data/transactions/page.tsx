// app/data/transactions/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"

type Tx = {
  id: number
  type: "debit" | "credit"
  description: string
  amount: number
  original_amount?: number
  discount_percent?: number
  date: string
}

export default function DataTransactionsPage() {
  const [txns, setTxns] = useState<Tx[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("paygo-transactions")
    if (!stored) return
    try {
      const all: Tx[] = JSON.parse(stored)
      // keep only data purchases
      const onlyData = all.filter(t =>
        t.description?.toLowerCase().startsWith("data purchase")
      )
      // newest first
      onlyData.sort((a, b) => b.id - a.id)
      setTxns(onlyData)
    } catch {
      setTxns([])
    }
  }, [])

  const formatNaira = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 })

  const handleClear = () => {
    // remove only data rows from localStorage, keep others
    const stored = localStorage.getItem("paygo-transactions")
    if (!stored) return
    try {
      const all: Tx[] = JSON.parse(stored)
      const remaining = all.filter(
        t => !t.description?.toLowerCase().startsWith("data purchase")
      )
      localStorage.setItem("paygo-transactions", JSON.stringify(remaining))
      setTxns([])
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/data" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Data Transactions</span>
        </Link>

        {txns.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2 rounded-full hover:bg-gray-100 text-red-600"
            title="Clear data transactions"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {txns.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-10">
            No data transactions yet.
          </p>
        )}

        {txns.map(tx => (
          <div
            key={tx.id}
            className="border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-800">
                {tx.description}
              </span>
              <span
                className={`text-sm font-semibold ${
                  tx.type === "debit" ? "text-red-600" : "text-green-600"
                }`}
              >
                {tx.type === "debit" ? "-" : "+"}
                {formatNaira(tx.amount)}
              </span>
            </div>
            <div className="text-[11px] text-gray-500">
              {new Date(tx.date).toLocaleString()}
            </div>

            {typeof tx.discount_percent === "number" &&
              tx.discount_percent > 0 && (
                <div className="text-[11px] text-gray-500 mt-1">
                  Discount: {tx.discount_percent}% (Original{" "}
                  {formatNaira(tx.original_amount || 0)})
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  )
}
