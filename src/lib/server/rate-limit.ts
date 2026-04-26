// Simple in-memory rate limiter
// For production, use Redis or a database-backed solution

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): { success: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

