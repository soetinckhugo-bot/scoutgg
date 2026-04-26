import { describe, it, expect } from "vitest";
import {
  PlayerCreateSchema,
  PlayerUpdateSchema,
  FavoriteCreateSchema,
  FavoriteUpdateSchema,
  ReportCreateSchema,
} from "../schemas";

describe("PlayerCreateSchema", () => {
  const validPlayer = {
    pseudo: "Zeka",
    realName: "Kim Geon-woo",
    role: "MID",
    nationality: "KR",
    age: 22,
    currentTeam: "Team Vitality",
    league: "LFL",
    status: "FREE_AGENT",
    opggUrl: "https://op.gg/summoner/Zeka",
    bio: "Top tier mid laner",
  };

  it("accepts valid player data", () => {
    const result = PlayerCreateSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it("accepts minimal valid player data", () => {
    const result = PlayerCreateSchema.safeParse({
      pseudo: "Zeka",
      role: "MID",
      nationality: "KR",
      league: "LFL",
      status: "FREE_AGENT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty pseudo", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, pseudo: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, role: "CARRY" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid league", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, league: "LCS" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, status: "BENChed" });
    expect(result.success).toBe(false);
  });

  it("rejects age below 13", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, age: 12 });
    expect(result.success).toBe(false);
  });

  it("rejects age above 99", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, age: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = PlayerCreateSchema.safeParse({ ...validPlayer, opggUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts null for optional fields", () => {
    const result = PlayerCreateSchema.safeParse({
      pseudo: "Zeka",
      role: "MID",
      nationality: "KR",
      league: "LFL",
      status: "FREE_AGENT",
      realName: null,
      age: null,
      currentTeam: null,
      opggUrl: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("PlayerUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = PlayerUpdateSchema.safeParse({ pseudo: "NewName" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = PlayerUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid role in update", () => {
    const result = PlayerUpdateSchema.safeParse({ role: "INVALID" });
    expect(result.success).toBe(false);
  });
});

describe("FavoriteCreateSchema", () => {
  it("accepts valid playerId", () => {
    const result = FavoriteCreateSchema.safeParse({ playerId: "p1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty playerId", () => {
    const result = FavoriteCreateSchema.safeParse({ playerId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing playerId", () => {
    const result = FavoriteCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("FavoriteUpdateSchema", () => {
  it("accepts playerId with notes", () => {
    const result = FavoriteUpdateSchema.safeParse({ playerId: "p1", notes: "Great prospect" });
    expect(result.success).toBe(true);
  });

  it("accepts playerId without notes", () => {
    const result = FavoriteUpdateSchema.safeParse({ playerId: "p1" });
    expect(result.success).toBe(true);
  });

  it("accepts null notes", () => {
    const result = FavoriteUpdateSchema.safeParse({ playerId: "p1", notes: null });
    expect(result.success).toBe(true);
  });
});

describe("ReportCreateSchema", () => {
  const validReport = {
    playerId: "p1",
    title: "Scouting Report",
    content: "Detailed analysis...",
    strengths: "Strong laning",
    weaknesses: "Vision control",
    verdict: "Must Sign" as const,
    author: "Scout A",
  };

  it("accepts valid report", () => {
    const result = ReportCreateSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it("accepts minimal report", () => {
    const result = ReportCreateSchema.safeParse({
      playerId: "p1",
      title: "Report",
      verdict: "Monitor",
      author: "Scout",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid verdict", () => {
    const result = ReportCreateSchema.safeParse({ ...validReport, verdict: "Maybe" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = ReportCreateSchema.safeParse({ ...validReport, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 300 chars", () => {
    const result = ReportCreateSchema.safeParse({ ...validReport, title: "x".repeat(301) });
    expect(result.success).toBe(false);
  });
});
