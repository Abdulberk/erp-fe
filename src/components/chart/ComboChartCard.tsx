"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxis, formatPeriod } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";
import { SeriesTooltip } from "./SeriesTooltip";
import { buildTable, ImputedAwareDot, imputedNote } from "./shared";
import { AXIS_STYLE, CHART_MARGIN, type ChartRow, type SeriesSpec } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  data: ChartRow[];
  xKey: string;
  xLabel: string;
  /** Çubukla çizilen seri (hacim). */
  barSeries: SeriesSpec;
  /** Çizgiyle çizilen seri (seviye). */
  lineSeries: SeriesSpec;
  /** İkisinin ortak birimi. Farklı birimler asla aynı eksene girmez. */
  unit: string;
  height?: number;
  className?: string;
}

/**
 * Aynı birimi paylaşan bir hacim (çubuk) ve bir seviye (çizgi) serisi.
 *
 * **Tek y ekseni.** İki seri de aynı birimde olduğu için ortak eksen meşru;
 * farklı ölçekler söz konusu olsaydı iki ayrı grafik gerekirdi.
 */
export function ComboChartCard({
  title,
  subtitle,
  data,
  xKey,
  xLabel,
  barSeries,
  lineSeries,
  unit,
  height = 260,
  className,
}: Props) {
  const series = [lineSeries, barSeries];

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      series={series}
      bodyHeight={height}
      table={buildTable(data, xKey, xLabel, series)}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatPeriod} {...AXIS_STYLE} />
          <YAxis
            tickFormatter={(v: number) => formatAxis(v, unit)}
            width={56}
            {...AXIS_STYLE}
          />
          <Tooltip
            cursor={{ fill: "var(--hover)" }}
            content={
              <SeriesTooltip
                series={series}
                labelFormatter={formatPeriod}
                note={imputedNote(series)}
              />
            }
          />

          <Bar
            dataKey={barSeries.key}
            name={barSeries.label}
            fill={barSeries.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={lineSeries.key}
            name={lineSeries.label}
            stroke={lineSeries.color}
            strokeWidth={2}
            dot={lineSeries.imputedKey ? <ImputedAwareDot spec={lineSeries} /> : false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
