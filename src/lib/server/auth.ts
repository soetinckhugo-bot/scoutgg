import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-options";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
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

  const now = new Date();
  const premiumUntil = session.user.premiumUntil ? new Date(session.user.premiumUntil) : null;
  const isPremium =
    session.user.isPremium === true &&
    session.user.subscriptionStatus === "active" &&
    (!premiumUntil || premiumUntil > now);

  if (!isPremium) {
    return NextResponse.json(
      { error: "Premium subscription required" },
      { status: 403 }
    );
  }

  return null;
}

