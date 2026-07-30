import { Eye } from "lucide-react";
import { ActionRow } from "@/components/analysis/ActionRow";
import { formatPeriod } from "@/lib/format";
import type { PeriodAnalysis } from "@/lib/types";

/**
 * Bir dönemin analizi.
 *
 * `delta_vs_prev` şemada zorunlu: modeli her dönem için aynı genel metni
 * üretmekten alıkoyup *ne değiştiğini* söylemeye mecbur bırakıyor. Dönemsel
 * farklılaşmanın görünür olduğu yer burası, o yüzden ayrı bir blokta.
 */
export function PeriodCard({ period }: { period: PeriodAnalysis }) {
  return (
    <li className="relative pl-7">
      <span
        aria-hidden
        className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full border-2 border-surface-1 bg-series-1"
      />
      <span
        aria-hidden
        className="absolute top-5 bottom-0 left-[4.5px] w-px bg-border"
      />

      <article className="mb-5 rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="tnum text-[13px] font-semibold text-ink-1">
            {formatPeriod(period.period)}
          </h3>
          {period.dominant_dynamics.map((dyn) => (
            <span
              key={dyn}
              className="rounded-md border border-border bg-page px-1.5 py-0.5 text-[11px] text-ink-2"
            >
              {dyn.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        <p className="mt-2 text-[14px] leading-snug font-medium text-ink-1">
          {period.headline}
        </p>

        <div className="mt-3 rounded-lg border-l-2 border-series-1 bg-page py-2 pr-3 pl-3">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
            Önceki döneme göre
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            {period.delta_vs_prev}
          </p>
        </div>

        {period.actions.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              Bu döneme özgü aksiyonlar
            </p>
            <ul className="space-y-2">
              {period.actions.map((action, i) => (
                <ActionRow key={`${action.title}-${i}`} action={action} />
              ))}
            </ul>
          </div>
        ) : null}

        {period.watch_items && period.watch_items.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              <Eye size={12} aria-hidden />
              İzlenecekler
            </p>
            <ul className="space-y-1">
              {period.watch_items.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-[12px] leading-relaxed text-ink-2"
                >
                  <span aria-hidden className="text-ink-muted">
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
    </li>
  );
}
