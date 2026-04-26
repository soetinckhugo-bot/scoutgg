"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChampionData {
  name: string;
  games: number;
}

interface ChampionPoolChartProps {
  championPool: string;
}

function parseChampionPool(pool: string): ChampionData[] {
  if (!pool || pool === "[]") return [];

  // Try JSON array first
  try {
    const parsed = JSON.parse(pool);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => ({
          name: item.champion || String(item),
          games: item.games || 1,
        }))
        .filter((c) => c.name);
    }
  } catch {
    // Not JSON, treat as CSV
  }

  // CSV format: "Garen (89), Olaf (67), ..."
  return pool
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const match = c.match(/^(.+?)\s*\((\d+)\)$/);
      if (match) {
        return { name: match[1].trim(), games: parseInt(match[2], 10) };
      }
      return { name: c, games: 1 };
    })
    .filter((c) => c.name);
}

const CHAMPION_COLORS = [
  "#E94560",
  "#0F3460",
  "#28A745",
  "#FFC107",
  "#6F42C1",
  "#17A2B8",
  "#FD7E14",
  "#DC3545",
  "#20C997",
  "#6610F2",
];

export default function ChampionPoolChart({
  championPool,
}: ChampionPoolChartProps) {
  const data = parseChampionPool(championPool)
    .sort((a, b) => b.games - a.games)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#6C757D] dark:text-gray-400">
        No champion data available
      </div>
    );
  }

  const maxGames = Math.max(...data.map((d) => d.games));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            domain={[0, Math.ceil(maxGames * 1.2)]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--card-foreground)",
              fontSize: "13px",
            }}
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => [`${value} games`, "Played"]}
          />
          <Bar dataKey="games" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHAMPION_COLORS[index % CHAMPION_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-[#6C757D] dark:text-gray-400 mt-2">
        Top {data.length} champions by games played
      </p>
    </div>
  );
}

