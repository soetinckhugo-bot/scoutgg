"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface ProStatsFormProps {
  playerId: string;
}

interface ProStatsData {
  kda: string;
  csdAt15: string;
  gdAt15: string;
  xpdAt15: string;
  cspm: string;
  gpm: string;
  dpm: string;
  kpPercent: string;
  wpm: string;
  wcpm: string;
  fbParticipation: string;
  fbVictim: string;
  damagePercent: string;
  goldPercent: string;
  soloKills: string;
  gamesPlayed: string;
  season: string;
  split: string;
  winRate: string;
}

const defaultStats: ProStatsData = {
  kda: "",
  csdAt15: "",
  gdAt15: "",
  xpdAt15: "",
  cspm: "",
  gpm: "",
  dpm: "",
  kpPercent: "",
  wpm: "",
  wcpm: "",
  fbParticipation: "",
  fbVictim: "",
  damagePercent: "",
  goldPercent: "",
  soloKills: "",
  gamesPlayed: "",
  season: "2026",
  split: "Winter",
  winRate: "",
};

function toNumber(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toInt(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export default function ProStatsForm({ playerId }: ProStatsFormProps) {
  const [stats, setStats] = useState<ProStatsData>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/prostats`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          kda: data.kda?.toString() || "",
          csdAt15: data.csdAt15?.toString() || "",
          gdAt15: data.gdAt15?.toString() || "",
          xpdAt15: data.xpdAt15?.toString() || "",
          cspm: data.cspm?.toString() || "",
          gpm: data.gpm?.toString() || "",
          dpm: data.dpm?.toString() || "",
          kpPercent: data.kpPercent?.toString() || "",
          wpm: data.wpm?.toString() || "",
          wcpm: data.wcpm?.toString() || "",
          fbParticipation: data.fbPercent?.toString() || "",
          fbVictim: data.fbVictim?.toString() || "",
          damagePercent: data.damagePercent?.toString() || "",
          goldPercent: data.goldPercent?.toString() || "",
          soloKills: data.soloKills?.toString() || "",
          gamesPlayed: data.gamesPlayed?.toString() || "",
          season: data.season || "2026",
          split: data.split || "Winter",
          winRate: data.winRate?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error fetching pro stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveStats() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      const numberFields: (keyof ProStatsData)[] = [
        "kda", "csdAt15", "gdAt15", "xpdAt15", "cspm", "gpm", "dpm",
        "kpPercent", "wpm", "wcpm",
        "fbParticipation", "fbVictim",
        "damagePercent", "goldPercent", "soloKills", "winRate",
      ];
      const intFields: (keyof ProStatsData)[] = ["gamesPlayed"];
      const stringFields: (keyof ProStatsData)[] = ["season", "split"];

      for (const field of numberFields) {
        const val = toNumber(stats[field]);
        if (val !== null) payload[field] = val;
      }
      for (const field of intFields) {
        const val = toInt(stats[field]);
        if (val !== null) payload[field] = val;
      }
      for (const field of stringFields) {
        if (stats[field]) payload[field] = stats[field];
      }

      const res = await fetch(`/api/players/${playerId}/prostats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Pro stats saved");
      } else {
        toast.error("Failed to save pro stats");
      }
    } catch (error) {
      console.error("Error saving pro stats:", error);
      toast.error("Failed to save pro stats");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof ProStatsData, value: string) {
    setStats((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-text-muted" />
        <p className="text-sm text-text-muted mt-2">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Identification */}
        <div className="col-span-full">
          <h4 className="text-sm font-semibold text-text-heading mb-2">Season / Split</h4>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Season</Label>
          <Input
            value={stats.season}
            onChange={(e) => updateField("season", e.target.value)}
            placeholder="2026"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Split</Label>
          <Input
            value={stats.split}
            onChange={(e) => updateField("split", e.target.value)}
            placeholder="Winter"
            className="h-8 text-sm"
          />
        </div>
        <NumberField label="Games Played" value={stats.gamesPlayed} onChange={(v) => updateField("gamesPlayed", v)} />

        {/* Fight */}
        <div className="col-span-full mt-2">
          <h4 className="text-sm font-semibold text-text-heading mb-2">Fight</h4>
        </div>
        <NumberField label="KDA" value={stats.kda} onChange={(v) => updateField("kda", v)} />
        <NumberField label="KP% (0-1)" value={stats.kpPercent} onChange={(v) => updateField("kpPercent", v)} />
        <NumberField label="FB Participation% (0-1)" value={stats.fbParticipation} onChange={(v) => updateField("fbParticipation", v)} />
        <NumberField label="FB Victim% (0-1)" value={stats.fbVictim} onChange={(v) => updateField("fbVictim", v)} />
        <NumberField label="Solo Kills" value={stats.soloKills} onChange={(v) => updateField("soloKills", v)} />
        <NumberField label="Damage% (0-1)" value={stats.damagePercent} onChange={(v) => updateField("damagePercent", v)} />
        <NumberField label="Gold% (0-1)" value={stats.goldPercent} onChange={(v) => updateField("goldPercent", v)} />

        {/* Ressources */}
        <div className="col-span-full mt-2">
          <h4 className="text-sm font-semibold text-text-heading mb-2">Ressources</h4>
        </div>
        <NumberField label="CSD@15" value={stats.csdAt15} onChange={(v) => updateField("csdAt15", v)} />
        <NumberField label="GD@15" value={stats.gdAt15} onChange={(v) => updateField("gdAt15", v)} />
        <NumberField label="XPD@15" value={stats.xpdAt15} onChange={(v) => updateField("xpdAt15", v)} />
        <NumberField label="CSPM" value={stats.cspm} onChange={(v) => updateField("cspm", v)} />
        <NumberField label="GPM" value={stats.gpm} onChange={(v) => updateField("gpm", v)} />
        <NumberField label="DPM" value={stats.dpm} onChange={(v) => updateField("dpm", v)} />
        <NumberField label="Win Rate% (0-1)" value={stats.winRate} onChange={(v) => updateField("winRate", v)} />

        {/* Vision */}
        <div className="col-span-full mt-2">
          <h4 className="text-sm font-semibold text-text-heading mb-2">Vision</h4>
        </div>
        <NumberField label="WPM" value={stats.wpm} onChange={(v) => updateField("wpm", v)} />
        <NumberField label="WCPM" value={stats.wcpm} onChange={(v) => updateField("wcpm", v)} />
      </div>

      <Button
        className="bg-surface-elevated text-text-heading hover:bg-secondary"
        onClick={saveStats}
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Pro Stats
      </Button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
