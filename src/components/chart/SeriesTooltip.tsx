"use client";

import { formatValue } from "@/lib/format";
import type { ChartRow, SeriesSpec } from "./types";

/** Recharts'ın `content` bileşenine geçirdiği payload — dar bir yüzey. */
export interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  color?: string;
  payload?: ChartRow;
}

export interface SeriesTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  /** Seriler; renk ve birim buradan okunur. */
  series: readonly SeriesSpec[];
  /** Dönem başlığını biçimlendirir. */
  labelFormatter?: (label: string) => string;
  /** Satıra özgü not — örn. türetilmiş değer uyarısı. */
  note?: (row: ChartRow) => string | null;
}

/**
 * Crosshair'in tek tooltip'i: dönem başlığı, her seri için renkli nokta +
 * etiket + değer.
 *
 * **Metin ink rengiyle, nokta seri rengiyle.** Değer metni asla seri rengini
 * giymez.
 */
export function SeriesTooltip({
  active,
  payload,
  label,
  series,
  labelFormatter,
  note,
}: SeriesTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;
  const extra = row && note ? note(row) : null;
  const title = typeof label === "string" ? (labelFormatter?.(label) ?? label) : label;

  return (
    <div className="pointer-events-none min-w-[168px] rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-lg">
      {title !== undefined && title !== "" ? (
        <p className="mb-1.5 text-[11px] font-semibold text-ink-1">{title}</p>
      ) : null}

      <ul className="space-y-1">
        {payload.map((item, i) => {
          const spec = series.find((s) => s.key === item.dataKey);
          if (!spec) return null;
          const value =
            typeof item.value === "number"
              ? formatValue(item.value, spec.unit)
              : formatValue(null, spec.unit);
          return (
            <li
              key={`${String(item.dataKey)}-${i}`}
              className="flex items-baseline justify-between gap-4 text-[11px]"
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: spec.color }}
                />
                <span className="text-ink-2">{spec.label}</span>
              </span>
              <span className="tnum font-semibold text-ink-1">{value}</span>
            </li>
          );
        })}
      </ul>

      {extra ? (
        <p className="mt-1.5 border-t border-border pt-1.5 text-[10px] text-ink-muted">
          {extra}
        </p>
      ) : null}
    </div>
  );
}
