// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

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

        // Sign in via Supabase Auth
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: creds.email,
          password: creds.password,
        });
        if (error || !data.session) {
          console.error("Authorize: Supabase sign-in failed", error);
          return null;
        }

        // Check user_metadata for role
        const role = (data.user.user_metadata as any)?.role;
        if (role !== "ADMIN") {
          console.error("Authorize: user is not an admin", data.user.email, role);
          return null;
        }

        // All good
        return {
          id: data.user.id,
          email: data.user.email!,
          role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, meta) { console.error(code, meta); },
    warn(code) { console.warn(code); },
    debug(code, meta) { console.debug(code, meta); },
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
  pages: { signIn: "/auth/signin" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
