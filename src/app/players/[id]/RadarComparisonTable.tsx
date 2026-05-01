"use client";

interface ComparisonPoint {
  metric: string;
  averagePercentile: number;
  averageValue?: number;
}

interface MetricPoint {
  metric: string;
  percentile: number;
  tier: "S" | "A" | "B" | "C" | "D";
  value?: number;
}

interface RadarComparisonTableProps {
  metrics: MetricPoint[];
  comparison?: ComparisonPoint[];
  playerName: string;
  role: string;
}

function getRankColor(rank: number): string {
  if (rank <= 3) return "text-yellow-400 bg-yellow-400/10";
  if (rank <= 6) return "text-emerald-400 bg-emerald-400/10";
  if (rank <= 10) return "text-blue-400 bg-blue-400/10";
  return "text-text-muted bg-surface-hover";
}

export default function RadarComparisonTable({
  metrics,
  comparison,
  playerName,
  role,
}: RadarComparisonTableProps) {
  if (!comparison || comparison.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-text-muted">
        No comparison data available.
      </div>
    );
  }

  // Sort by player percentile descending to calculate ranks
  const sortedByPercentile = [...metrics].sort((a, b) => b.percentile - a.percentile);
  const rankMap: Record<string, number> = {};
  sortedByPercentile.forEach((m, i) => {
    rankMap[m.metric] = i + 1;
  });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Performance Breakdown
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#E94560]" />
            <span className="text-text-muted">{playerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#6C757D] border-dashed border-t border-[#6C757D]" />
            <span className="text-text-muted">{role} avg</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-card text-text-muted uppercase tracking-wider border-b border-border">
              <th className="text-left py-2 px-3 font-semibold">Metric</th>
              <th className="text-center py-2 px-3 font-semibold">Rank</th>
              <th className="text-center py-2 px-3 font-semibold">{playerName}</th>
              <th className="text-center py-2 px-3 font-semibold">{role} (avg)</th>
              <th className="text-center py-2 px-3 font-semibold">Diff</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const comp = comparison.find((c) => c.metric === m.metric);
              const avg = comp?.averagePercentile ?? 50;
              const diff = m.percentile - avg;
              const rank = rankMap[m.metric];

              return (
                <tr
                  key={m.metric}
                  className="bg-surface-elevated hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
                >
                  <td className="py-2 px-3 text-text-heading font-medium">{m.metric}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getRankColor(rank)}`}>
                      {rank}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-text-heading font-bold tabular-nums">
                    {m.value !== undefined ? Number(m.value).toFixed(m.value % 1 === 0 ? 0 : 2) : m.percentile}
                  </td>
                  <td className="py-2 px-3 text-center text-text-muted tabular-nums">
                    {comp?.averageValue !== undefined ? Number(comp.averageValue).toFixed(comp.averageValue % 1 === 0 ? 0 : 2) : avg.toFixed(0)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`font-bold tabular-nums ${
                        diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-text-muted"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(0)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
