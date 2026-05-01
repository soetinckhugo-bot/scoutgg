"use client";

import { useMemo } from "react";
import { getTierFromPercentile } from "@/lib/percentiles";
import { getRoleMetrics } from "@/lib/radar-metrics";
import { Shield, TreePine, Zap, Crosshair, HeartHandshake } from "lucide-react";
import Image from "next/image";

interface IdentityCardProps {
  player: {
    pseudo: string;
    realName?: string | null;
    role: string;
    league?: string;
    tier?: string | null;
    team?: string | null;
    photoUrl?: string | null;
    teamLogoUrl?: string | null;
    stats: Record<string, number | string | null>;
  };
  theme?: "default" | "fearx" | "frenchflair" | "loud" | "g2";
  background?: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  TOP: <Shield className="h-5 w-5" />,
  JUNGLE: <TreePine className="h-5 w-5" />,
  MID: <Zap className="h-5 w-5" />,
  ADC: <Crosshair className="h-5 w-5" />,
  SUPPORT: <HeartHandshake className="h-5 w-5" />,
};

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

export default function IdentityCard({ player, theme = "default", background = "default" }: IdentityCardProps) {
  const t = THEMES[theme] ?? THEMES.default;

  // Get top 4 metrics by coefficient
  const keyMetrics = useMemo(() => {
    const metrics = getRoleMetrics(player.role);
    return metrics
      .filter((m) => player.stats[m.key] !== null && player.stats[m.key] !== undefined)
      .sort((a, b) => b.coeff - a.coeff)
      .slice(0, 4)
      .map((m) => {
        const val = player.stats[m.key];
        const num = typeof val === "string" ? parseFloat(val) : val;
        return {
          label: m.label,
          value: num ?? 0,
          raw: val,
        };
      });
  }, [player.role, player.stats]);

  return (
    <div
      className="relative max-w-[400px] w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: t.gradient, fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${t.primary}40 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, ${t.accent}30 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {player.teamLogoUrl ? (
              <Image src={player.teamLogoUrl} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-card/10 flex items-center justify-center">
                <span className="text-xs font-bold text-text-heading/60">{player.team?.charAt(0) ?? "?"}</span>
              </div>
            )}
            <span className="text-xs font-bold text-text-heading/60 uppercase tracking-wider">
              {player.league ?? "—"}
            </span>
          </div>
          <div
            className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
            style={{ background: `${t.primary}20`, color: t.primary }}
          >
            {player.tier ?? "—"}
          </div>
        </div>

        {/* Hero */}
        <div className="flex items-center gap-4 mb-6">
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.pseudo}
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-card/10 flex items-center justify-center border-2 border-white/10">
              <span className="text-2xl font-bold text-text-heading/40">{player.pseudo.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-text-heading leading-tight">{player.pseudo}</h2>
            {player.realName && (
              <p className="text-sm text-text-heading/50">{player.realName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span style={{ color: t.accent }}>{ROLE_ICONS[player.role] ?? ROLE_ICONS.TOP}</span>
              <span className="text-xs font-bold text-text-heading/60 uppercase">{player.role}</span>
              {player.team && (
                <span className="text-xs text-text-heading/40">• {player.team}</span>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {keyMetrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="text-xs text-text-heading/40 uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-lg font-bold text-text-heading">{m.raw}</div>
            </div>
          ))}
        </div>

        {/* Footer branding */}
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
