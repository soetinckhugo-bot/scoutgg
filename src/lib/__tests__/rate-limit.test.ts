import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "../server/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("allows first request with correct remaining", () => {
    const result = rateLimit("user1", 10, 60000);
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
  });

  it("decrements remaining on each request", () => {
    rateLimit("user2", 5, 60000);
    rateLimit("user2", 5, 60000);
    const result = rateLimit("user2", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks when max requests reached", () => {
    const key = "user3";
    const max = 2;
    rateLimit(key, max, 60000);
    rateLimit(key, max, 60000);
    const result = rateLimit(key, max, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "user4";
    const windowMs = 60000;

    rateLimit(key, 1, windowMs);
    expect(rateLimit(key, 1, windowMs).success).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    const result = rateLimit(key, 1, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("uses default values when not specified", () => {
    const result = rateLimit("user5");
    expect(result.limit).toBe(10);
    expect(result.success).toBe(true);
  });

  it("isolates different identifiers", () => {
    rateLimit("id-a", 5, 60000);
    rateLimit("id-a", 5, 60000);

    const result = rateLimit("id-b", 5, 60000);
    expect(result.remaining).toBe(4);
  });

  it("returns correct resetAt", () => {
    const now = Date.now();
    const windowMs = 30000;
    const result = rateLimit("user6", 10, windowMs);
    expect(result.resetAt).toBe(now + windowMs);
  });
});
