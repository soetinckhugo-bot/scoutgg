"use client";

import { useMemo } from "react";
import { getTierFromPercentile, getCentileClass, type PercentileResult } from "@/lib/percentiles";
import { getMetricDefinition } from "@/lib/radar-metrics";

interface PercentileBarsProps {
  percentiles: Record<string, PercentileResult | null>;
  title?: string;
  maxItems?: number;
  showEmpty?: boolean;
}

function PercentileBar({
  metric,
  result,
}: {
  metric: string;
  result: PercentileResult;
}) {
  const def = getMetricDefinition(metric);
  const label = def?.fullName ?? metric;
  const tier = getTierFromPercentile(result.percentile);

  return (
    <div className="group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      {/* Tier badge */}
      <div
        className={`w-8 h-7 rounded-md text-xs font-bold flex items-center justify-center ${getCentileClass(result.percentile)}`}
      >
        {tier.tier}
      </div>

      {/* Metric info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[#ADB5BD] dark:text-gray-300 truncate">
            {label}
          </span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: tier.color }}
          >
            {result.percentile}th
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${result.percentile}%`,
              backgroundColor: tier.color,
            }}
          />
        </div>

        {/* Subtle rank info */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-[#6C757D] dark:text-gray-500">
            {def?.description}
          </span>
          <span className="text-xs text-[#6C757D] dark:text-gray-500">
            {result.rank}/{result.total}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PercentileBars({
  percentiles,
  title = "Percentile Analysis",
  maxItems,
  showEmpty = false,
}: PercentileBarsProps) {
  const entries = useMemo(() => {
    const items = Object.entries(percentiles)
      .filter(([, result]) => result !== null)
      .sort((a, b) => (b[1]?.percentile ?? 0) - (a[1]?.percentile ?? 0));

    return maxItems ? items.slice(0, maxItems) : items;
  }, [percentiles, maxItems]);

  if (entries.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-bold text-[#E9ECEF] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#E94560] rounded-full" />
          {title}
        </h3>
      )}

      <div className="space-y-1">
        {entries.map(([metric, result]) =>
          result ? (
            <PercentileBar key={metric} metric={metric} result={result} />
          ) : null
        )}
      </div>

      {entries.length === 0 && showEmpty && (
        <div className="text-center py-6 text-sm text-[#6C757D] dark:text-gray-500">
          No percentile data available.
        </div>
      )}
    </div>
  );
}
