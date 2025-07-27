"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"
import {
  Loader2,
  ArrowLeft,
  Banknote,
  Phone,
  Wifi,
  Search,
  X,
  SortAsc,
  SortDesc,
} from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 10

export default function TransactionsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<"all" | "wallet" | "airtime" | "data">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [ascending, setAscending] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any>(null)

  useEffect(() => {
    if (!session) return

    const syncClientTransactions = async (userId: string) => {
      const raw = localStorage.getItem("paygo-transactions")
      if (!raw) return

      let parsed: any[]
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }

      const transactionsToSync = parsed.filter((tx: any) => {
        const isData = tx.description?.toLowerCase().startsWith("data purchase")
        const isAirtime = !isData
        return (isData || isAirtime) && !tx.synced
      })

      if (transactionsToSync.length === 0) return

      const toInsert = transactionsToSync.map(tx => ({
        userId,
        type: tx.type,
        category: tx.description?.toLowerCase().startsWith("data purchase")
          ? "data"
          : "airtime",
        description: tx.description,
        amount: tx.amount,
        original_amount: tx.original_amount || null,
        discount_percent: tx.discount_percent || null,
        date: new Date(tx.date).toISOString(),
        meta: { id: tx.id },
      }))

      const { error } = await supabase.from("ClientTransaction").insert(toInsert)

      if (!error) {
        const updated = parsed.map(tx => {
          const matched = transactionsToSync.find(t => t.id === tx.id)
          return matched ? { ...tx, synced: true } : tx
        })
        localStorage.setItem("paygo-transactions", JSON.stringify(updated))
      }
    }

    const loadTransactions = async () => {
      await syncClientTransactions(session.user.id)

      const walletPromise = supabase
        .from("Transaction")
        .select("*")
        .eq("userId", session.user.id)
        .order("createdAt", { ascending: false })

      const localRaw = localStorage.getItem("paygo-transactions")
      let local: any[] = []

      if (localRaw) {
        try {
          const parsed: any[] = JSON.parse(localRaw)
          local = parsed.map(tx => {
            const isData = tx.description?.toLowerCase().startsWith("data purchase")
            return {
              ...tx,
              id: tx.id.toString(),
              source: isData ? "data" : "airtime",
            }
          })
        } catch {
          local = []
        }
      }

      const [{ data: walletData, error }] = await Promise.all([walletPromise])
      let merged: any[] = []

      if (!error && walletData) {
        const walletTx = walletData.map(tx => ({
          ...tx,
          source: "wallet",
        }))
        merged = [...walletTx, ...local]
      } else {
        merged = [...local]
      }

      setTransactions(merged)

      await supabase
        .from("Transaction")
        .update({ viewed: true })
        .eq("userId", session.user.id)
        .eq("viewed", false)

      setLoading(false)
    }

    loadTransactions()
  }, [session])

  const formatNaira = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 })

  const iconFor = (src: string) =>
    src === "wallet" ? (
      <Banknote className="h-5 w-5 text-[#7E22CE]" />
    ) : src === "airtime" ? (
      <Phone className="h-5 w-5 text-[#FF9500]" />
    ) : (
      <Wifi className="h-5 w-5 text-[#007AFF]" />
    )

  if (!session) return <div className="p-6 text-center">Redirecting...</div>

  const filtered = transactions.filter(tx => {
    const matchSource = filter === "all" || tx.source === filter
    const matchSearch =
      searchQuery.trim() === "" ||
      (tx.source === "wallet"
        ? tx.type.toLowerCase().includes(searchQuery.toLowerCase())
        : tx.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchSource && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    const aTime = new Date(a.source === "wallet" ? a.createdAt : a.date).getTime()
    const bTime = new Date(b.source === "wallet" ? b.createdAt : b.date).getTime()
    return ascending ? aTime - bTime : bTime - aTime
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#7E22CE] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-semibold">Transaction History</span>
          </Link>
          <button
            onClick={() => setAscending(prev => !prev)}
            className="p-2 rounded-full hover:bg-[#008A8F]"
            title="Toggle sort order"
          >
            {ascending ? (
              <SortAsc className="h-5 w-5" />
            ) : (
              <SortDesc className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#008A8F]"
          />
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {["all", "wallet", "airtime", "data"].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab as any)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === tab
                  ? "bg-white text-[#7E22CE]"
                  : "bg-transparent text-white border border-white"
              }`}
            >
              {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-[#7E22CE]" />
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-10 text-center p-6">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Banknote className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">No transactions found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery.trim() === ""
                    ? "You don't have any transactions yet"
                    : "No transactions match your search"}
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-500 mb-2 px-2">
                  Showing {paginated.length} of {sorted.length} transactions
                </div>
                
                {paginated.map(tx => (
                  <div
                    key={tx.id}
                    className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1 relative border border-gray-100"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.source === "wallet" ? "bg-[#7E22CE]/10" : 
                          tx.source === "airtime" ? "bg-[#FF9500]/10" : "bg-[#007AFF]/10"
                        }`}>
                          {iconFor(tx.source)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {tx.source === "wallet"
                              ? `${tx.type}`
                              : `${tx.description}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.source === "wallet" ? tx.createdAt : tx.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === "credit" || (tx.source === "wallet" && tx.approved)
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {tx.source === "wallet"
                            ? formatNaira(Number(tx.amount))
                            : `${tx.type === "debit" ? "-" : "+"}${formatNaira(tx.amount)}`}
                        </p>
                        {tx.source !== "wallet" && tx.discount_percent && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatNaira(tx.original_amount || 0)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {tx.source === "wallet" && (
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {tx.approved ? "Completed" : "Pending"}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {tx.id.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-4 py-2 rounded-full bg-white border border-[#7E22CE] text-[#7E22CE] disabled:opacity-50 flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-4 py-2 rounded-full bg-[#7E22CE] text-white disabled:opacity-50 flex items-center gap-1"
                    >
                      Next
                      <ArrowLeft className="h-4 w-4 transform rotate-180" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className={`p-4 ${
              selectedTx.source === "wallet" ? "bg-[#7E22CE]" : 
              selectedTx.source === "airtime" ? "bg-[#FF9500]" : "bg-[#007AFF]"
            } text-white`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {selectedTx.source[0].toUpperCase() + selectedTx.source.slice(1)} Transaction
                </h2>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-full hover:bg-black/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/20">
                    {iconFor(selectedTx.source)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedTx.source === "wallet"
                        ? selectedTx.type
                        : selectedTx.description}
                    </p>
                    <p className="text-sm opacity-90">
                      {new Date(selectedTx.source === "wallet" ? selectedTx.createdAt : selectedTx.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`text-xl font-bold ${
                  selectedTx.type === "credit" || (selectedTx.source === "wallet" && selectedTx.approved)
                    ? "text-green-300"
                    : "text-red-300"
                }`}>
                  {selectedTx.source === "wallet"
                    ? formatNaira(Number(selectedTx.amount))
                    : `${selectedTx.type === "debit" ? "-" : "+"}${formatNaira(selectedTx.amount)}`}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Transaction Details</h3>
                
                {selectedTx.source === "wallet" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${
                        selectedTx.approved ? "text-green-600" : "text-yellow-600"
                      }`}>
                        {selectedTx.approved ? "Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium">{formatNaira(selectedTx.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction Type</span>
                      <span className="font-medium capitalize">{selectedTx.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-medium">{selectedTx.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">
                        {new Date(selectedTx.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Description</span>
                      <span className="font-medium text-right">{selectedTx.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium">{formatNaira(selectedTx.amount)}</span>
                    </div>
                    {selectedTx.discount_percent && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-medium">
                          {selectedTx.discount_percent}% (Saved {formatNaira(
                            (selectedTx.original_amount || 0) - selectedTx.amount
                          )})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className={`font-medium ${
                        selectedTx.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                        {selectedTx.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">
                        {new Date(selectedTx.date).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-[#7E22CE] text-white rounded-lg font-medium mt-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}