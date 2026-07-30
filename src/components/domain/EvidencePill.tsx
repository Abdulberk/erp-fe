import { formatValue } from "@/lib/format";
import type { Evidence, MetricOut } from "@/lib/types";

type AnyEvidence = Evidence | MetricOut;

function hasLabel(e: AnyEvidence): e is MetricOut {
  return typeof (e as MetricOut).label === "string";
}

/**
 * Bir iddianın dayandığı somut sayı.
 *
 * Bu projenin ana iddiası "AI sayı uydurmuyor" — kanıtın arayüzde görünür
 * olması bunun tek ispatı. Etiket varsa backend'in verdiği etiket kullanılır,
 * yoksa metriğin teknik adı gösterilir (kendi sözlüğümüzü yazmıyoruz).
 */
export function EvidencePill({ evidence }: { evidence: AnyEvidence }) {
  const label = hasLabel(evidence) ? evidence.label : evidence.metric;
  const scope = [evidence.entity, evidence.period].filter(Boolean).join(" · ");

  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-page px-2 py-1 text-[11px] whitespace-nowrap">
      <span className="text-ink-muted">{label}</span>
      <span className="tnum font-semibold text-ink-1">
        {formatValue(evidence.value, evidence.unit)}
      </span>
      {scope ? <span className="text-ink-muted">{scope}</span> : null}
    </span>
  );
}

export function EvidenceList({
  evidence,
  label = "Kanıtlar",
}: {
  evidence: readonly AnyEvidence[];
  label?: string;
}) {
  if (evidence.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {evidence.map((e, i) => (
          <li key={`${e.metric}-${e.entity ?? ""}-${e.period ?? ""}-${i}`}>
            <EvidencePill evidence={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}
