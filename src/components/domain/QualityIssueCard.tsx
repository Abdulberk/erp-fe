import { ActionBadge, SeverityChip } from "@/components/domain/StatusChip";
import { formatValue } from "@/lib/format";
import type { QualityIssueOut } from "@/lib/types";

/**
 * Bir veri kalitesi bulgusu.
 *
 * Kartın can damarı **işlem rozeti**: bulgu "sorunu buldum" demiyor,
 * "sorunu buldum **ve şunu yaptım**" diyor. `samples[]` monospace basılıyor;
 * mojibake onarımı örneği tam olarak burada görünür oluyor.
 */
export function QualityIssueCard({ issue }: { issue: QualityIssueOut }) {
  return (
    <li className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={issue.severity} />
        <ActionBadge action={issue.action} />
        <span className="font-mono text-[11px] text-ink-muted">
          {issue.code}
        </span>
        <span className="ml-auto text-[11px] text-ink-muted">
          <span className="tnum font-semibold text-ink-1">
            {formatValue(issue.affected_rows, "sayi")}
          </span>{" "}
          satır etkilendi
        </span>
      </div>

      <h3 className="mt-2.5 text-[14px] font-semibold text-ink-1">
        {issue.title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
        {issue.detail}
      </p>

      {issue.samples && issue.samples.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
            Örnekler
          </p>
          <div className="scroll-x mt-1.5 rounded-lg border border-border bg-page p-2.5">
            <ul className="min-w-max">
              {issue.samples.map((sample, i) => (
                <li
                  key={i}
                  className="py-0.5 font-mono text-[11px] whitespace-nowrap text-ink-1"
                >
                  {sample}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}
