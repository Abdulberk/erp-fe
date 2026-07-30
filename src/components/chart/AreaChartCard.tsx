"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxis, formatPeriod } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";
import { SeriesTooltip } from "./SeriesTooltip";
import { AXIS_STYLE, CHART_MARGIN, type ChartRow, type SeriesSpec } from "./types";
import { buildTable } from "./shared";

interface Props {
  title: string;
  subtitle?: string;
  data: ChartRow[];
  xKey: string;
  xLabel: string;
  series: SeriesSpec;
  height?: number;
  className?: string;
}

/**
 * Tek serili alan grafiği — bir büyüklüğün zaman içindeki hacmini gösterir.
 * Tek seride legend kutusu yok; başlık zaten seriyi adlandırıyor.
 */
export function AreaChartCard({
  title,
  subtitle,
  data,
  xKey,
  xLabel,
  series,
  height = 240,
  className,
}: Props) {
  const gradientId = `area-${series.key}`;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      bodyHeight={height}
      table={buildTable(data, xKey, xLabel, [series])}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={series.color} stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatPeriod} {...AXIS_STYLE} />
          <YAxis
            tickFormatter={(v: number) => formatAxis(v, series.unit)}
            width={56}
            {...AXIS_STYLE}
          />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={<SeriesTooltip series={[series]} labelFormatter={formatPeriod} />}
          />
          <Area
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={series.color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
