"use client";

import React, { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Check, Camera } from "lucide-react";
import { ROLE_COLORS, TIER_COLORS } from "@/lib/constants";

interface ShareableReportProps {
  player: {
    id: string;
    pseudo: string;
    realName?: string | null;
    role: string;
    league: string;
    currentTeam?: string | null;
    photoUrl?: string | null;
    tier?: string | null;
    age?: number | null;
    nationality?: string | null;
  };
  stats?: {
    kda?: number | null;
    dpm?: number | null;
    csdAt15?: number | null;
    gdAt15?: number | null;
    gamesPlayed?: number | null;
  };
  verdict?: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCardToCanvas(
  el: HTMLDivElement,
  player: ShareableReportProps["player"],
  stats?: ShareableReportProps["stats"],
  verdict?: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  const rect = el.getBoundingClientRect();
  const scale = 2;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#0F0F1A";
  ctx.beginPath();
  ctx.roundRect(0, 0, rect.width, rect.height, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = "#2A2D3A";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, rect.width - 1, rect.height - 1, 12);
  ctx.stroke();

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    } = {}
  ) => {
    const {
      font = "14px sans-serif",
      color = "#ffffff",
      align = "left",
      baseline = "alphabetic",
    } = options;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  };

  const pad = 20;
  let y = pad;

  // Logo
  ctx.fillStyle = "#E94560";
  ctx.beginPath();
  ctx.arc(pad + 12, y + 12, 12, 0, Math.PI * 2);
  ctx.fill();
  drawText("LS", pad + 12, y + 16, {
    font: "bold 10px sans-serif",
    color: "#ffffff",
    align: "center",
    baseline: "middle",
  });
  drawText("LEAGUESCOUT REPORT", pad + 32, y + 12, {
    font: "600 10px sans-serif",
    color: "#A0AEC0",
    baseline: "middle",
  });
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  drawText(dateStr, rect.width - pad, y + 12, {
    font: "10px sans-serif",
    color: "#A0AEC0",
    align: "right",
    baseline: "middle",
  });

  y += 44;

  // Photo
  const imgSize = 64;
  const imgX = pad;
  const imgY = y;

  if (player.photoUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new window.Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = player.photoUrl!;
      });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      ctx.restore();
    } catch {
      ctx.fillStyle = "#1A1A2E";
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
      ctx.fill();
      drawText((player.pseudo?.[0] ?? "?").toUpperCase(), imgX + imgSize / 2, imgY + imgSize / 2, {
        font: "bold 20px sans-serif",
        color: "#A0AEC0",
        align: "center",
        baseline: "middle",
      });
    }
  } else {
    ctx.fillStyle = "#1A1A2E";
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 8);
    ctx.fill();
    drawText((player.pseudo?.[0] ?? "?").toUpperCase(), imgX + imgSize / 2, imgY + imgSize / 2, {
      font: "bold 20px sans-serif",
      color: "#A0AEC0",
      align: "center",
      baseline: "middle",
    });
  }

  const tx = imgX + imgSize + 12;
  let ty = imgY + 4;
  drawText(player.pseudo, tx, ty, {
    font: "bold 18px sans-serif",
    color: "#ffffff",
  });

  if (player.tier) {
    const tw = ctx.measureText(player.tier).width + 12;
    const tierX = tx + ctx.measureText(player.pseudo).width + 10;
    ctx.fillStyle = "rgba(245,158,11,0.1)";
    ctx.strokeStyle = "rgba(245,158,11,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tierX, ty - 12, tw, 20, 4);
    ctx.fill();
    ctx.stroke();
    drawText(player.tier, tierX + tw / 2, ty - 1, {
      font: "bold 10px sans-serif",
      color: "#fbbf24",
      align: "center",
      baseline: "middle",
    });
  }

  ty += 22;
  if (player.realName) {
    drawText(player.realName, tx, ty, {
      font: "11px sans-serif",
      color: "#A0AEC0",
    });
    ty += 16;
  } else {
    ty += 4;
  }

  const roleWidth = ctx.measureText(player.role).width + 12;
  ctx.fillStyle = "rgba(100,116,139,0.2)";
  ctx.strokeStyle = "rgba(100,116,139,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tx, ty - 10, roleWidth, 18, 4);
  ctx.fill();
  ctx.stroke();
  drawText(player.role, tx + roleWidth / 2, ty + 1, {
    font: "10px sans-serif",
    color: "#94a3b8",
    align: "center",
    baseline: "middle",
  });

  const leagueX = tx + roleWidth + 8;
  let lt = player.league;
  if (player.currentTeam) lt += ` \u2022 ${player.currentTeam}`;
  drawText(lt, leagueX, ty + 1, {
    font: "10px sans-serif",
    color: "#A0AEC0",
    baseline: "middle",
  });

  y += imgSize + 16;

  if (stats) {
    const cols = 4;
    const gap = 8;
    const cellW = (rect.width - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = 56;
    const items = [
      { label: "KDA", value: stats.kda?.toFixed(2) ?? "\u2014" },
      { label: "DPM", value: stats.dpm?.toFixed(0) ?? "\u2014" },
      {
        label: "CSD@15",
        value:
          stats.csdAt15 != null
            ? `${stats.csdAt15 > 0 ? "+" : ""}${stats.csdAt15.toFixed(1)}`
            : "\u2014",
      },
      { label: "Games", value: stats.gamesPlayed?.toString() ?? "\u2014" },
    ];
    items.forEach((item, i) => {
      const cx = pad + i * (cellW + gap);
      ctx.fillStyle = "#1A1A2E";
      ctx.beginPath();
      ctx.roundRect(cx, y, cellW, cellH, 8);
      ctx.fill();
      drawText(item.label, cx + cellW / 2, y + 14, {
        font: "9px sans-serif",
        color: "#A0AEC0",
        align: "center",
        baseline: "middle",
      });
      drawText(item.value, cx + cellW / 2, y + 36, {
        font: "bold 16px sans-serif",
        color: "#ffffff",
        align: "center",
        baseline: "middle",
      });
    });
    y += cellH + 16;
  }

  if (verdict) {
    ctx.fillStyle = "#1A1A2E";
    ctx.beginPath();
    ctx.roundRect(pad, y, rect.width - pad * 2, 56, 8);
    ctx.fill();
    drawText("Scout Verdict", pad + 10, y + 18, {
      font: "9px sans-serif",
      color: "#A0AEC0",
      baseline: "middle",
    });
    const maxW = rect.width - pad * 2 - 20;
    ctx.font = "12px sans-serif";
    const lines = wrapText(ctx, verdict, maxW);
    let ly = y + 34;
    for (const line of lines.slice(0, 2)) {
      drawText(line, pad + 10, ly, {
        font: "12px sans-serif",
        color: "#ffffff",
        baseline: "middle",
      });
      ly += 16;
    }
    y += 68;
  }

  const footerY = rect.height - 14;
  drawText("leaguescout.gg", pad, footerY, {
    font: "10px sans-serif",
    color: "#A0AEC0",
    baseline: "bottom",
  });
  drawText("Professional scouting intelligence", rect.width - pad, footerY, {
    font: "10px sans-serif",
    color: "#A0AEC0",
    align: "right",
    baseline: "bottom",
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

export function ShareableReport({ player, stats, verdict }: ShareableReportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!ref.current) return;
    try {
      const blob = await drawCardToCanvas(ref.current, player, stats, verdict);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `${player.pseudo}-scout-report.png`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report image:", err);
    }
  }, [player, stats, verdict]);

  const handleCopy = useCallback(async () => {
    if (!ref.current) return;
    try {
      const blob = await drawCardToCanvas(ref.current, player, stats, verdict);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  }, [player, stats, verdict]);

  return (
    <div className="space-y-3">
      {/* The shareable card */}
      <div
        ref={ref}
        className="relative bg-background border border-border rounded-xl p-5 w-full overflow-hidden"
        style={{ aspectRatio: "1200/630" }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary-accent flex items-center justify-center">
              <span className="text-text-heading font-bold text-xs">LS</span>
            </div>
            <span className="text-text-body text-xs font-semibold tracking-wider">
              LEAGUESCOUT REPORT
            </span>
          </div>
          <span className="text-text-body text-[10px]">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Player identity */}
        <div className="flex items-start gap-3 mb-4">
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.pseudo}
              width={64}
              height={64}
              className="rounded-lg object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-surface-elevated flex items-center justify-center text-xl font-bold text-text-body shrink-0">
              {(player.pseudo?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-text-heading truncate">{player.pseudo}</h2>
              {player.tier && (
                <Badge className={`${TIER_COLORS[player.tier] || ""} text-xs border`}>
                  {player.tier}
                </Badge>
              )}
            </div>
            {player.realName && (
              <p className="text-text-body text-xs truncate">{player.realName}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[10px] ${ROLE_COLORS[player.role] || ""} border`}>
                {player.role}
              </Badge>
              <span className="text-text-body text-[10px]">{player.league}</span>
              {player.currentTeam && (
                <span className="text-text-body text-[10px] truncate">
                  &bull; {player.currentTeam}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-surface-elevated rounded-lg p-2.5 text-center min-w-0">
              <p className="text-text-body text-[9px] uppercase tracking-wider mb-1">
                KDA
              </p>
              <p className="text-text-heading text-base font-bold tabular-nums truncate">
                {stats.kda?.toFixed(2) || "\u2014"}
              </p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2.5 text-center min-w-0">
              <p className="text-text-body text-[9px] uppercase tracking-wider mb-1">
                DPM
              </p>
              <p className="text-text-heading text-base font-bold tabular-nums truncate">
                {stats.dpm?.toFixed(0) || "\u2014"}
              </p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2.5 text-center min-w-0">
              <p className="text-text-body text-[9px] uppercase tracking-wider mb-1">
                CSD@15
              </p>
              <p className="text-text-heading text-base font-bold tabular-nums truncate">
                {stats.csdAt15 != null
                  ? `${stats.csdAt15 > 0 ? "+" : ""}${stats.csdAt15.toFixed(1)}`
                  : "\u2014"}
              </p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-2.5 text-center min-w-0">
              <p className="text-text-body text-[9px] uppercase tracking-wider mb-1">
                Games
              </p>
              <p className="text-text-heading text-base font-bold tabular-nums truncate">
                {stats.gamesPlayed || "\u2014"}
              </p>
            </div>
          </div>
        )}

        {/* Verdict */}
        {verdict && (
          <div className="bg-surface-elevated rounded-lg p-3">
            <p className="text-text-body text-[9px] uppercase tracking-wider mb-1">
              Scout Verdict
            </p>
            <p className="text-text-heading text-xs leading-relaxed line-clamp-2">{verdict}</p>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
          <span className="text-text-body text-[10px]">leaguescout.gg</span>
          <span className="text-text-body text-[10px]">
            Professional scouting intelligence
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy Image"}
        </Button>
      </div>
    </div>
  );
}
