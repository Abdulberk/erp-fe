"use client";

import { useMemo, useState } from "react";
import { LineChartCard } from "@/components/chart/LineChartCard";
import type { ChartRow, SeriesSpec } from "@/components/chart/types";
import { buildColorMap } from "@/lib/tokens";
import type { DimensionRow } from "@/lib/types";

interface Props {
  rows: DimensionRow[];
  periods: string[];
  /** Kırılabilecek boyutlar, backend'in verdiği adlarla (`kategori`, `depo`). */
  dimensions: string[];
  metricKey: string;
  metricLabel: string;
  unit: string;
}

/** Uzun tabloyu (boyut değeri, dönem) genişe çevirir. */
function pivot(
  rows: DimensionRow[],
  periods: string[],
  values: string[],
  metricKey: string,
): ChartRow[] {
  const index = new Map<string, number>();
  for (const row of rows) {
    const v = row[metricKey];
    if (typeof v === "number") index.set(`${row.dimension_value}|${row.donem}`, v);
  }
  return periods.map((donem) => {
    const out: ChartRow = { donem };
    for (const value of values) out[value] = index.get(`${value}|${donem}`) ?? null;
    return out;
  });
}

/**
 * Boyut kırılımı.
 *
 * `dimension_rows` iki boyutu aynı dizide taşıyor (`kategori` ve `depo`) —
 * filtreleme `dimension` alanına göre yapılır, yoksa 36 satır tek grafiğe girer.
 *
 * Renk haritası **filtrelenmemiş** değer evreninden kurulur: bir seriyi
 * gizlemek kalanların rengini değiştirmez.
 */
export function CategoryBreakdownChart({
  rows,
  periods,
  dimensions,
  metricKey,
  metricLabel,
  unit,
}: Props) {
  const [dimension, setDimension] = useState(dimensions[0] ?? "kategori");
  const [hidden, setHidden] = useState<Record<string, Set<string>>>({});

  const scoped = useMemo(
    () => rows.filter((r) => r.dimension === dimension),
    [rows, dimension],
  );

  // Evren: bu boyutun tüm değerleri. Renk buradan atanır, filtreden değil.
  const allValues = useMemo(
    () =>
      Array.from(new Set(scoped.map((r) => r.dimension_value))).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [scoped],
  );

  const colorMap = useMemo(() => buildColorMap(allValues), [allValues]);
  const hiddenHere = hidden[dimension] ?? new Set<string>();
  const visible = allValues.filter((v) => !hiddenHere.has(v));

  const series: SeriesSpec[] = visible.map((value) => ({
    key: value,
    label: value,
    unit,
    color: colorMap.get(value) ?? "var(--ink-muted)",
  }));

  const data = useMemo(
    () => pivot(scoped, periods, visible, metricKey),
    [scoped, periods, visible, metricKey],
  );

  function toggle(value: string) {
    setHidden((prev) => {
      const current = new Set(prev[dimension] ?? []);
      if (current.has(value)) current.delete(value);
      else if (visible.length > 1) current.add(value);
      return { ...prev, [dimension]: current };
    });
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {dimensions.length > 1 ? (
        <div
          className="inline-flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label="Kırılım boyutu"
        >
          {dimensions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDimension(d)}
              aria-pressed={dimension === d}
              className={[
                "rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors",
                dimension === d
                  ? "bg-hover text-ink-1"
                  : "text-ink-muted hover:text-ink-2",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {allValues.map((value) => {
          const on = !hiddenHere.has(value);
          const color = colorMap.get(value) ?? "var(--ink-muted)";
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              aria-pressed={on}
              className={[
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-opacity",
                on
                  ? "border-border text-ink-2"
                  : "border-dashed border-border text-ink-muted opacity-60",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="inline-block h-[3px] w-3 rounded-full"
                style={{ background: on ? color : "var(--axis)" }}
              />
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <LineChartCard
      title={`${metricLabel} — ${dimension} kırılımı`}
      subtitle="Seri gizlemek kalan serilerin rengini değiştirmez; renk varlığı takip eder, sırasını değil."
      data={data}
      xKey="donem"
      xLabel="Dönem"
      series={series}
      unit={unit}
      controls={controls}
      // Aç/kapa düğmeleri renkli işaret + etiket taşıyor; legend'ı onlar veriyor.
      legendInControls
      height={236}
    />
  );
}
