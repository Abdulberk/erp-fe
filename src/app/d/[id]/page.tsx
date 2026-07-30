import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AreaChartCard } from "@/components/chart/AreaChartCard";
import { LineChartCard } from "@/components/chart/LineChartCard";
import type { SeriesSpec } from "@/components/chart/types";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { KpiTile } from "@/components/domain/KpiTile";
import { RiskRow } from "@/components/domain/RiskRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getOverview, getPeriods } from "@/lib/api";
import { num } from "@/lib/types";
import type { OverviewResponse, PeriodsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let overview: OverviewResponse;
  let periods: PeriodsResponse;
  try {
    [overview, periods] = await Promise.all([getOverview(id), getPeriods(id)]);
  } catch (error) {
    return <ErrorState error={error} backHref="/" />;
  }

  const rows = overview.period_rows;
  const last = rows[rows.length - 1];

  // Aynı birimi paylaşan iki seri aynı eksende meşru: ikisi de TL.
  const revenueSeries: SeriesSpec[] = [
    {
      key: "toplam_ciro_tl",
      label: metricLabel(overview, "toplam_ciro_tl"),
      unit: "TL",
      color: "var(--series-1)",
    },
    {
      key: "toplam_brut_kar_tl",
      label: metricLabel(overview, "toplam_brut_kar_tl"),
      unit: "TL",
      color: "var(--series-2)",
    },
  ];

  const marginSeries: SeriesSpec = {
    key: "ortalama_marj_yuzde",
    label: metricLabel(overview, "ortalama_marj_yuzde"),
    unit: "%",
    color: "var(--series-1)",
  };

  const stockSeries: SeriesSpec = {
    key: "toplam_stok_degeri_tl",
    label: metricLabel(overview, "toplam_stok_degeri_tl"),
    unit: "TL",
    color: "var(--series-1)",
  };

  const topRisks = overview.top_risks.slice(0, 5);
  const dimensionNames = Array.from(
    new Set(periods.dimension_rows.map((r) => r.dimension)),
  );

  return (
    <div className="space-y-4">
      <section aria-label="Başlık metrikleri">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {overview.headline_metrics.map((metric) => (
            <li key={metric.metric}>
              <KpiTile
                metric={metric}
                delta={num(last, `${metric.metric}_delta`)}
                deltaPct={num(last, `${metric.metric}_delta_pct`)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Ciro (TL) ve marj (%) farklı ölçekler — asla aynı grafikte iki
          y ekseniyle gösterilmez. İki ayrı grafik, ortak x ekseni, yan yana. */}
      <div className="grid gap-4 xl:grid-cols-2">
        <LineChartCard
          title="Ciro ve Brüt Kâr"
          subtitle="Aynı birim (TL), ortak eksen"
          data={rows}
          xKey="donem"
          xLabel="Dönem"
          series={revenueSeries}
          unit="TL"
        />

        <LineChartCard
          title={marginSeries.label}
          subtitle="Ayrı grafik — yüzde ve TL aynı eksene girmez. Eksen veri aralığına yakınlaştırıldı."
          data={rows}
          xKey="donem"
          xLabel="Dönem"
          series={[marginSeries]}
          unit="%"
          // Marj dar bir bantta geziniyor; sıfır tabanlı eksen hareketi siliyor.
          yDomain={["dataMin - 1", "dataMax + 1"]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AreaChartCard
          title={stockSeries.label}
          subtitle="Depoda bekleyen sermayenin dönemsel seyri"
          data={rows}
          xKey="donem"
          xLabel="Dönem"
          series={stockSeries}
        />

        {periods.dimension_rows.length > 0 ? (
          <CategoryBreakdownChart
            rows={periods.dimension_rows}
            periods={periods.periods}
            dimensions={dimensionNames}
            metricKey="toplam_ciro_tl"
            metricLabel={metricLabel(overview, "toplam_ciro_tl")}
            unit="TL"
          />
        ) : null}
      </div>

      <section className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-ink-1">
            En kritik riskler
          </h2>
          <Link
            href={`/d/${id}/riskler`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-2 hover:text-ink-1"
          >
            Tüm risk sicili
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>

        {topRisks.length > 0 ? (
          <ul className="border-t border-border">
            {topRisks.map((risk) => (
              <RiskRow key={`${risk.code}-${risk.entity}`} risk={risk} />
            ))}
          </ul>
        ) : (
          <EmptyState
            bare
            title="Risk bulunamadı"
            description="Tanımlı kurallar bu veri setinde bir bulgu üretmedi."
          />
        )}
      </section>
    </div>
  );
}

/**
 * Metriğin ekran adını backend'in verdiği `label` alanından okur.
 * Kendi etiket sözlüğümüzü yazmıyoruz — metin tek kaynaktan, pack'ten geliyor.
 */
function metricLabel(overview: OverviewResponse, metric: string): string {
  return overview.headline_metrics.find((m) => m.metric === metric)?.label ?? metric;
}
