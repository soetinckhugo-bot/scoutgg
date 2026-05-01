import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function requirePremium() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const user = session.user as any;
  const now = new Date();
  const premiumUntil = user?.premiumUntil ? new Date(user.premiumUntil) : null;
  const isPremium =
    user?.isPremium === true &&
    user?.subscriptionStatus === "active" &&
    (!premiumUntil || premiumUntil > now);

  if (!isPremium) {
    return NextResponse.json(
      { error: "Premium subscription required" },
      { status: 403 }
    );
  }

  return null;
}

