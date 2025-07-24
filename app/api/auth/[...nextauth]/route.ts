// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// Supabase “admin” client (service_role) for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;

        // Optionally restrict to your one admin email
        if (creds.email !== process.env.ADMIN_EMAIL) {
          console.error("Authorize: unauthorized email", creds.email);
          return null;
        }

        // Use Supabase Auth API to sign in
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: creds.email,
          password: creds.password,
        });

        if (error || !data.session) {
          console.error("Authorize: Supabase sign-in failed", error);
          return null;
        }

        // Success: return a minimal user object
        return {
          id: data.user.id,
          email: data.user.email,
          role: "ADMIN",
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  // Verbose logging
  debug: true,
  logger: {
    error(code, metadata) { console.error(code, metadata); },
    warn(code)         { console.warn(code); },
    debug(code, metadata) { console.debug(code, metadata); },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      (session.user as any).role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
