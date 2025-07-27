"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      const res = await fetch("/api/admin/withdrawals")
      const json = await res.json()
      if (res.ok) {
        setRequests(json.data)
      }
      setLoading(false)
    }

    fetchRequests()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Withdrawal Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No withdrawal requests yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium">User</th>
                <th className="p-3 text-left font-medium">Amount</th>
                <th className="p-3 text-left font-medium">Method</th>
                <th className="p-3 text-left font-medium">Details</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-t">
                  <td className="p-3">{req.user?.full_name || "Unknown"}</td>
                  <td className="p-3 font-semibold">₦{req.amount.toLocaleString()}</td>
                  <td className="p-3 capitalize">{req.method}</td>
                  <td className="p-3 text-xs text-gray-700">
                    {req.method === "bank" ? (
                      <>
                        <div>{req.account_name}</div>
                        <div>{req.bank_name}</div>
                        <div>{req.account_number}</div>
                      </>
                    ) : (
                      "Credited to wallet"
                    )}
                  </td>
                  <td className="p-3">{new Date(req.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge variant={req.status === "paid" ? "success" : "warning"}>
                      {req.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
