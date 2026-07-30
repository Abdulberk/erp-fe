import { QualityIssueCard } from "@/components/domain/QualityIssueCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatRow } from "@/components/ui/StatRow";
import { getQuality } from "@/lib/api";
import { formatValue } from "@/lib/format";
import { healthColor, severityRank } from "@/lib/tokens";
import type { QualityReportOut } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Veri kalitesi" };

export default async function QualityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let quality: QualityReportOut;
  try {
    quality = await getQuality(id);
  } catch (error) {
    return <ErrorState error={error} backHref="/" />;
  }

  // Backend zaten şiddete göre sıralı gönderiyor; kaynak değişirse diye sabitliyoruz.
  const issues = [...quality.issues].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );

  const dropped = quality.raw_row_count - quality.clean_row_count;

  return (
    <div className="space-y-5">
      <section>
        <h2 className="sr-only">Veri kalitesi özeti</h2>
        <StatRow
          stats={[
            {
              label: "Veri sağlığı",
              value: `${quality.health_score} / 100`,
              markColor: healthColor(quality.health_score),
              hint: `${issues.length} bulgu tespit edildi`,
            },
            {
              label: "Ham satır",
              value: formatValue(quality.raw_row_count, "sayi"),
              hint: dropped > 0 ? `${formatValue(dropped, "sayi")} satır elendi` : "eksiksiz",
            },
            {
              label: "İşlenen satır",
              value: formatValue(quality.clean_row_count, "sayi"),
              hint: "analize giren",
            },
            {
              label: "Karantina",
              value: formatValue(quality.quarantined_row_count, "sayi"),
              hint: "kural dışı bırakılan",
            },
          ]}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface-1 p-4">
        <h2 className="text-[12px] font-medium tracking-wide text-ink-muted uppercase">
          Tespit edilen kodlama
        </h2>
        <p className="mt-1 font-mono text-[13px] text-ink-1">
          {quality.encoding_detected}
        </p>
        <p className="mt-1 text-[12px] text-ink-2">
          {quality.encoding_repaired
            ? "Dosya bozuk karakter kodlamasıyla geldi ve okunurken onarıldı — aşağıdaki örneklerde onarım öncesi/sonrası görünüyor."
            : "Karakter kodlamasında onarım gerekmedi."}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold text-ink-1">
          Bulgular
          <span className="ml-2 font-normal text-ink-muted">
            her bulgu ne yapıldığıyla birlikte
          </span>
        </h2>

        {issues.length > 0 ? (
          <ul className="space-y-3">
            {issues.map((issue) => (
              <QualityIssueCard key={issue.code} issue={issue} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Bulgu yok"
            description="Dosya tanımlı kalite kurallarının tamamından temiz geçti."
          />
        )}
      </section>
    </div>
  );
}
