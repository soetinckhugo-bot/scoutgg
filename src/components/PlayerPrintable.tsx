import type { Player, SoloqStats, ProStats, Report } from "@prisma/client";
import { calculateAge } from "@/lib/age";
import { getBaseUrl } from "@/lib/utils";

interface PlayerPrintableProps {
  player: Player & {
    soloqStats: SoloqStats | null;
    proStats: ProStats | null;
    reports: Report[];
  };
  id?: string;
}

function fmt(num: number | null | undefined, suffix = "", decimals = 1): string {
  if (num === null || num === undefined) return "—";
  const prefix = num > 0 && (suffix === "" || suffix.startsWith("%")) ? "+" : "";
  return `${prefix}${num.toFixed(decimals)}${suffix}`;
}

function fmtPct(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";
  return `${(num * 100).toFixed(0)}%`;
}

export default function PlayerPrintable({ player, id }: PlayerPrintableProps) {
  const age = calculateAge(player.dateOfBirth) ?? player.age ?? null;
  const freeReports = player.reports.filter((r) => !r.isPremium).slice(0, 2);

  const soloq = player.soloqStats;
  const pro = player.proStats;

  return (
    <div
      id={id}
      className="bg-white text-gray-900"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "48px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "3px solid #E94560", paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A2E", margin: 0, letterSpacing: "-0.5px" }}>
              {player.pseudo}
            </h1>
            <p style={{ fontSize: 13, color: "#6C757D", margin: "4px 0 0" }}>
              Professional Scouting Report • LeagueScout
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#6C757D", margin: 0 }}>
              Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p style={{ fontSize: 11, color: "#6C757D", margin: "2px 0 0" }}>
              {getBaseUrl().replace(/^https?:\/\//, "")}/players/{player.id}
            </p>
          </div>
        </div>
      </div>

      {/* Identity row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        {player.photoUrl && (
          <img
            src={player.photoUrl}
            alt={player.pseudo}
            width={100}
            height={100}
            style={{ borderRadius: 8, objectFit: "cover", border: "2px solid #E9ECEF" }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={badgeStyle("#0F3460", "#fff")}>{player.role}</span>
            <span style={badgeStyle("#E9ECEF", "#495057")}>{player.league}</span>
            <span style={badgeStyle("#E9ECEF", "#495057")}>{player.status.replace(/_/g, " ")}</span>
            {player.currentTeam && (
              <span style={badgeStyle("#E94560", "#fff")}>{player.currentTeam}</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", fontSize: 12 }}>
            <div><span style={labelStyle}>Real Name:</span> {player.realName || "—"}</div>
            <div><span style={labelStyle}>Age:</span> {age ? `${age} years` : "—"}</div>
            <div><span style={labelStyle}>Nationality:</span> {player.nationality || "—"}</div>
            <div><span style={labelStyle}>Contract:</span> {player.contractEndDate ? new Date(player.contractEndDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</div>
          </div>
        </div>
      </div>

      {/* SoloQ */}
      {soloq && (
        <Section title="SoloQ Status">
          <Grid4
            items={[
              { label: "Current Rank", value: soloq.currentRank || "—" },
              { label: "Peak LP", value: soloq.peakLp ? `+${soloq.peakLp}` : "—" },
              { label: "Winrate", value: fmtPct(soloq.winrate) },
              { label: "Total Games", value: String(soloq.totalGames ?? "—") },
            ]}
          />
          {soloq.championPool && (
            <p style={{ fontSize: 11, color: "#6C757D", marginTop: 8 }}>
              <span style={labelStyle}>Champion Pool:</span> {soloq.championPool}
            </p>
          )}
        </Section>
      )}

      {/* Pro Stats */}
      {pro && (
        <Section title="Professional Stats">
          <Grid4
            items={[
              { label: "KDA", value: fmt(pro.kda) },
              { label: "CSPM", value: fmt(pro.cspm) },
              { label: "DPM", value: fmt(pro.dpm, "", 0) },
              { label: "GPM", value: fmt(pro.gpm) },
              { label: "GD@15", value: fmt(pro.gdAt15) },
              { label: "CSD@15", value: fmt(pro.csdAt15) },
              { label: "XPD@15", value: fmt(pro.xpdAt15) },
              { label: "KP%", value: fmtPct(pro.kpPercent) },
              { label: "Vision Score", value: fmt(pro.visionScore, "", 1) },
              { label: "WPM", value: fmt(pro.wpm) },
              { label: "WCPM", value: fmt(pro.wcpm) },
              { label: "Games", value: String(pro.gamesPlayed ?? "—") },
            ]}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            <MiniStat label="Damage%" value={fmtPct(pro.damagePercent)} />
            <MiniStat label="Gold%" value={fmtPct(pro.goldPercent)} />
            <MiniStat label="Pool Size" value={String(pro.poolSize ?? "—")} />
          </div>
        </Section>
      )}

      {/* Bio */}
      {player.bio && (
        <Section title="Scout Notes">
          <p style={{ fontSize: 11, color: "#495057", margin: 0, whiteSpace: "pre-wrap" }}>
            {player.bio}
          </p>
        </Section>
      )}

      {/* Reports */}
      {freeReports.length > 0 && (
        <Section title="Recent Reports">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {freeReports.map((r) => (
              <div key={r.id} style={{ borderLeft: "3px solid #E94560", paddingLeft: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{r.title}</h4>
                  <span style={verdictBadgeStyle(r.verdict)}>{r.verdict}</span>
                </div>
                {r.content && (
                  <p style={{ fontSize: 10, color: "#6C757D", margin: "4px 0 0" }}>{r.content}</p>
                )}
                {(r.strengths || r.weaknesses) && (
                  <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 10 }}>
                    {r.strengths && (
                      <span style={{ color: "#1E7E34" }}>+ {r.strengths}</span>
                    )}
                    {r.weaknesses && (
                      <span style={{ color: "#E94560" }}>− {r.weaknesses}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 24,
          borderTop: "1px solid #E9ECEF",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#ADB5BD",
        }}
      >
        <span>Confidential — For internal scouting use only</span>
        <span>LeagueScout.gg</span>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1A1A2E",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          margin: "0 0 10px",
          paddingBottom: 4,
          borderBottom: "1px solid #E9ECEF",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid4({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px 16px" }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ fontSize: 9, color: "#ADB5BD", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {item.label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#212529" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#F8F9FA", borderRadius: 6, padding: "8px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#ADB5BD", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#212529" }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { color: "#6C757D", fontWeight: 600 };

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  };
}

function verdictBadgeStyle(verdict: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    "Must Sign": { bg: "#D4EDDA", color: "#155724" },
    "Consider": { bg: "#FFF3CD", color: "#856404" },
    Pass: { bg: "#F8D7DA", color: "#721C24" },
  };
  const style = map[verdict] || { bg: "#E9ECEF", color: "#495057" };
  return {
    background: style.bg,
    color: style.color,
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 4,
    textTransform: "uppercase" as const,
  };
}
