"use client";

import { formatPeriod } from "@/lib/format";
import type { ChartRow, SeriesSpec, TableColumn } from "./types";

/**
 * Grafiğin tablo karşılığını serilerden üretir. Etiketler ve birimler
 * serilerin taşıdığı backend değerleridir — burada yeniden yazılmaz.
 */
export function buildTable(
  data: ChartRow[],
  xKey: string,
  xLabel: string,
  series: readonly SeriesSpec[],
): { columns: TableColumn[]; rows: ChartRow[] } {
  const columns: TableColumn[] = [
    { key: xKey, label: xLabel, align: "left" },
    ...series.map((s) => ({ key: s.key, label: s.label, unit: s.unit })),
  ];

  // Dönem anahtarı `2026-01` biçiminde geliyor; tabloda da okunur olsun.
  const rows = data.map((row) => {
    const raw = row[xKey];
    return typeof raw === "string" ? { ...row, [xKey]: formatPeriod(raw) } : row;
  });

  return { columns, rows };
}

/** Doğrudan etiketlerin sığması için gereken sağ boşluk. */
export function directLabelMargin(series: readonly SeriesSpec[]): number {
  const longest = series.reduce((max, s) => Math.max(max, s.label.length), 0);
  return Math.min(140, 22 + longest * 6.4);
}

interface LabelProps {
  x?: number | string;
  y?: number | string;
  index?: number;
  value?: number | string;
  spec: SeriesSpec;
  lastIndex: number;
}

/**
 * Serinin son noktasına doğrudan etiket.
 *
 * **Metin ink token'ıyla, kimliği yanındaki renkli nokta taşır.** Light modda
 * aqua ve sarı serilerin yüzeye karşı 3:1 altında kalması bu etiketi zorunlu
 * kılıyor — renk tek başına seriyi ayırt etmeye yetmez.
 */
export function LastPointLabel({ x, y, index, spec, lastIndex }: LabelProps) {
  if (index !== lastIndex) return null;
  const cx = typeof x === "number" ? x : Number(x);
  const cy = typeof y === "number" ? y : Number(y);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  return (
    <g>
      <circle cx={cx + 7} cy={cy} r={2.5} fill={spec.color} />
      <text
        x={cx + 13}
        y={cy}
        dy={3.5}
        fill="var(--ink-2)"
        fontSize={11}
        fontWeight={500}
      >
        {spec.label}
      </text>
    </g>
  );
}

/**
 * Türetilmiş değer notu. Backend `*__imputed` alanıyla hangi ölçümü kendisi
 * hesapladığını söylüyor; bunu tooltip'te görünür kılmak veri kalitesi
 * iddiasının parçası.
 */
export function imputedNote(
  series: readonly SeriesSpec[],
): ((row: ChartRow) => string | null) | undefined {
  const withFlag = series.filter((s) => s.imputedKey);
  if (withFlag.length === 0) return undefined;

  return (row) => {
    const derived = withFlag
      .filter((s) => row[s.imputedKey!] === true)
      .map((s) => s.label);
    if (derived.length === 0) return null;
    return `Türetilmiş değer: ${derived.join(", ")}`;
  };
}

/** Türetilmiş noktalar içi boş işaretçiyle çizilir. */
interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
  spec: SeriesSpec;
}

export function ImputedAwareDot({ cx, cy, payload, spec }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const value = payload[spec.key];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const derived = spec.imputedKey ? payload[spec.imputedKey] === true : false;
  if (!derived) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--surface-1)"
      stroke={spec.color}
      strokeWidth={2}
      strokeDasharray="2 1.5"
    />
  );
}
