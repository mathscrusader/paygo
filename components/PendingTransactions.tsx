// components/PendingTransactions.tsx
"use client";

import { useState } from "react";
import type { Transaction } from "@prisma/client";

export default function PendingTransactions({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [message, setMessage] = useState<string | null>(null);

  const approve = async (id: string) => {
    console.log("Approving", id);
    try {
      const res = await fetch("/api/transaction/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      });
      console.log("Approve response status:", res.status);
      if (res.ok) {
        setMessage("Transaction approved!");
        setTransactions((txs) => txs.filter((t) => t.id !== id));
        setTimeout(() => setMessage(null), 3000);
      } else {
        const text = await res.text();
        console.error("Failed to approve:", text);
        setMessage("Failed to approve");
      }
    } catch (err) {
      console.error("Network error approving:", err);
      setMessage("Error approving transaction");
    }
  };

  const reject = async (id: string) => {
    console.log("Rejecting", id);
    try {
      const res = await fetch("/api/transaction/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      });
      console.log("Reject response status:", res.status);
      if (res.ok) {
        setMessage("Transaction rejected!");
        setTransactions((txs) => txs.filter((t) => t.id !== id));
        setTimeout(() => setMessage(null), 3000);
      } else {
        const text = await res.text();
        console.error("Failed to reject:", text);
        setMessage("Failed to reject");
      }
    } catch (err) {
      console.error("Network error rejecting:", err);
      setMessage("Error rejecting transaction");
    }
  };

  if (transactions.length === 0) {
    return (
      <>
        {message && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
            {message}
          </div>
        )}
        <p>No pending transactions.</p>
      </>
    );
  }

  return (
    <>
      {message && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {message}
        </div>
      )}
      <ul className="space-y-4">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex justify-between items-center border p-4 rounded"
          >
            <div>
              <p>
                <strong>ID:</strong> {tx.id}
              </p>
              <p>
                <strong>Number:</strong> {tx.number}
              </p>
              <p>
                <strong>Amount:</strong> {tx.amount}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(tx.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => approve(tx.id)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => reject(tx.id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
