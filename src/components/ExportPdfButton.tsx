"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SoloqStats {
  currentRank: string;
  peakLp: number;
  winrate: number;
  totalGames: number;
  championPool: string;
  lastUpdated: Date | string;
}

interface ProStats {
  kda: number | null;
  csdAt15: number | null;
  gdAt15: number | null;
  xpdAt15: number | null;
  cspm: number | null;
  gpm: number | null;
  dpm: number | null;
  kpPercent: number | null;
  visionScore: number | null;
  wpm: number | null;
  wcpm: number | null;
  fbParticipation: number | null;
  fbVictim: number | null;
  deathsUnder15: number | null;
  damagePercent: number | null;
  goldPercent: number | null;
  soloKills: number | null;
  proximityJungle: number | null;
  championPool: string | null;
  poolSize: number | null;
  otpScore: number | null;
  gamesPlayed: number | null;
}

interface Report {
  id: string;
  title: string;
  content: string;
  strengths: string;
  weaknesses: string;
  verdict: string;
  author: string;
  isPremium: boolean;
  publishedAt: Date | string;
}

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  nationality: string;
  age: number | null;
  currentTeam: string | null;
  league: string;
  status: string;
  photoUrl: string | null;
  bio: string | null;
  behaviorTags: string | null;
  soloqStats: SoloqStats | null;
  proStats: ProStats | null;
  reports: Report[];
}

interface ExportPdfButtonProps {
  playerId: string;
}

