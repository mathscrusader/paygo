// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { compare } from "bcryptjs";

// Initialize Supabase client with service_role key for elevated privileges
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
        if (!creds?.email || !creds?.password) return null;

        // Fetch the user by email from Supabase
        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id, email, password_hash")
          .eq("email", creds.email)
          .single();
        if (error || !user) {
          console.error("Authorize: no user found", error);
          return null;
        }

        // Verify password
        const validPassword = await compare(creds.password, user.password_hash);
        if (!validPassword) {
          console.error("Authorize: invalid password");
          return null;
        }

        // Successfully authenticated
        return { id: user.id, email: user.email, role: "ADMIN" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug logging for NextAuth
  debug: true,
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
    debug(code, metadata) {
      console.debug(code, metadata);
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
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
