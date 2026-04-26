"use client";

import { useEffect, useRef, memo } from "react";
import {
  Chart as ChartJS,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";

ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TIER_COLORS = {
  S: "#F59E0B",
  A: "#EAB308",
  B: "#F97316",
  C: "#EF4444",
  D: "#6B7280",
};

interface MetricPoint {
  metric: string;
  percentile: number;
  tier: "S" | "A" | "B" | "C" | "D";
}

interface RadarChartProps {
  metrics: MetricPoint[];
  playerName: string;
  role: string;
}

function RadarChart({ metrics, playerName, role }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || metrics.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = metrics.map((m) => m.metric);
    const dataValues = metrics.map((m) => m.percentile);
    const pointColors = metrics.map((m) => TIER_COLORS[m.tier]);

    const data: ChartData<"radar"> = {
      labels,
      datasets: [
        {
          label: `${playerName} — ${role}`,
          data: dataValues,
          backgroundColor: "rgba(233, 69, 96, 0.15)",
          borderColor: "#E94560",
          borderWidth: 2,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointHoverBackgroundColor: pointColors,
          pointHoverBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
        },
      ],
    };

    const options: ChartOptions<"radar"> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: "#6C757D",
            backdropColor: "transparent",
            font: { size: 10 },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.08)",
          },
          angleLines: {
            color: "rgba(255, 255, 255, 0.08)",
          },
          pointLabels: {
            color: "#ADB5BD",
            font: { size: 11, weight: "bold" },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#1A1D29",
          titleColor: "#E9ECEF",
          bodyColor: "#ADB5BD",
          borderColor: "#2A2D3A",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => {
              const metric = metrics[context.dataIndex];
              return `${metric.percentile}th percentile (${metric.tier})`;
            },
          },
        },
      },
    };

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "radar",
      data,
      options,
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [metrics, playerName, role]);

  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No radar data available.
      </div>
    );
  }

  // Generate accessible description
  const chartDescription = metrics
    .map((m) => `${m.metric}: ${m.percentile}th percentile (Tier ${m.tier})`)
    .join("; ");

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{tier}</span>
          </div>
        ))}
      </div>

      {/* Chart with accessibility */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Performance radar chart for ${playerName} (${role}). ${chartDescription}`}
        />
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

export default memo(RadarChart);
