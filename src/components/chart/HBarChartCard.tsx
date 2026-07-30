"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxis, formatValue } from "@/lib/format";
import { ChartFrame } from "./ChartFrame";
import type { ChartRow, TableColumn } from "./types";
import { AXIS_STYLE, CHART_MARGIN } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  /** Azalan sırada verilmeli — bileşen yeniden sıralamaz. */
  data: ChartRow[];
  /** Kategori ekseni (y) alanı. */
  categoryKey: string;
  categoryLabel: string;
  /** Değer ekseni (x) alanı. */
  valueKey: string;
  valueLabel: string;
  unit: string;
  /** Çubuk rengi satır başına belirlenir — şiddet / eşik bandı. */
  colorFor: (row: ChartRow) => string;
  /** Eşik referans çizgileri (örn. 1,5 / 6 / 12 ay). */
  referenceLines?: { value: number; label: string }[];
  /** Renk bandlarının ikon + etiketli açıklaması. Renk tek başına anlam taşımaz. */
  statusLegend?: React.ReactNode;
  /** Tabloya eklenecek ek kolonlar. */
  extraColumns?: TableColumn[];
  rowHeight?: number;
  className?: string;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
}

/**
 * Yatay çubuk grafiği. Sıralı bir büyüklüğü kayıt bazında karşılaştırır;
 * uzun etiketler yatay eksende okunur kalır.
 */
export function HBarChartCard({
  title,
  subtitle,
  data,
  categoryKey,
  categoryLabel,
  valueKey,
  valueLabel,
  unit,
  colorFor,
  referenceLines,
  statusLegend,
  extraColumns = [],
  rowHeight = 26,
  className,
}: Props) {
  const height = Math.max(160, data.length * rowHeight + 40);

  const columns: TableColumn[] = [
    { key: categoryKey, label: categoryLabel, align: "left" },
    { key: valueKey, label: valueLabel, unit },
    ...extraColumns,
  ];

  function BarTooltip({ active, payload }: BarTooltipProps) {
    const row = payload?.[0]?.payload;
    if (!active || !row) return null;
    const value = row[valueKey];
    return (
      <div className="pointer-events-none rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-lg">
        <p className="mb-1 text-[11px] font-semibold text-ink-1">
          {String(row[categoryKey] ?? "")}
        </p>
        <p className="flex items-baseline justify-between gap-4 text-[11px]">
          <span className="text-ink-2">{valueLabel}</span>
          <span className="tnum font-semibold text-ink-1">
            {formatValue(typeof value === "number" ? value : null, unit)}
          </span>
        </p>
      </div>
    );
  }

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      table={{ columns, rows: data }}
      controls={statusLegend}
      bodyHeight={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ ...CHART_MARGIN, left: 8, right: 16 }}
          barCategoryGap={4}
        >
          <CartesianGrid stroke="var(--grid)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatAxis(v, unit)}
            {...AXIS_STYLE}
          />
          <YAxis
            type="category"
            dataKey={categoryKey}
            // Kayıt etiketleri uzun; dar bırakılırsa Recharts iki satıra sarıyor.
            width={244}
            interval={0}
            {...AXIS_STYLE}
          />
          <Tooltip cursor={{ fill: "var(--hover)" }} content={<BarTooltip />} />

          {referenceLines?.map((ref) => (
            <ReferenceLine
              key={ref.label}
              x={ref.value}
              stroke="var(--axis)"
              strokeDasharray="3 3"
              label={{
                value: ref.label,
                position: "top",
                fill: "var(--ink-muted)",
                fontSize: 10,
              }}
            />
          ))}

          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((row, i) => (
              <Cell key={i} fill={colorFor(row)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
