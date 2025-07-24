"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function EvidenceModal() {
  const [url, setUrl] = useState<string | null>(null);

  // Expose setters via custom event so server component can trigger modal
  // but easier: we'll render a button in the same client tree & call setUrl directly.
  return (
    <>
      {url && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full relative">
            <button
              onClick={() => setUrl(null)}
              className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-4">
              <img
                src={url}
                alt="evidence"
                className="max-h-[80vh] w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper hook for children
export function useEvidence(setter: (u: string) => void) {
  return setter;
}
