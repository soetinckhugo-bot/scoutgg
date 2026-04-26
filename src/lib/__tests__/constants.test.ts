import { describe, it, expect } from "vitest";
import { ROLES, LEAGUES, ROLE_COLORS, STATUS_COLORS } from "../constants";

describe("constants", () => {
  it("has 5 roles", () => {
    expect(ROLES).toHaveLength(5);
    expect(ROLES).toContain("TOP");
    expect(ROLES).toContain("JUNGLE");
    expect(ROLES).toContain("MID");
    expect(ROLES).toContain("ADC");
    expect(ROLES).toContain("SUPPORT");
  });

  it("has role colors for all roles", () => {
    ROLES.forEach((role) => {
      expect(ROLE_COLORS[role]).toBeDefined();
    });
  });

  it("has status colors for all statuses", () => {
    expect(STATUS_COLORS["FREE_AGENT"]).toBeDefined();
    expect(STATUS_COLORS["UNDER_CONTRACT"]).toBeDefined();
    expect(STATUS_COLORS["ACADEMY"]).toBeDefined();
    expect(STATUS_COLORS["SUB"]).toBeDefined();
    expect(STATUS_COLORS["SCOUTING"]).toBeDefined();
  });

  it("has leagues defined", () => {
    expect(LEAGUES.length).toBeGreaterThan(0);
    expect(LEAGUES).toContain("LEC");
    expect(LEAGUES).toContain("LFL");
  });
});
