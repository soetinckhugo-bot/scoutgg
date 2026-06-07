import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check against User table
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.passwordHash) {
          const valid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (valid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isPremium: user.isPremium,
              subscriptionStatus: user.subscriptionStatus,
              premiumUntil: user.premiumUntil,
            };
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isPremium = user.isPremium;
        token.subscriptionStatus = user.subscriptionStatus;
        token.premiumUntil = user.premiumUntil ? user.premiumUntil.toISOString() : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.isPremium = token.isPremium;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.premiumUntil = token.premiumUntil;
      }
      return session;
    },
  },
};

