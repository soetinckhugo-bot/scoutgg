import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import crypto from "crypto";

// In-memory rate limit store (per API key)
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

export interface ApiAuthResult {
  userId: string;
  tier: string;
  rateLimit: number;
}

/**
 * Hash an API key using SHA-256 for storage comparison.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key (prefix + random).
 */
export function generateApiKey(): string {
  const prefix = "sk_scout";
  const random = crypto.randomBytes(32).toString("hex");
  return `${prefix}_${random}`;
}

/**
 * Validate API key from request headers.
 * Returns user info if valid, null if invalid/missing.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiAuthResult | null> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const hashed = hashApiKey(apiKey);

  const keyRecord = await db.apiKey.findUnique({
    where: { key: hashed },
  });

  if (!keyRecord) return null;
  if (!keyRecord.isActive) return null;
  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) return null;

  return {
    userId: keyRecord.userId,
    tier: keyRecord.tier,
    rateLimit: keyRecord.rateLimit,
  };
}

/**
 * Check rate limit for an API key.
 * Returns true if within limit, false if exceeded.
 */
export function checkRateLimit(
  keyHash: string,
  limit: number,
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(keyHash);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(keyHash, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Update lastUsed timestamp for an API key.
 */
export async function updateApiKeyUsage(keyHash: string): Promise<void> {
  await db.apiKey.update({
    where: { key: keyHash },
    data: { lastUsed: new Date() },
  });
}

/**
 * Higher-order function: wrap API route with API key auth + rate limiting.
 */
export function withApiAuth(
  handler: (
    request: NextRequest,
    auth: ApiAuthResult
  ) => Promise<NextResponse>,
  options?: { requireTier?: string }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await validateApiKey(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    // Tier check
    if (options?.requireTier && auth.tier !== options.requireTier) {
      return NextResponse.json(
        { error: "This endpoint requires a higher tier" },
        { status: 403 }
      );
    }

    // Rate limit check
    const keyHash = hashApiKey(request.headers.get("x-api-key")!);
    const rateCheck = checkRateLimit(keyHash, auth.rateLimit);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(auth.rateLimit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateCheck.resetAt / 1000)),
          },
        }
      );
    }

    // Update usage
    await updateApiKeyUsage(keyHash);

    // Call handler
    const response = await handler(request, auth);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", String(auth.rateLimit));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateCheck.remaining)
    );
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(rateCheck.resetAt / 1000))
    );

    return response;
  };
}

