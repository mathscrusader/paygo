// components/SignInForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call NextAuth credentials sign-in, then redirect to /admin on success
    await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/admin",
    });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl mb-4">Admin Sign-In</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          <span>Email</span>
          <input
            name="email"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <label className="block mb-4">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
