"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  approved: boolean
  createdAt: string
  meta: any
}

const PAGE_SIZE = 10

export default function TransactionsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!session) return
    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from("Transaction")
        .select("*")
        .eq("userId", session.user.id)
        .order("createdAt", { ascending: false })

      if (!error && data) {
        setTransactions(data)

        // Mark all as viewed
        await supabase
          .from("Transaction")
          .update({ viewed: true })
          .eq("userId", session.user.id)
          .eq("viewed", false)
      }

      setLoading(false)
    }

    loadTransactions()
  }, [session])

  if (!session) {
    return <div className="p-6 text-center">Redirecting...</div>
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE)
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center p-4 border-b bg-purple-600 text-white">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-lg font-semibold">Transactions</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-purple-600" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500">No transactions found.</p>
          ) : (
            <>
              {paginatedTransactions.map(tx => (
                <div
                  key={tx.id}
                  className="border rounded-lg p-4 shadow-sm flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold capitalize text-gray-700">
                      Transaction Type: {tx.type}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tx.status === "APPROVED"
                          ? "bg-green-100 text-green-600"
                          : tx.status === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Amount:</strong> ₦{Number(tx.amount).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Transaction ID:</strong> {tx.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Approved:</strong> {tx.approved ? "Yes" : "No"}
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Date:</strong> {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 rounded bg-purple-100 text-purple-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 rounded bg-purple-100 text-purple-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
