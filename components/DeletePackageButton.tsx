// components/DeletePackageButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DeletePackageButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this package?")) return;
    setLoading(true);
    const res = await fetch("/api/admin/packages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error || "Failed to delete package");
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
      className="h-8"
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
