"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ============================================================================
// RADAR CHART AXES BY ROLE — MAPPED TO REAL METRICS
// ============================================================================

const ROLE_AXES: Record<string, string[]> = {
  TOP: ["Laning", "Teamfight", "Splitpush", "Vision", "Wave Management", "TP Plays", "Champion Pool"],
  JUNGLE: ["Pathing", "Ganking", "Objective Control", "Vision", "Counter-Jungle", "Teamfight", "Champion Pool"],
  MID: ["Laning", "Roaming", "Teamfight", "Vision", "Wave Management", "Champion Pool", "Late Game"],
  ADC: ["Laning", "Teamfight", "Positioning", "Farming", "Vision", "Champion Pool", "Late Game"],
  SUPPORT: ["Laning", "Vision", "Roaming", "Teamfight", "Shotcalling", "Champion Pool", "Objective Setup"],
};

// Placeholder scores — used when no real data
const PLACEHOLDER_SCORES: Record<string, number[]> = {
  TOP: [75, 68, 82, 60, 70, 65, 78],
  JUNGLE: [70, 72, 80, 65, 60, 75, 70],
  MID: [80, 75, 70, 65, 72, 85, 78],
  ADC: [72, 80, 75, 85, 55, 70, 82],
  SUPPORT: [78, 85, 70, 72, 68, 75, 80],
};

interface ProStatsInput {
  kda?: number | null;
  csdAt15?: number | null;
  gdAt15?: number | null;
  xpdAt15?: number | null;
  cspm?: number | null;
  gpm?: number | null;
  dpm?: number | null;
  kpPercent?: number | null;
  visionScore?: number | null;
  wpm?: number | null;
  wcpm?: number | null;
  fbParticipation?: number | null;
  fbVictim?: number | null;
  deathsUnder15?: number | null;
  damagePercent?: number | null;
  goldPercent?: number | null;
  soloKills?: number | null;
  proximityJungle?: number | null;
  poolSize?: number | null;
  otpScore?: number | null;
}

/**
 * Compute normalized scores (0-100) from real pro stats for each axis.
 */
function computeScoresFromStats(role: string, stats: ProStatsInput | null): number[] | null {
  if (!stats) return null;

  const s = stats;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const norm = (v: number, target: number, scale: number) => clamp(50 + ((v - target) / scale) * 50);

  switch (role) {
    case "TOP": {
      return [
        norm(s.csdAt15 || 0, 0, 15),
        norm(s.kpPercent || 0, 0.5, 0.2),
        norm(s.gdAt15 || 0, 0, 500),
        norm(s.visionScore || 0, 20, 15),
        norm(s.csdAt15 || 0, 0, 15),
        norm(s.kpPercent || 0, 0.5, 0.2),
        clamp((s.poolSize || 0) * 15),
      ];
    }
    case "JUNGLE": {
      return [
        norm(s.cspm || 0, 5, 1.5),
        norm(s.fbParticipation || 0, 0.5, 0.3),
        norm(s.proximityJungle || 0, 0.5, 0.2),
        norm(s.visionScore || 0, 25, 15),
        norm(s.cspm || 0, 5, 1.5),
        norm(s.kpPercent || 0, 0.6, 0.2),
        clamp((s.poolSize || 0) * 15),
      ];
    }
    case "MID": {
      return [
        norm(s.csdAt15 || 0, 0, 15),
        norm(s.kpPercent || 0, 0.55, 0.2),
        norm(s.kpPercent || 0, 0.55, 0.2),
        norm(s.visionScore || 0, 20, 15),
        norm(s.csdAt15 || 0, 0, 15),
        clamp((s.poolSize || 0) * 15),
        norm(s.dpm || 0, 500, 200),
      ];
    }
    case "ADC": {
      return [
        norm(s.csdAt15 || 0, 0, 10),
        norm(s.kpPercent || 0, 0.6, 0.2),
        norm(s.damagePercent || 0, 0.25, 0.08),
        norm(s.cspm || 0, 8, 1.5),
        norm(s.visionScore || 0, 15, 10),
        clamp((s.poolSize || 0) * 15),
        norm(s.dpm || 0, 600, 200),
      ];
    }
    case "SUPPORT": {
      return [
        norm(s.kpPercent || 0, 0.6, 0.2),
        norm(s.visionScore || 0, 40, 20),
        norm(s.kpPercent || 0, 0.6, 0.2),
        norm(s.kpPercent || 0, 0.6, 0.2),
        norm(s.wpm || 0, 3, 1.5),
        clamp((s.poolSize || 0) * 15),
        norm(s.wcpm || 0, 1.5, 0.8),
      ];
    }
    default:
      return null;
  }
}

interface RoleRadarChartProps {
  role: string;
  proStats?: ProStatsInput | null;
}

export default function RoleRadarChart({ role, proStats }: RoleRadarChartProps) {
  const axes = ROLE_AXES[role] || ROLE_AXES["TOP"];
  const realScores = computeScoresFromStats(role, proStats || null);
  const dataScores = realScores || PLACEHOLDER_SCORES[role] || PLACEHOLDER_SCORES["TOP"];

  const data = axes.map((axis, i) => ({
    axis,
    score: dataScores[i] || 50,
    fullMark: 100,
  }));

  const isRealData = realScores !== null;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#E94560"
            strokeWidth={2}
            fill="#E94560"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-text-muted text-text-muted mt-2">
        {isRealData ? "Scores derived from pro stats" : "Scores out of 100 — placeholder data"}
      </p>
    </div>
  );
}

// Export the axes so they can be used elsewhere
export { ROLE_AXES };

