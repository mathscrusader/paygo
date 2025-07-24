// File: app/admin/banks/edit/[id]/page.tsx

import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EditBankForm from "./EditBankForm";

interface EditBankPageProps {
  params: { id: string };
}

export default async function EditBankPage({ params }: EditBankPageProps) {
  // Protect route
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/auth/signin");
  }

  // Fetch the bank record
  const { data: bank, error } = await supabase
    .from("Bank")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !bank) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Error loading bank account: {error?.message || "Not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-16">
      {/* Header */}
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Edit Bank Account</h1>
        </div>
      </header>

      {/* Main Form */}
      <main className="container mx-auto p-4">
        <EditBankForm bank={bank} />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-purple-100 flex justify-around p-2">
        <Link href="/admin" className="flex flex-col items-center text-purple-700 p-1">
          {/* Dashboard Icon */}
        </Link>
        <Link href="/admin/banks" className="flex flex-col items-center text-purple-700 font-bold p-1">
          {/* Banks Icon */}
        </Link>
        <Link href="/admin/payids" className="flex flex-col items-center text-purple-700 p-1">
          {/* Pay IDs Icon */}
        </Link>
      </nav>
    </div>
  );
}
