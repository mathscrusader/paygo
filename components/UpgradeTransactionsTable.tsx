// components/UpgradeTransactionsTable.tsx
"use client"

import React, { useState } from "react"
import { Eye, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"

type TxRow = {
  id: string
  number: string
  amount: number
  status: string
  approved: boolean
  createdAt: string
  evidenceUrl: string | null
  userId: string | null
  bankId: string | null
  type: string
  user?: { full_name: string | null }
}

type Props = { initialTx: TxRow[] }

export default function UpgradeTransactionsTable({ initialTx }: Props) {
  const [rows, setRows] = useState<TxRow[]>(initialTx)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<{
    tx: TxRow
    signedUrl: string | null
    loading: boolean
  } | null>(null)

  async function handleAction(id: string, approve: boolean) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json.error || "Update failed")
        return
      }
      setRows(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, approved: approve, status: approve ? "APPROVED" : "REJECTED" }
            : r
        )
      )
    } catch {
      alert("Failed to update transaction.")
    } finally {
      setBusyId(null)
    }
  }

  async function openInvoice(tx: TxRow) {
    setViewing({ tx, signedUrl: null, loading: true })
    if (!tx.evidenceUrl) {
      setViewing(v => (v ? { ...v, loading: false } : v))
      return
    }

    try {
      const res = await fetch("/api/admin/sign-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathOrUrl: tx.evidenceUrl }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        console.warn("Sign error:", json.error)
        setViewing(v => (v ? { ...v, loading: false } : v))
        return
      }
      setViewing(v => (v ? { ...v, signedUrl: json.url, loading: false } : v))
    } catch (e) {
      console.error(e)
      setViewing(v => (v ? { ...v, loading: false } : v))
    }
  }

  return (
    <>
      {/* Mobile-style cards for ALL screens */}
      <div className="space-y-3 p-3 max-w-5xl mx-auto">
        {rows.map(tx => {
          const created = new Date(tx.createdAt)
          return (
            <div
              key={tx.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              {/* Amount & Date */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-lg font-bold text-purple-700">
                    ₦{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {created.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={tx.status} approved={tx.approved} />
              </div>

              {/* Name + Txn No */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-800">
                  {tx.user?.full_name || "Unknown User"}
                </p>
                <p className="text-[11px] text-gray-500">#{tx.number}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openInvoice(tx)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>

                {!tx.approved && tx.status !== "REJECTED" && (
                  <>
                    <button
                      disabled={busyId === tx.id}
                      onClick={() => handleAction(tx.id, true)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-600 text-white text-xs disabled:opacity-50"
                    >
                      {busyId === tx.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      disabled={busyId === tx.id}
                      onClick={() => handleAction(tx.id, false)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs disabled:opacity-50"
                    >
                      {busyId === tx.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {viewing && (
        <InvoiceModal
          tx={viewing.tx}
          signedUrl={viewing.signedUrl}
          loading={viewing.loading}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

function StatusBadge({ status, approved }: { status: string; approved: boolean }) {
  const cls = approved
    ? "bg-green-100 text-green-700"
    : status === "REJECTED"
    ? "bg-red-100 text-red-700"
    : "bg-yellow-100 text-yellow-700"
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  )
}

function InvoiceModal({
  tx,
  signedUrl,
  loading,
  onClose,
}: {
  tx: TxRow
  signedUrl: string | null
  loading: boolean
  onClose: () => void
}) {
  const created = new Date(tx.createdAt)
  const isPdf = signedUrl?.toLowerCase().endsWith(".pdf")

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-[fadeIn_.2s_ease]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-base font-bold text-gray-800">Transaction Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-sm text-gray-700 space-y-4">
          <Section title="Overview">
            <Row label="Transaction No." value={`#${tx.number}`} />
            <Row label="Amount" value={`₦${tx.amount.toLocaleString()}`} strong />
            <Row label="Status" value={tx.status} badge />
            <Row label="Approved" value={tx.approved ? "Yes" : "No"} />
            <Row label="Date" value={created.toLocaleString()} />
          </Section>

          <Section title="User & Type">
            <Row label="User" value={tx.user?.full_name || "Unknown"} />
            <Row label="Type" value={tx.type} />
            {tx.bankId && <Row label="Bank" value={tx.bankId} />}
          </Section>

          <Section title="Evidence">
            {loading ? (
              <p className="text-xs text-gray-500">Loading evidence...</p>
            ) : signedUrl ? (
              <>
                {isPdf ? (
                  <div className="w-full h-64 border rounded-md overflow-hidden">
                    <iframe src={signedUrl} className="w-full h-full" title="Evidence PDF" />
                  </div>
                ) : (
                  <img
                    src={signedUrl}
                    alt="Evidence"
                    className="w-full h-auto rounded-md border"
                  />
                )}
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  Open in new tab <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <p className="text-xs text-gray-500">No evidence uploaded.</p>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
  badge,
}: {
  label: string
  value: React.ReactNode
  strong?: boolean
  badge?: boolean
}) {
  if (badge) {
    const v = String(value)
    const cls =
      v === "APPROVED"
        ? "bg-green-100 text-green-700"
        : v === "REJECTED"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700"
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
          {v}
        </span>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-right text-xs ${strong ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  )
}
