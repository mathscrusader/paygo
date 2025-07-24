"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetRequestPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset/update`,
    });

    if (error) setErr(error.message);
    else setSent(true);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-xl font-semibold text-center mb-4">Reset password</h1>

        {sent ? (
          <p className="text-center text-green-600 text-sm">
            If that email exists, a reset link has been sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {err && <div className="bg-red-100 text-red-600 p-3 rounded">{err}</div>}
            <input
              type="email"
              className="w-full p-3 border rounded-xl"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-medium ${
                loading ? "bg-purple-400" : "bg-gradient-to-r from-purple-600 to-indigo-600"
              }`}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
