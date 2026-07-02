import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import crypto from "crypto";
import { logger } from "@/lib/logger";

import type { Session } from "next-auth";

function getUserId(session: Session | null): string | null {
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

    // API access is now available to all authenticated users
    return NextResponse.json({
      keys: [],
      message: "Generate a new API key below.",
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

    // API access is now available to all authenticated users
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

