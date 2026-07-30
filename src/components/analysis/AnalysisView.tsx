import { AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import { ActionRow } from "@/components/analysis/ActionRow";
import { PeriodCard } from "@/components/analysis/PeriodCard";
import { TelemetryBar } from "@/components/analysis/TelemetryBar";
import { EvidenceList } from "@/components/domain/EvidencePill";
import { formatPeriod } from "@/lib/format";
import type { AnalysisResponse, RiskHighlight } from "@/lib/types";

function HighlightList({
  items,
  title,
  Icon,
  accent,
}: {
  items: RiskHighlight[];
  title: string;
  Icon: typeof ShieldAlert;
  accent: string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-ink-2 uppercase">
        <Icon size={13} style={{ color: accent }} aria-hidden />
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={`${item.entity}-${i}`}
            className="rounded-lg border border-border bg-page p-3"
          >
            <p className="text-[13px] font-medium text-ink-1">
              <span className="font-mono text-[12px] text-ink-muted">
                {item.entity}
              </span>{" "}
              {item.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
              {item.why_it_matters}
            </p>
            <div className="mt-2">
              <EvidenceList evidence={item.evidence} label="Kanıt" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AnalysisView({ analysis }: { analysis: AnalysisResponse }) {
  const summary = analysis.summary;

  return (
    <div className="space-y-5">
      {analysis.failed_periods && analysis.failed_periods.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-border bg-surface-1 p-4"
          style={{ borderLeft: "3px solid var(--serious)" }}
        >
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-1">
            <AlertTriangle size={15} style={{ color: "var(--serious)" }} aria-hidden />
            Bazı dönemler analiz edilemedi
          </p>
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-ink-2">
            {analysis.failed_periods.map((fail, i) => (
              <li key={i} className="font-mono">
                {Object.entries(fail)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[12px] text-ink-muted">
            Kalan dönemler aşağıda sunuluyor.
          </p>
        </div>
      ) : null}

      {summary ? (
        <section className="rounded-xl border border-border bg-surface-1 p-5">
          <h2 className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
            Yönetici özeti
          </h2>
          <p className="mt-2 text-[19px] leading-snug font-semibold tracking-tight text-ink-1">
            {summary.headline}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            {summary.situation}
          </p>

          {/* Altı dönemin hikâyesi — dönemsel farklılaşmanın özeti, öne çıkarılıyor. */}
          <div className="mt-4 rounded-lg border-l-2 border-series-1 bg-page px-4 py-3">
            <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
              Dönemlerin hikâyesi
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-1">
              {summary.period_narrative}
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <HighlightList
              items={summary.top_risks}
              title="En kritik riskler"
              Icon={ShieldAlert}
              accent="var(--critical)"
            />
            <HighlightList
              items={summary.opportunities ?? []}
              title="Fırsatlar"
              Icon={Lightbulb}
              accent="var(--good)"
            />
          </div>

          {summary.strategic_actions.length > 0 ? (
            <div className="mt-5">
              <h3 className="mb-2 text-[12px] font-semibold tracking-wide text-ink-2 uppercase">
                Stratejik aksiyonlar
              </h3>
              <ul className="space-y-2">
                {summary.strategic_actions.map((action, i) => (
                  <ActionRow key={`${action.title}-${i}`} action={action} />
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {analysis.periods.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[13px] font-semibold text-ink-1">
            Dönemsel analiz
            <span className="ml-2 font-normal text-ink-muted">
              {analysis.periods.length} dönem ·{" "}
              {formatPeriod(analysis.periods[0]!.period)} –{" "}
              {formatPeriod(analysis.periods[analysis.periods.length - 1]!.period)}
            </span>
          </h2>
          <ol className="relative">
            {analysis.periods.map((period) => (
              <PeriodCard key={period.period} period={period} />
            ))}
          </ol>
        </section>
      ) : null}

      <TelemetryBar
        model={analysis.model}
        telemetry={analysis.telemetry}
        grounding={analysis.grounding}
        cached={analysis.cached}
        cachedAt={analysis.cached_at}
      />
    </div>
  );
}
