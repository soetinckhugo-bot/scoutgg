import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import { hashApiKey, generateApiKey } from "@/lib/server/api-auth";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  tier: z.enum(["scout_pro", "enterprise"]).default("scout_pro"),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

const deleteKeySchema = z.object({
  id: z.string().min(1, "Key ID is required"),
});

// GET /api/keys - List user's API keys (without the actual key)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db.apiKey.findMany({
    where: { userId: session.user.email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      tier: true,
      rateLimit: true,
      lastUsed: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ keys });
}

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, tier, expiresInDays } = parsed.data;

  // Check key limit per user (max 5)
  const existingCount = await db.apiKey.count({
    where: { userId: session.user.email, isActive: true },
  });

  if (existingCount >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 active API keys allowed" },
      { status: 400 }
    );
  }

  const rawKey = generateApiKey();
  const hashedKey = hashApiKey(rawKey);

  const rateLimit = tier === "enterprise" ? 1000 : 100;
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.apiKey.create({
    data: {
      key: hashedKey,
      name: name.trim(),
      userId: session.user.email,
      tier,
      rateLimit,
      expiresAt,
    },
  });

  // Return the raw key ONLY once
  return NextResponse.json(
    {
      key: {
        id: "hidden",
        name: name.trim(),
        tier,
        rateLimit,
        expiresAt,
        rawKey, // ⚠️ Only shown once at creation
      },
      message:
        "Copy this key now — it will not be shown again. Store it securely.",
    },
    { status: 201 }
  );
}

// DELETE /api/keys - Revoke an API key
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deleteKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = parsed.data;

  await db.apiKey.updateMany({
    where: { id, userId: session.user.email },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

