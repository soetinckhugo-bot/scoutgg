import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import crypto from "crypto";
import { logger } from "@/lib/logger";

function getUserId(session: any): string | null {
  return session?.user?.email || null;
}

function generateApiKey(): string {
  return "lsk_" + crypto.randomBytes(32).toString("hex");
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// GET - list user's API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: userId },
      select: {
        isPremium: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    });

    if (!user?.isPremium || user.subscriptionStatus !== "active") {
      return NextResponse.json(
        { error: "API access requires Scout Pro subscription" },
        { status: 403 }
      );
    }

    // For now, return a placeholder since we don't have an ApiKey model
    // In production, you'd store hashed keys in the database
    return NextResponse.json({
      keys: user.stripeCustomerId
        ? [{ name: "Default Key", prefix: "lsk_...", createdAt: user.stripeCustomerId }]
        : [],
      message:
        "API keys are managed via Stripe Customer Portal. Contact support for access.",
    });
  } catch (error) {
    logger.error("API key error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - create new API key
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: userId },
      select: {
        isPremium: true,
        subscriptionStatus: true,
      },
    });

    if (!user?.isPremium || user.subscriptionStatus !== "active") {
      return NextResponse.json(
        { error: "API access requires Scout Pro subscription" },
        { status: 403 }
      );
    }

    const key = generateApiKey();
    const hashed = hashKey(key);

    // In production: store hashed key in DB with userId, createdAt, name
    // For now, return the key once (it won't be retrievable again)

    return NextResponse.json({
      key,
      warning: "This key will only be shown once. Copy it now!",
    });
  } catch (error) {
    logger.error("API key create error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

