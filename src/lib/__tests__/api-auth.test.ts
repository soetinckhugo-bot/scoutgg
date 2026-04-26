import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hashApiKey,
  generateApiKey,
  checkRateLimit,
} from "../server/api-auth";

describe("hashApiKey", () => {
  it("returns consistent hash for same input", () => {
    const hash1 = hashApiKey("my-api-key");
    const hash2 = hashApiKey("my-api-key");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  it("returns different hash for different inputs", () => {
    const hash1 = hashApiKey("key-a");
    const hash2 = hashApiKey("key-b");
    expect(hash1).not.toBe(hash2);
  });
});

describe("generateApiKey", () => {
  it("starts with correct prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("sk_scout_")).toBe(true);
  });

  it("generates unique keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });

  it("has reasonable length", () => {
    const key = generateApiKey();
    expect(key.length).toBeGreaterThan(40);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("allows first request and sets remaining", () => {
    const result = checkRateLimit("key1", 10, 3600000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("tracks multiple requests within limit", () => {
    checkRateLimit("key2", 5, 3600000);
    checkRateLimit("key2", 5, 3600000);
    const result = checkRateLimit("key2", 5, 3600000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks when limit exceeded", () => {
    const key = "key3";
    const limit = 3;
    checkRateLimit(key, limit, 3600000);
    checkRateLimit(key, limit, 3600000);
    checkRateLimit(key, limit, 3600000);
    const result = checkRateLimit(key, limit, 3600000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "key4";
    const windowMs = 60000; // 1 minute

    checkRateLimit(key, 1, windowMs);
    const blocked = checkRateLimit(key, 1, windowMs);
    expect(blocked.allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(windowMs + 1);

    const reset = checkRateLimit(key, 1, windowMs);
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(0);
  });

  it("uses different stores for different keys", () => {
    checkRateLimit("key-a", 5, 3600000);
    checkRateLimit("key-a", 5, 3600000);

    const result = checkRateLimit("key-b", 5, 3600000);
    expect(result.remaining).toBe(4); // Not affected by key-a
  });

  it("returns correct resetAt timestamp", () => {
    const now = Date.now();
    const windowMs = 60000;
    const result = checkRateLimit("key5", 10, windowMs);
    expect(result.resetAt).toBe(now + windowMs);
  });
});
