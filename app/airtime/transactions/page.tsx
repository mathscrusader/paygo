"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Tx = {
  id: number
  type: "debit" | "credit"
  description: string
  amount: number
  original_amount?: number
  discount_percent?: number
  date: string
}

export default function AirtimeTransactionsPage() {
  const [txns, setTxns] = useState<Tx[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("paygo-transactions")
    if (stored) {
      try {
        setTxns(JSON.parse(stored))
      } catch {
        setTxns([])
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Link href="/airtime" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Airtime Transactions</span>
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {txns.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-8">
            No airtime transactions yet.
          </p>
        )}

        {txns
          .sort((a, b) => b.id - a.id)
          .map(tx => (
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
                  {tx.type === "debit" ? "-" : "+"}₦
                  {tx.amount.toLocaleString()}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                {new Date(tx.date).toLocaleString()}
              </div>

              {typeof tx.discount_percent === "number" && tx.discount_percent > 0 && (
                <div className="text-[11px] text-gray-500 mt-1">
                  Discount: {tx.discount_percent}% (Original ₦
                  {tx.original_amount?.toLocaleString()})
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
