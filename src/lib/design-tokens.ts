/**
 * LeagueScout Legacy Design Tokens
 * Migrated from hub/css/tokens.css
 * Adapted for Tailwind CSS v4 + shadcn/ui
 */

// ── Tier / Percentile Colors (Professional Palette) ──
export const PERCENTILE_COLORS = {
  S: { min: 85, color: "#F59E0B", label: "Elite", twClass: "text-amber-500 bg-amber-500/10" },
  A: { min: 70, color: "#EAB308", label: "Excellent", twClass: "text-yellow-500 bg-yellow-500/10" },
  B: { min: 60, color: "#F97316", label: "Good", twClass: "text-orange-500 bg-orange-500/10" },
  C: { min: 50, color: "#EF4444", label: "Average", twClass: "text-red-500 bg-red-500/10" },
  D: { min: 0, color: "#6B7280", label: "Weak", twClass: "text-gray-500 bg-gray-500/10" },
} as const;

export type PercentileTier = keyof typeof PERCENTILE_COLORS;

/**
 * Get percentile tier info from a 0-100 percentile value
 */
export function getPercentileTier(percentile: number | null): (typeof PERCENTILE_COLORS)[PercentileTier] | null {
  if (percentile === null || percentile === undefined) return null;
  const tiers = ["S", "A", "B", "C", "D"] as PercentileTier[];
  for (const tier of tiers) {
    if (percentile >= PERCENTILE_COLORS[tier].min) {
      return PERCENTILE_COLORS[tier];
    }
  }
  return PERCENTILE_COLORS.D;
}

/**
 * Get color hex for a percentile value
 */
export function getPercentileColor(percentile: number | null): string {
  const tier = getPercentileTier(percentile);
  return tier?.color ?? "#888888";
}

/**
 * Get Tailwind class for a percentile value
 */
export function getPercentileClass(percentile: number | null): string {
  const tier = getPercentileTier(percentile);
  return tier?.twClass ?? "text-gray-400 bg-gray-400/10";
}

// ── Glassmorphism ──
export const GLASS_TOKENS = {
  bg: "rgba(255, 255, 255, 0.03)",
  bgHover: "rgba(255, 255, 255, 0.06)",
  bgActive: "rgba(255, 255, 255, 0.09)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderHover: "1px solid rgba(255, 255, 255, 0.15)",
  borderActive: "1px solid rgba(255, 255, 255, 0.2)",
  backdrop: "blur(20px) saturate(180%)",
} as const;

// ── Gradients ──
export const GRADIENTS = {
  primary: "linear-gradient(135deg, #E94560 0%, #1A1A2E 50%, #0F3460 100%)",
  dark: "linear-gradient(180deg, rgba(10, 10, 15, 0) 0%, rgba(10, 10, 15, 1) 100%)",
} as const;

// ── Shadows / Glows ──
export const SHADOWS = {
  glowPrimary: "0 0 40px rgba(233, 69, 96, 0.3)",
  elevation1: "0 4px 24px rgba(0, 0, 0, 0.3)",
  elevation2: "0 8px 40px rgba(0, 0, 0, 0.4)",
  elevation3: "0 16px 64px rgba(0, 0, 0, 0.5)",
} as const;

// ── Transitions ──
export const TRANSITIONS = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeBounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
