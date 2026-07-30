import type { SeriesSpec } from "./types";

/**
 * ≥2 seride legend her zaman var. Tek seride legend kutusu yok — başlık
 * zaten seriyi adlandırıyor.
 *
 * **Metin ink token'ıyla, renk yalnızca işarette.** Metin asla seri rengini
 * giymez.
 */
export function ChartLegend({ series }: { series: readonly SeriesSpec[] }) {
  if (series.length < 2) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5 text-[12px]">
          <span
            aria-hidden
            className="inline-block h-[3px] w-3.5 rounded-full"
            style={{ background: s.color }}
          />
          <span className="text-ink-2">{s.label}</span>
          {s.unit ? (
            <span className="text-ink-muted">({s.unit})</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
