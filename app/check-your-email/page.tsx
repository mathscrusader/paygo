// app/check-your-email/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function CheckYourEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect back to register if no email
  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resend({ email });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Confirmation email resent! Please check your inbox.");
    }

    setResending(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f2f2]">
      <h1 className="text-2xl font-semibold mb-4">Almost there!</h1>
      <p className="mb-6 text-center">
        We’ve sent a confirmation link to{" "}
        <span className="font-medium">{email}</span>. Please check your inbox
        (and spam folder) and click the link to verify your email address.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-4">
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
        <Button onClick={handleResend} disabled={resending}>
          {resending ? "Resending…" : "Resend Email"}
        </Button>
      </div>
    </div>
  );
}

export default function CheckYourEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <CheckYourEmailContent />
    </Suspense>
  );
}
