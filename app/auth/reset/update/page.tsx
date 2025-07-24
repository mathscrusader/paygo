"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UpdatePasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ensure the session is refreshed (Supabase puts the token in the URL fragment)
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();
    })();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setErr("Passwords do not match");

    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else {
      setDone(true);
      setTimeout(() => router.push("/admin/sign-in"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-xl font-semibold text-center mb-4">Set a new password</h1>

        {done ? (
          <p className="text-green-600 text-sm text-center">Password updated! Redirecting...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {err && <div className="bg-red-100 text-red-600 p-3 rounded">{err}</div>}

            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full p-3 border rounded-xl"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-medium ${
                loading ? "bg-purple-400" : "bg-gradient-to-r from-purple-600 to-indigo-600"
              }`}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
