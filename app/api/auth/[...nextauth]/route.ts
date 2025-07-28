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

        // Step 1: Sign in via Supabase Auth
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: creds.email,
          password: creds.password,
        });

        if (error || !data.session) {
          console.error("Authorize: Supabase sign-in failed", error);
          return null;
        }

        // Step 2: Fetch full user record from User table
        const { data: dbUser, error: userError } = await supabaseAdmin
          .from("User")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (userError || !dbUser) {
          console.error("Authorize: User record not found", userError);
          return null;
        }

        // Step 3: Verify admin role from DB
        if (dbUser.role !== "ADMIN") {
          console.error("Authorize: user is not an admin", dbUser.email, dbUser.role);
          return null;
        }

        // ✅ Authenticated admin
        return {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,

  logger: {
    error(code, meta) {
      console.error(code, meta);
    },
    warn(code) {
      console.warn(code);
    },
    debug(code, meta) {
      console.debug(code, meta);
    },
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
    signIn: "/auth/signin", // Optional: custom sign-in route
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
