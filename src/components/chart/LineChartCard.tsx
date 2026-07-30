"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxis, formatPeriod } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";
import { SeriesTooltip } from "./SeriesTooltip";
import { AXIS_STYLE, CHART_MARGIN, type ChartRow, type SeriesSpec } from "./types";
import {
  buildTable,
  directLabelMargin,
  ImputedAwareDot,
  imputedNote,
  LastPointLabel,
} from "./shared";

interface Props {
  title: string;
  subtitle?: string;
  data: ChartRow[];
  xKey: string;
  xLabel: string;
  series: SeriesSpec[];
  /** Tüm serilerin ortak birimi. Farklı birimler asla aynı eksene girmez. */
  unit: string;
  height?: number;
  controls?: React.ReactNode;
  legendInControls?: boolean;
  referenceLines?: { value: number; label: string }[];
  /**
   * Dar bantta gezinen oranlarda sıfır tabanlı eksen hikâyeyi siliyor.
   * Verilirse eksen veri aralığına yakınlaştırılır — alt başlıkta belirtin.
   */
  yDomain?: [number | string, number | string];
  className?: string;
}

/**
 * Çok serili çizgi grafiği.
 *
 * **Çift eksen yok.** Tüm seriler aynı birimi paylaşır; farklı ölçekteki
 * büyüklükler (TL ve %) ayrı grafiklere gider.
 */
export function LineChartCard({
  title,
  subtitle,
  data,
  xKey,
  xLabel,
  series,
  unit,
  height = 240,
  controls,
  legendInControls,
  referenceLines,
  yDomain,
  className,
}: Props) {
  const lastIndex = data.length - 1;
  // ≤4 seride legend'a ek olarak doğrudan etiket; tek seride başlık yeter.
  const direct = series.length >= 2 && series.length <= 4;
  const rightMargin = direct ? directLabelMargin(series) : CHART_MARGIN.right;

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      series={series}
      controls={controls}
      legendInControls={legendInControls}
      bodyHeight={height}
      table={buildTable(data, xKey, xLabel, series)}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ ...CHART_MARGIN, right: rightMargin }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatPeriod} {...AXIS_STYLE} />
          <YAxis
            tickFormatter={(v: number) => formatAxis(v, unit)}
            width={56}
            domain={yDomain}
            {...AXIS_STYLE}
          />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={
              <SeriesTooltip
                series={series}
                labelFormatter={formatPeriod}
                note={imputedNote(series)}
              />
            }
          />

          {referenceLines?.map((ref) => (
            <ReferenceLine
              key={ref.label}
              y={ref.value}
              stroke="var(--axis)"
              strokeDasharray="3 3"
              label={{
                value: ref.label,
                position: "insideTopLeft",
                fill: "var(--ink-muted)",
                fontSize: 10,
              }}
            />
          ))}

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              // Nokta işaretçisi yok; yalnızca türetilmiş değerler işaretleniyor.
              dot={s.imputedKey ? <ImputedAwareDot spec={s} /> : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            >
              {direct ? (
                <LabelList
                  dataKey={s.key}
                  content={<LastPointLabel spec={s} lastIndex={lastIndex} />}
                />
              ) : null}
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
