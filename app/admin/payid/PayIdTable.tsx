"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  ArrowLeft,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

type Row = {
  id: string;
  number: string;
  amount: number;
  status: string;
  approved: boolean;
  createdAt: string;
  evidenceUrl: string | null;
  signedEvidenceUrl?: string | null;
  referenceId: string | null;
  email?: string;
  full_name?: string;
  meta: any;
};

export default function PayIdTable({
  rows,
  approveAction,
  declineAction,
}: {
  rows: Row[];
  approveAction: (id: string) => Promise<{ success: boolean; message: string }>;
  declineAction: (id: string) => Promise<{ success: boolean; message: string }>;
}) {
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  const handleAction = async (
    id: string,
    action: (id: string) => Promise<{ success: boolean; message: string }>
  ) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await action(id);
      toast.success(result.message);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
      {/* Main Table */}
      {!selectedRow && (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-xs font-medium text-gray-500 text-left">
                User
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 text-left">
                Pay ID
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 text-left">
                Amount
              </th>
              <th className="p-3 text-xs font-medium text-gray-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="p-3 text-sm font-medium text-gray-900">
                  {row.full_name || "N/A"}
                </td>
                <td className="p-3 text-sm text-gray-500">{row.number}</td>
                <td className="p-3 text-sm text-gray-900">
                  ₦{row.amount?.toLocaleString()}
                </td>
                <td className="p-3 text-sm text-gray-500 flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedRow(row)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {!row.approved && row.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleAction(row.id, approveAction)}
                        disabled={isLoading[row.id]}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        {isLoading[row.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(row.id, declineAction)}
                        disabled={isLoading[row.id]}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        {isLoading[row.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detail View */}
      {selectedRow && (
        <div className="p-4">
          <button
            onClick={() => setSelectedRow(null)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Transaction Details
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedRow.full_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedRow.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pay ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedRow.number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-sm font-medium text-gray-900">
                  ₦{selectedRow.amount?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-900">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedRow.approved
                        ? "bg-green-100 text-green-800"
                        : selectedRow.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedRow.approved
                      ? "APPROVED"
                      : selectedRow.status === "REJECTED"
                      ? "REJECTED"
                      : "PENDING"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(selectedRow.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reference ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedRow.referenceId || "N/A"}
                </p>
              </div>
            </div>

            {selectedRow.signedEvidenceUrl && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Payment Evidence</p>
                  <a
                    href={selectedRow.signedEvidenceUrl}
                    download
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </a>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={selectedRow.signedEvidenceUrl}
                    alt="Payment evidence"
                    width={500}
                    height={300}
                    className="w-full h-auto object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}