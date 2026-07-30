interface Stat {
  label: string;
  value: string;
  hint?: string;
  /** Değerin yanındaki renkli işaret; renk tek başına anlam taşımaz. */
  markColor?: string;
}

/** Sayfa başlarındaki küçük özet sayıları. Grafik değil, tek satır bilgi. */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-surface-1 p-3.5"
        >
          <dt className="text-[12px] text-ink-2">{stat.label}</dt>
          <dd className="mt-1 flex items-baseline gap-1.5">
            {stat.markColor ? (
              <span
                aria-hidden
                className="inline-block h-2 w-2 shrink-0 self-center rounded-full"
                style={{ background: stat.markColor }}
              />
            ) : null}
            <span className="tnum text-[19px] font-semibold text-ink-1">
              {stat.value}
            </span>
          </dd>
          {stat.hint ? (
            <p className="mt-0.5 text-[11px] text-ink-muted">{stat.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
