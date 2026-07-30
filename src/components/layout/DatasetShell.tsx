import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { HealthBadge } from "@/components/domain/HealthBadge";
import { Logo } from "@/components/layout/Logo";
import { NavTabs, type Tab } from "@/components/layout/NavTabs";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { reportPdfUrl } from "@/lib/api";
import { formatPeriodRange, formatValue } from "@/lib/format";
import type { DatasetSummary } from "@/lib/types";

interface Props {
  dataset: DatasetSummary;
  periods: string[];
  /** AI anahtarı yoksa AI sekmeleri kapalı; uygulamanın geri kalanı tam çalışır. */
  aiConfigured: boolean;
  children: React.ReactNode;
}

export function buildTabs(id: string, aiConfigured: boolean): Tab[] {
  const reason = aiConfigured
    ? undefined
    : "AI anahtarı tanımlı değil — bu bölüm kapalı.";
  return [
    { href: `/d/${id}`, label: "Dashboard" },
    { href: `/d/${id}/kalite`, label: "Veri kalitesi" },
    { href: `/d/${id}/riskler`, label: "Riskler" },
    { href: `/d/${id}/urunler`, label: "Ürünler" },
    {
      href: `/d/${id}/analiz`,
      label: "AI analizi",
      disabled: !aiConfigured,
      disabledReason: reason,
    },
    {
      href: `/d/${id}/sor`,
      label: "Soru-cevap",
      disabled: !aiConfigured,
      disabledReason: reason,
    },
  ];
}

/** `/d/[id]` altındaki tüm sayfaların ortak kabuğu. */
export function DatasetShell({ dataset, periods, aiConfigured, children }: Props) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-page/92 backdrop-blur-sm">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            {/* Tek bağlantı: hem marka işareti hem listeye dönüş. İki ayrı
                bağlantı aynı hedefe gitseydi sekme sırası gereksiz uzardı. */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 text-[13px] text-ink-muted hover:text-ink-1"
            >
              <Logo className="h-6" alt="Sonart Insight" />
              <span className="flex items-center gap-1 border-l border-border pl-2.5">
                <ArrowLeft size={13} aria-hidden />
                Veri setleri
              </span>
            </Link>

            <div className="min-w-0 flex-1">
              <h1
                className="truncate text-[15px] font-semibold text-ink-1"
                title={dataset.filename}
              >
                {dataset.filename}
              </h1>
              <p className="truncate text-[12px] text-ink-muted">
                {dataset.pack_title} · {formatPeriodRange(periods)} ·{" "}
                <span className="tnum">
                  {formatValue(dataset.clean_row_count, "sayi")}
                </span>{" "}
                satır
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HealthBadge score={dataset.health_score} />
              <a
                href={reportPdfUrl(dataset.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-[12px] font-medium text-ink-1 transition-colors hover:bg-hover"
              >
                <FileDown size={14} aria-hidden />
                PDF
              </a>
              <ThemeToggle />
            </div>
          </div>

          <NavTabs tabs={buildTabs(dataset.id, aiConfigured)} />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
