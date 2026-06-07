import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "../server/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("allows first request with correct remaining", async () => {
    const result = await rateLimit("user1", 10, 60000);
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
  });

  it("decrements remaining on each request", async () => {
    await rateLimit("user2", 5, 60000);
    await rateLimit("user2", 5, 60000);
    const result = await rateLimit("user2", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks when max requests reached", async () => {
    const key = "user3";
    const max = 2;
    await rateLimit(key, max, 60000);
    await rateLimit(key, max, 60000);
    const result = await rateLimit(key, max, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = "user4";
    const windowMs = 60000;

    await rateLimit(key, 1, windowMs);
    expect((await rateLimit(key, 1, windowMs)).success).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    const result = await rateLimit(key, 1, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("uses default values when not specified", async () => {
    const result = await rateLimit("user5");
    expect(result.limit).toBe(10);
    expect(result.success).toBe(true);
  });

  it("isolates different identifiers", async () => {
    await rateLimit("id-a", 5, 60000);
    await rateLimit("id-a", 5, 60000);

    const result = await rateLimit("id-b", 5, 60000);
    expect(result.remaining).toBe(4);
  });

  it("returns correct resetAt", async () => {
    const now = Date.now();
    const windowMs = 30000;
    const result = await rateLimit("user6", 10, windowMs);
    expect(result.resetAt).toBe(now + windowMs);
  });
});
