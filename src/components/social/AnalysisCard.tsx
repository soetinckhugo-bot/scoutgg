"use client";

import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { getRoleMetrics } from "@/lib/radar-metrics";
import Image from "next/image";

interface AnalysisCardProps {
  player: {
    pseudo: string;
    role: string;
    photoUrl?: string | null;
    stats: Record<string, number | string | null>;
  };
  theme?: "default" | "fearx" | "frenchflair" | "loud" | "g2";
}

const THEMES: Record<string, { primary: string; secondary: string; accent: string; gradient: string }> = {
  default: {
    primary: "#E94560",
    secondary: "#1A1A2E",
    accent: "#0F3460",
    gradient: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
  },
  fearx: {
    primary: "#FFC700",
    secondary: "#1A1A2E",
    accent: "#B8860B",
    gradient: "linear-gradient(135deg, #1A1A2E 0%, #2A1A00 100%)",
  },
  frenchflair: {
    primary: "#7A9F6A",
    secondary: "#1A1A2E",
    accent: "#5A7F4A",
    gradient: "linear-gradient(135deg, #1A1A2E 0%, #1A2A1A 100%)",
  },
  loud: {
    primary: "#00C853",
    secondary: "#1A1A2E",
    accent: "#007A33",
    gradient: "linear-gradient(135deg, #1A1A2E 0%, #002A00 100%)",
  },
  g2: {
    primary: "#C8102E",
    secondary: "#1A1A2E",
    accent: "#8B0A1E",
    gradient: "linear-gradient(135deg, #1A1A2E 0%, #2A0010 100%)",
  },
};

function normalizeValue(val: number | string | null, key: string): number {
  if (val === null || val === undefined) return 50;
  const num = typeof val === "string" ? parseFloat(val.replace(/[%]/g, "").replace(",", ".")) : val;
  if (isNaN(num)) return 50;

  // Normalize to 0-100 scale based on metric type
  const keyLower = key.toLowerCase();

  // Percentages (KP, DMG%, etc.)
  if (keyLower.includes("%") || ["kp", "ks%", "dth%", "fb%"].some((k) => keyLower.includes(k))) {
    return Math.min(100, num * 100);
  }

  // KDA — cap at 10
  if (keyLower === "kda") {
    return Math.min(100, (num / 10) * 100);
  }

  // CSPM — cap at 12
  if (keyLower === "cspm" || keyLower === "csm") {
    return Math.min(100, (num / 12) * 100);
  }

  // DPM — cap at 1000
  if (keyLower === "dpm") {
    return Math.min(100, (num / 1000) * 100);
  }

  // GPM — cap at 500
  if (keyLower === "gpm" || keyLower === "egpm") {
    return Math.min(100, (num / 500) * 100);
  }

  // CS diff @15 — range -30 to +30
  if (keyLower.includes("csd")) {
    return Math.max(0, Math.min(100, 50 + (num / 30) * 50));
  }

  // Gold diff @15 — range -1000 to +1000
  if (keyLower.includes("gd")) {
    return Math.max(0, Math.min(100, 50 + (num / 1000) * 50));
  }

  // Default: assume 0-100 scale
  return Math.max(0, Math.min(100, num));
}

export default function AnalysisCard({ player, theme = "default" }: AnalysisCardProps) {
  const t = THEMES[theme] ?? THEMES.default;

  const radarData = useMemo(() => {
    const metrics = getRoleMetrics(player.role);
    return metrics
      .filter((m) => player.stats[m.key] !== null && player.stats[m.key] !== undefined)
      .slice(0, 8)
      .map((m) => ({
        metric: m.label,
        value: normalizeValue(player.stats[m.key], m.key),
        fullMark: 100,
      }));
  }, [player.role, player.stats]);

  // Categorized stats
  const fightStats = useMemo(() => {
    const keys = ["KDA", "KP", "DTH%", "DPM", "DMG%", "KS%"];
    return keys
      .map((k) => ({ key: k, value: player.stats[k] }))
      .filter((s) => s.value !== null && s.value !== undefined);
  }, [player.stats]);

  const visionStats = useMemo(() => {
    const keys = ["WPM", "CWPM", "WCPM", "VS%", "VSPM"];
    return keys
      .map((k) => ({ key: k, value: player.stats[k] }))
      .filter((s) => s.value !== null && s.value !== undefined);
  }, [player.stats]);

  const resourceStats = useMemo(() => {
    const keys = ["CSPM", "GPM", "EGPM", "GOLD%", "CS%P15"];
    return keys
      .map((k) => ({ key: k, value: player.stats[k] }))
      .filter((s) => s.value !== null && s.value !== undefined);
  }, [player.stats]);

  return (
    <div
      className="relative max-w-[400px] w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: t.gradient, fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, ${t.primary}40 0%, transparent 60%)`,
          }}
        />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt={player.pseudo} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-card/10 flex items-center justify-center">
              <span className="text-lg font-bold text-text-heading/40">{player.pseudo.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-text-heading">{player.pseudo}</h2>
            <p className="text-xs text-text-heading/50 uppercase tracking-wider">Performance Analysis</p>
          </div>
        </div>

        {/* Radar */}
        {radarData.length >= 3 && (
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }} />
                <Radar
                  name={player.pseudo}
                  dataKey="value"
                  stroke={t.primary}
                  strokeWidth={2}
                  fill={t.primary}
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats grids */}
        {fightStats.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-bold text-text-heading/40 uppercase tracking-wider mb-2">Fight</h4>
            <div className="grid grid-cols-3 gap-2">
              {fightStats.map((s) => (
                <div key={s.key} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="text-xs text-text-heading/40 uppercase">{s.key}</div>
                  <div className="text-sm font-bold text-text-heading">{String(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visionStats.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-bold text-text-heading/40 uppercase tracking-wider mb-2">Vision</h4>
            <div className="grid grid-cols-3 gap-2">
              {visionStats.map((s) => (
                <div key={s.key} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="text-xs text-text-heading/40 uppercase">{s.key}</div>
                  <div className="text-sm font-bold text-text-heading">{String(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resourceStats.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-bold text-text-heading/40 uppercase tracking-wider mb-2">Resources</h4>
            <div className="grid grid-cols-3 gap-2">
              {resourceStats.map((s) => (
                <div key={s.key} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="text-xs text-text-heading/40 uppercase">{s.key}</div>
                  <div className="text-sm font-bold text-text-heading">{String(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-xs text-text-heading/30 uppercase tracking-widest">LeagueScout</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.primary }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
