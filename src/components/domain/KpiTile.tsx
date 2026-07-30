import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatDeltaPct, formatPeriod, formatValue } from "@/lib/format";
import { deltaIsGood } from "@/lib/tokens";
import type { MetricOut } from "@/lib/types";

interface Props {
  metric: MetricOut;
  /** Bir önceki döneme göre değişim. İlk dönemde `null` — ok gösterilmez. */
  delta: number | null;
  deltaPct: number | null;
}

const TONE_COLOR = {
  iyi: "var(--delta-up)",
  kotu: "var(--critical)",
  notr: "var(--ink-muted)",
} as const;

/**
 * Beş başlık metriği için stat tile. Grafik değil — tek bir sayının
 * okunması için en hızlı form.
 *
 * Okun yönü ve rengi metriğe göre değişir, sabit kodlanmaz: "stoğu tükenen
 * ürün" artarsa kötü, ciro artarsa iyi.
 */
export function KpiTile({ metric, delta, deltaPct }: Props) {
  const hasDelta = delta !== null && Number.isFinite(delta);
  const tone = hasDelta ? deltaIsGood(metric.metric, delta) : "notr";
  const Arrow = !hasDelta || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <p className="truncate text-[12px] text-ink-2" title={metric.label}>
        {metric.label}
      </p>

      <p className="tnum mt-1.5 text-[24px] leading-none font-semibold tracking-tight text-ink-1">
        {formatValue(metric.value, metric.unit)}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        {hasDelta ? (
          <>
            <Arrow size={13} style={{ color: TONE_COLOR[tone] }} aria-hidden />
            <span className="tnum font-medium" style={{ color: TONE_COLOR[tone] }}>
              {formatDeltaPct(deltaPct)}
            </span>
            <span className="text-ink-muted">önceki döneme göre</span>
          </>
        ) : (
          <span className="text-ink-muted">
            {metric.period
              ? `${formatPeriod(metric.period)} · karşılaştırma yok`
              : "karşılaştırma yok"}
          </span>
        )}
      </div>
    </div>
  );
}