export default function ExportPdfButton({ playerId }: ExportPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlayer = async (): Promise<Player | null> => {
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const generatePdf = async () => {
    setIsLoading(true);
    try {
      const player = await fetchPlayer();
      if (!player) {
        toast.error("Failed to load player data");
        setIsLoading(false);
        return;
      }

      console.log("Export PDF: player data loaded", player.pseudo);

      const jsPDF = (await import("jspdf")).jsPDF;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      console.log("Export PDF: jsPDF initialized");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      let y = margin;

      // Colors
      const C_PRIMARY: [number, number, number] = [15, 52, 96]; // #0F3460
      const C_DARK: [number, number, number] = [26, 26, 46]; // #1A1A2E
      const C_GRAY: [number, number, number] = [108, 117, 125]; // #6C757D
      const C_LIGHT_GRAY: [number, number, number] = [150, 150, 150];
      const C_GREEN: [number, number, number] = [40, 167, 69];
      const C_RED: [number, number, number] = [233, 69, 96]; // #E94560
      const C_ACCENT: [number, number, number] = [233, 69, 96];

      // Helper: add text and return new Y
      const addText = (
        text: string,
        x: number,
        options: {
          fontSize?: number;
          fontStyle?: string;
          color?: [number, number, number];
          align?: "left" | "center" | "right";
          maxWidth?: number;
        } = {}
      ) => {
        const {
          fontSize = 10,
          fontStyle = "normal",
          color = C_DARK,
          align = "left",
          maxWidth = contentWidth,
        } = options;

        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle as any);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, { align });
        y += lines.length * fontSize * 1.2;
        return y;
      };

      // Helper: horizontal line
      const addLine = (lineY: number) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, lineY, pageWidth - margin, lineY);
      };

      // Helper: section title
      const addSectionTitle = (title: string) => {
        y += 10;
        addText(title, margin, {
          fontSize: 12,
          fontStyle: "bold",
          color: C_PRIMARY,
        });
        addLine(y + 4);
        y += 12;
      };

      // Helper: key-value row
      const addRow = (label: string, value: string) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2]);
        doc.text(label, margin, y);
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
        doc.setFont("helvetica", "bold");
        const labelWidth = doc.getTextWidth(label);
        doc.text(value, margin + labelWidth + 8, y);
        y += 15;
      };

      // Helper: two column row
      const addTwoColRow = (label1: string, value1: string, label2: string, value2: string) => {
        const colWidth = contentWidth / 2;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2]);
        doc.text(label1, margin, y);
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
        doc.setFont("helvetica", "bold");
        const lw1 = doc.getTextWidth(label1);
        doc.text(value1, margin + lw1 + 6, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(C_GRAY[0], C_GRAY[1], C_GRAY[2]);
        doc.text(label2, margin + colWidth, y);
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
        doc.setFont("helvetica", "bold");
        const lw2 = doc.getTextWidth(label2);
        doc.text(value2, margin + colWidth + lw2 + 6, y);
        y += 15;
      };

      // ===== HEADER =====
      // Accent bar
      doc.setFillColor(C_ACCENT[0], C_ACCENT[1], C_ACCENT[2]);
      doc.rect(0, 0, pageWidth, 6, "F");

      y = margin + 10;
      addText("LeagueScout", margin, {
        fontSize: 10,
        fontStyle: "bold",
        color: C_ACCENT,
      });
      addText("Professional Scouting Report", margin, {
        fontSize: 18,
        fontStyle: "bold",
        color: C_DARK,
      });
      addLine(y + 8);
      y += 16;

      // ===== PLAYER HEADER =====
      addText(player.pseudo, margin, {
        fontSize: 24,
        fontStyle: "bold",
        color: C_DARK,
      });

      // Meta line
      const metaParts = [
        player.role,
        player.status.replace("_", " "),
        player.league,
        player.currentTeam,
      ].filter(Boolean);
      addText(metaParts.join("  •  "), margin, {
        fontSize: 10,
        color: C_GRAY,
      });

      // Behavior Tags
      if (player.behaviorTags) {
        try {
          const tags = JSON.parse(player.behaviorTags);
          if (Array.isArray(tags) && tags.length > 0) {
            y += 4;
            addText("Tags: " + tags.join(", "), margin, {
              fontSize: 9,
              color: C_PRIMARY,
              fontStyle: "bold",
            });
          }
        } catch { /* ignore */ }
      }
      y += 8;

      // ===== BASIC INFO =====
      addSectionTitle("Player Information");
      addTwoColRow(
        "Real Name:", player.realName || "N/A",
        "Age:", player.age ? `${player.age} years` : "N/A"
      );
      addTwoColRow(
        "Nationality:", player.nationality,
        "League:", player.league
      );
      if (player.currentTeam) {
        addRow("Current Team:", player.currentTeam);
      }

      // ===== SOLOQ STATS =====
      if (player.soloqStats) {
        addSectionTitle("SoloQ Stats");
        addTwoColRow(
          "Current Rank:", player.soloqStats.currentRank,
          "Peak LP:", String(player.soloqStats.peakLp)
        );
        addTwoColRow(
          "Winrate:", `${(player.soloqStats.winrate * 100).toFixed(0)}%`,
          "Total Games:", String(player.soloqStats.totalGames)
        );
        if (player.soloqStats.championPool) {
          addRow("Champion Pool:", player.soloqStats.championPool);
        }
      }

      // ===== PRO STATS =====
      if (player.proStats) {
        addSectionTitle("Pro Stats — 2026 Spring");

        // Early Game
        if (player.proStats.csdAt15 !== null || player.proStats.gdAt15 !== null) {
          addText("Early Game", margin, { fontSize: 10, fontStyle: "bold", color: C_PRIMARY });
          y += 2;
          if (player.proStats.csdAt15 !== null) {
            addRow("CSD@15:", `${player.proStats.csdAt15 > 0 ? "+" : ""}${player.proStats.csdAt15}`);
          }
          if (player.proStats.gdAt15 !== null) {
            addRow("GD@15:", `${player.proStats.gdAt15 > 0 ? "+" : ""}${player.proStats.gdAt15}`);
          }
          if (player.proStats.xpdAt15 !== null) {
            addRow("XPD@15:", `${player.proStats.xpdAt15 > 0 ? "+" : ""}${player.proStats.xpdAt15}`);
          }
          if (player.proStats.fbParticipation !== null) {
            addRow("FB Participation:", `${(player.proStats.fbParticipation * 100).toFixed(0)}%`);
          }
          if (player.proStats.fbVictim !== null) {
            addRow("FB Victim:", `${(player.proStats.fbVictim * 100).toFixed(0)}%`);
          }
          if (player.proStats.deathsUnder15 !== null) {
            addRow("Deaths under 15min:", String(player.proStats.deathsUnder15));
          }
          y += 4;
        }

        // Base
        addText("Base Metrics", margin, { fontSize: 10, fontStyle: "bold", color: C_PRIMARY });
        y += 2;
        if (player.proStats.kda !== null) addRow("KDA:", String(player.proStats.kda));
        if (player.proStats.cspm !== null) addRow("CSPM:", String(player.proStats.cspm));
        if (player.proStats.gpm !== null) addRow("GPM:", String(player.proStats.gpm));
        if (player.proStats.dpm !== null) addRow("DPM:", String(player.proStats.dpm));
        if (player.proStats.kpPercent !== null) addRow("KP%:", `${(player.proStats.kpPercent * 100).toFixed(0)}%`);
        if (player.proStats.visionScore !== null) addRow("Vision Score:", String(player.proStats.visionScore));
        if (player.proStats.wpm !== null) addRow("WPM:", String(player.proStats.wpm));
        if (player.proStats.wcpm !== null) addRow("WCPM:", String(player.proStats.wcpm));
        y += 4;

        // Advanced
        if (player.proStats.damagePercent !== null || player.proStats.goldPercent !== null) {
          addText("Advanced", margin, { fontSize: 10, fontStyle: "bold", color: C_PRIMARY });
          y += 2;
          if (player.proStats.damagePercent !== null) addRow("Damage%:", `${(player.proStats.damagePercent * 100).toFixed(0)}%`);
          if (player.proStats.goldPercent !== null) addRow("Gold%:", `${(player.proStats.goldPercent * 100).toFixed(0)}%`);
          if (player.proStats.soloKills !== null) addRow("Solo Kills:", String(player.proStats.soloKills));
          if (player.proStats.proximityJungle !== null) addRow("Proximity Jungle%:", `${(player.proStats.proximityJungle * 100).toFixed(0)}%`);
          y += 4;
        }

        // Champion Pool
        if (player.proStats.championPool || player.proStats.poolSize !== null) {
          addText("Champion Pool", margin, { fontSize: 10, fontStyle: "bold", color: C_PRIMARY });
          y += 2;
          if (player.proStats.poolSize !== null) addRow("Pool Size:", String(player.proStats.poolSize));
          if (player.proStats.otpScore !== null) addRow("OTP Score:", String(player.proStats.otpScore));
          if (player.proStats.championPool) addRow("Champions:", player.proStats.championPool);
          y += 4;
        }

        if (player.proStats.gamesPlayed !== null) {
          addRow("Games Played:", String(player.proStats.gamesPlayed));
        }
      }

      // ===== BIO =====
      if (player.bio) {
        addSectionTitle("Scout Notes");
        addText(player.bio, margin, {
          fontSize: 9,
          color: C_GRAY,
          maxWidth: contentWidth,
        });
      }

      // ===== REPORTS =====
      const freeReports = player.reports.filter((r) => !r.isPremium);
      if (freeReports.length > 0) {
        addSectionTitle("Recent Reports");
        for (const report of freeReports.slice(0, 3)) {
          // Check page break
          if (y > pageHeight - margin - 100) {
            doc.addPage();
            y = margin;
            // Accent bar on new page
            doc.setFillColor(C_ACCENT[0], C_ACCENT[1], C_ACCENT[2]);
            doc.rect(0, 0, pageWidth, 4, "F");
          }

          // Verdict badge
          let verdictColor = C_GRAY;
          if (report.verdict === "Must Sign") verdictColor = C_GREEN;
          if (report.verdict === "Pass") verdictColor = C_RED;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
          doc.text(report.title, margin, y);

          // Verdict
          doc.setFontSize(9);
          doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
          doc.text(report.verdict, pageWidth - margin, y, { align: "right" });
          y += 14;

          if (report.content) {
            addText(report.content, margin, {
              fontSize: 9,
              color: C_GRAY,
              maxWidth: contentWidth,
            });
          }

          if (report.strengths) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(C_GREEN[0], C_GREEN[1], C_GREEN[2]);
            const strengths = report.strengths
              .split(",")
              .map((s) => `+ ${s.trim()}`)
              .join("  ");
            const lines = doc.splitTextToSize(strengths, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 10;
          }

          if (report.weaknesses) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(C_RED[0], C_RED[1], C_RED[2]);
            const weaknesses = report.weaknesses
              .split(",")
              .map((w) => `- ${w.trim()}`)
              .join("  ");
            const lines = doc.splitTextToSize(weaknesses, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 10;
          }

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(C_LIGHT_GRAY[0], C_LIGHT_GRAY[1], C_LIGHT_GRAY[2]);
          const dateStr = new Date(report.publishedAt).toLocaleDateString();
          doc.text(`by ${report.author} • ${dateStr}`, margin, y);
          y += 20;
        }
      }

      // ===== FOOTER =====
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = pageHeight - margin + 14;
        addLine(footerY - 10);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(C_LIGHT_GRAY[0], C_LIGHT_GRAY[1], C_LIGHT_GRAY[2]);
        const generatedAt = new Date().toLocaleDateString();
        doc.text(
          `LeagueScout • Generated on ${generatedAt} • Page ${i} of ${totalPages}`,
          margin,
          footerY
        );
        doc.text(
          "Confidential — For internal scouting use only",
          pageWidth - margin,
          footerY,
          { align: "right" }
        );
      }

      // Save
      const filename = `${player.pseudo}-scouting-report.pdf`;
      doc.save(filename);
      toast.success("Scouting report downloaded");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={generatePdf}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2 border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white hover:border-[#1A1A2E] dark:hover:border-white"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Export PDF
    </Button>
  );
}

