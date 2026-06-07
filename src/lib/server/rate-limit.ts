// Rate limiter with SQLite/Prisma backend
// Falls back to in-memory map in test environment (fake timers + sync tests)
// Works correctly on Vercel serverless: state is shared via the database.

import { db } from "@/lib/server/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

function rateLimitMemory(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): { success: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(identifier, { count: 1, resetAt });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

async function rateLimitDb(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; limit: number; remaining: number; resetAt: number }> {
  const nowMs = Date.now();
  const resetAtMs = nowMs + windowMs;

  try {
    // Prisma SQLite: use raw SQL with ON CONFLICT upsert.
    // For libSQL/Turso the same SQL works.
    await db.$executeRaw`
      INSERT INTO "RateLimit" ("id", "key", "count", "resetAt", "updatedAt")
      VALUES (lower(hex(randomblob(16))), ${identifier}, 1, datetime(${resetAtMs / 1000}, 'unixepoch'), datetime('now'))
      ON CONFLICT("key") DO UPDATE SET
        "count" = CASE
          WHEN "resetAt" < datetime('now') THEN 1
          ELSE "count" + 1
        END,
        "resetAt" = CASE
          WHEN "resetAt" < datetime('now') THEN datetime(${resetAtMs / 1000}, 'unixepoch')
          ELSE "resetAt"
        END,
        "updatedAt" = datetime('now')
    `;

    const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
      SELECT "count", "resetAt" FROM "RateLimit" WHERE "key" = ${identifier}
    `;

    if (rows.length === 0) {
      return { success: true, limit: maxRequests, remaining: maxRequests - 1, resetAt: resetAtMs };
    }

    const row = rows[0];
    const currentCount = row.count;
    const rowResetAt = new Date(row.resetAt).getTime();

    return {
      success: currentCount <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      resetAt: rowResetAt,
    };
  } catch {
    // If DB is unavailable, fall back to memory (best effort)
    return rateLimitMemory(identifier, maxRequests, windowMs);
  }
}

export async function rateLimit(
  identifier: string,
  maxRequests?: number,
  windowMs?: number
): Promise<{ success: boolean; limit: number; remaining: number; resetAt: number }> {
  if (process.env.NODE_ENV === "test") {
    return rateLimitMemory(identifier, maxRequests, windowMs);
  }
  return rateLimitDb(identifier, maxRequests, windowMs);
}
