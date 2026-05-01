"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image as ImageIcon, FileImage } from "lucide-react";

// Dynamic import to avoid SSR issues with html2canvas
const IdentityCard = dynamic(() => import("@/components/social/IdentityCard"), { ssr: false });
const AnalysisCard = dynamic(() => import("@/components/social/AnalysisCard"), { ssr: false });

const THEMES = [
  { value: "default", label: "Default", color: "#E94560" },
  { value: "fearx", label: "FearX", color: "#FFC700" },
  { value: "frenchflair", label: "French Flair", color: "#7A9F6A" },
  { value: "loud", label: "LOUD", color: "#00FF41" },
  { value: "g2", label: "G2", color: "#C8102E" },
];

// Mock player data — in real usage, fetch from API
const MOCK_PLAYER = {
  pseudo: "Hugo",
  realName: "Hugo D.",
  role: "TOP" as const,
  league: "LEC",
  tier: "S" as const,
  team: "G2",
  photoUrl: null,
  teamLogoUrl: null,
  stats: {
    KDA: 4.2,
    "KP": "72%",
    "DTH%": "18%",
    CSPM: 8.5,
    "DMG%": "28%",
    EGPM: 420,
    CSD15: 12,
    GD15: 850,
    WPM: 0.45,
    CWPM: 0.22,
    "VS%": "22%",
  },
};

export default function ExportPage() {
  const [theme, setTheme] = useState("default");
  const [activeTab, setActiveTab] = useState<"identity" | "analysis">("identity");
  const [exporting, setExporting] = useState(false);

  const identityRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const exportCard = useCallback(
    async (cardType: "identity" | "analysis") => {
      const ref = cardType === "identity" ? identityRef : analysisRef;
      if (!ref.current) return;

      setExporting(true);
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          backgroundColor: null,
          logging: false,
        });

        const link = document.createElement("a");
        link.download = `${MOCK_PLAYER.pseudo}_${cardType}_${theme}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        logger.error("Export failed", { err });
      } finally {
        setExporting(false);
      }
    },
    [theme]
  );

  const exportBoth = useCallback(async () => {
    await exportCard("identity");
    setTimeout(() => exportCard("analysis"), 500);
  }, [exportCard]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text-heading mb-2">Social Card Export</h1>
      <p className="text-text-body mb-6">
        Generate shareable player cards for social media.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl bg-card/5 border border-white/5">
        {/* Theme selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-subtle text-text-subtle">Theme:</span>
          <Select value={theme} onValueChange={(v) => setTheme(v || "default")}>
            <SelectTrigger className="w-[160px] h-9 text-sm bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    {t.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-card/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("identity")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "identity"
                ? "bg-primary-accent text-text-heading"
                : "text-text-muted hover:text-text-heading"
            }`}
          >
            Identity
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "analysis"
                ? "bg-primary-accent text-text-heading"
                : "text-text-muted hover:text-text-heading"
            }`}
          >
            Analysis
          </button>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCard(activeTab)}
            disabled={exporting}
            className="border-border hover:bg-card"
          >
            <ImageIcon className="h-4 w-4 mr-1.5" />
            Export {activeTab === "identity" ? "Identity" : "Analysis"}
          </Button>
          <Button
            size="sm"
            onClick={exportBoth}
            disabled={exporting}
            className="bg-primary-accent hover:bg-primary-accent/90"
          >
            <FileImage className="h-4 w-4 mr-1.5" />
            Export Both
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        {activeTab === "identity" ? (
          <div ref={identityRef} className="inline-block">
            <IdentityCard player={MOCK_PLAYER} theme={theme as any} />
          </div>
        ) : (
          <div ref={analysisRef} className="inline-block">
            <AnalysisCard player={MOCK_PLAYER} theme={theme as any} />
          </div>
        )}
      </div>
    </div>
  );
}
