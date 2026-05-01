"use client";

import { memo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const TIER_COLORS: Record<string, string> = {
  S: "#3B82F6",
  A: "#22C55E",
  B: "#EAB308",
  C: "#F97316",
  D: "#EF4444",
};

interface MetricPoint {
  metric: string;
  percentile: number;
  tier: "S" | "A" | "B" | "C" | "D";
  value?: number;
}

interface ComparisonPoint {
  metric: string;
  averagePercentile: number;
  averageValue?: number;
}

interface RadarChartProps {
  metrics: MetricPoint[];
  playerName: string;
  role: string;
  comparison?: ComparisonPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload as MetricPoint & { fullMark: number };
  return (
    <div className="rounded-lg border border-border bg-surface-header px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-text-heading">{label}</p>
      <p className="text-xs text-text-muted">
        {data.percentile}th percentile (Tier {data.tier})
      </p>
    </div>
  );
}

function RadarChartComponent({ metrics, playerName, role, comparison }: RadarChartProps) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-text-muted">
        No radar data available.
      </div>
    );
  }

  const data = metrics.map((m) => ({
    ...m,
    fullMark: 100,
    averagePercentile: comparison?.find((c) => c.metric === m.metric)?.averagePercentile ?? 50,
  }));

  const chartDescription = metrics
    .map((m) => `${m.metric}: ${m.percentile}th percentile (Tier ${m.tier})`)
    .join("; ");

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="text-xs text-text-muted">{tier}</span>
          </div>
        ))}
      </div>

      {/* Chart with accessibility */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={data}
            role="img"
            aria-label={`Performance radar chart for ${playerName} (${role}). ${chartDescription}`}
          >
            <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#ADB5BD", fontSize: 11, fontWeight: "bold" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#6C757D", fontSize: 10 }}
              tickCount={6}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {comparison && comparison.length > 0 && (
              <Radar
                name={`${role} average`}
                dataKey="averagePercentile"
                stroke="#6C757D"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
                dot={false}
                activeDot={false}
              />
            )}
            <Radar
              name={`${playerName} — ${role}`}
              dataKey="percentile"
              stroke="#E94560"
              strokeWidth={2}
              fill="#E94560"
              fillOpacity={0.15}
              dot={(props: any) => {
                const { cx, cy, index } = props;
                if (cx == null || cy == null || index == null) return null;
                const tier = metrics[index]?.tier ?? "D";
                const color = TIER_COLORS[tier] || TIER_COLORS.D;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={color}
                    stroke={color}
                  />
                );
              }}
              activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Visually hidden data table for screen readers */}
        <table className="sr-only">
          <caption>Radar chart data for {playerName}</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Percentile</th>
              <th scope="col">Tier</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.metric}>
                <th scope="row">{m.metric}</th>
                <td>{m.percentile}</td>
                <td>{m.tier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(RadarChartComponent);
