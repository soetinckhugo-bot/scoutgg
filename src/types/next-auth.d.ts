import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isPremium: boolean;
      subscriptionStatus: string | null;
      premiumUntil: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    isPremium: boolean;
    subscriptionStatus: string | null;
    premiumUntil: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    isPremium: boolean;
    subscriptionStatus: string | null;
    premiumUntil: string | null;
  }
}
