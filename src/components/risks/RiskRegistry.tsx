"use client";

import { useMemo, useState } from "react";
import { HBarChartCard } from "@/components/chart/HBarChartCard";
import type { ChartRow } from "@/components/chart/types";
import { RiskRow } from "@/components/domain/RiskRow";
import { StatusChip } from "@/components/domain/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatRow } from "@/components/ui/StatRow";
import { formatPeriod, formatValue } from "@/lib/format";
import { SEVERITY_ORDER, severityRank, severityToken } from "@/lib/tokens";
import type { RiskOut, RisksResponse } from "@/lib/types";

const ALL = "__hepsi__";
/** `first_seen_period === null` olan riskler (trend bazlı) ayrı grupta. */
const NO_PERIOD = "__donemsiz__";

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function Filter({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="flex items-center gap-1.5 text-[12px]">
      <span className="text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-surface-1 px-2 py-1 text-[12px] text-ink-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function categoryOf(risk: RiskOut): string | null {
  const dims = risk.dimensions ?? {};
  return dims.kategori ?? Object.values(dims)[0] ?? null;
}

export function RiskRegistry({ data }: { data: RisksResponse }) {
  const [severity, setSeverity] = useState(ALL);
  const [period, setPeriod] = useState(ALL);
  const [category, setCategory] = useState(ALL);

  const periods = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.risks) if (r.first_seen_period) set.add(r.first_seen_period);
    return Array.from(set).sort();
  }, [data.risks]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.risks) {
      const c = categoryOf(r);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [data.risks]);

  const severities = useMemo(
    () => SEVERITY_ORDER.filter((s) => (data.by_severity[s] ?? 0) > 0),
    [data.by_severity],
  );

  const filtered = useMemo(() => {
    return data.risks
      .filter((r) => severity === ALL || r.severity === severity)
      .filter((r) => {
        if (period === ALL) return true;
        if (period === NO_PERIOD) return r.first_seen_period === null;
        return r.first_seen_period === period;
      })
      .filter((r) => category === ALL || categoryOf(r) === category)
      .sort((a, b) => {
        const bySeverity = severityRank(a.severity) - severityRank(b.severity);
        if (bySeverity !== 0) return bySeverity;
        return (b.financial_impact_tl ?? 0) - (a.financial_impact_tl ?? 0);
      });
  }, [data.risks, severity, period, category]);

  // Yalnızca parasal etkisi hesaplanabilen riskler grafiğe girer, azalan sıralı.
  const chartRows: ChartRow[] = useMemo(
    () =>
      filtered
        .filter((r) => typeof r.financial_impact_tl === "number")
        .sort((a, b) => (b.financial_impact_tl ?? 0) - (a.financial_impact_tl ?? 0))
        .map((r) => ({
          etiket: `${r.entity} · ${r.entity_label}`,
          financial_impact_tl: r.financial_impact_tl,
          severity: r.severity,
          title: r.title,
        })),
    [filtered],
  );

  const shownImpact = filtered.reduce((sum, r) => sum + (r.financial_impact_tl ?? 0), 0);
  const criticalCount = filtered.filter((r) => r.severity === "kritik").length;
  const isFiltered = severity !== ALL || period !== ALL || category !== ALL;

  const severityLegend = (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-ink-muted">Çubuk rengi şiddeti gösterir:</span>
      {severities.map((s) => (
        <StatusChip key={s} token={severityToken(s)} />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <StatRow
        stats={[
          {
            label: isFiltered ? "Gösterilen risk" : "Toplam risk",
            value: formatValue(filtered.length, "sayi"),
            hint: isFiltered ? `${data.total} risk içinden` : `${periods.length} dönemde açıldı`,
          },
          {
            label: "Kritik",
            value: formatValue(criticalCount, "sayi"),
            markColor: "var(--critical)",
            hint: "acil müdahale",
          },
          {
            label: "Parasal etki",
            value: formatValue(shownImpact, "TL"),
            hint: isFiltered
              ? `toplam ${formatValue(data.total_financial_impact_tl, "TL")}`
              : "tahmini toplam",
          },
          {
            label: "Risk tipi",
            value: formatValue(Object.keys(data.by_code).length, "sayi"),
            hint: "farklı kural tetiklendi",
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface-1 px-4 py-3">
        <Filter
          label="Şiddet"
          value={severity}
          onChange={setSeverity}
          options={[
            { value: ALL, label: "Hepsi" },
            ...severities.map((s) => ({
              value: s,
              label: `${severityToken(s).label} (${data.by_severity[s]})`,
            })),
          ]}
        />
        <Filter
          label="İlk görülme"
          value={period}
          onChange={setPeriod}
          options={[
            { value: ALL, label: "Hepsi" },
            ...periods.map((p) => ({ value: p, label: formatPeriod(p) })),
            { value: NO_PERIOD, label: "Dönem atfı yok" },
          ]}
        />
        {categories.length > 0 ? (
          <Filter
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={[
              { value: ALL, label: "Hepsi" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
        ) : null}

        {isFiltered ? (
          <button
            type="button"
            onClick={() => {
              setSeverity(ALL);
              setPeriod(ALL);
              setCategory(ALL);
            }}
            className="ml-auto text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink-1"
          >
            Filtreleri temizle
          </button>
        ) : null}
      </div>

      {chartRows.length > 0 ? (
        <HBarChartCard
          title="Risklerin parasal etkisi"
          subtitle="Yalnızca etkisi hesaplanabilen riskler, azalan sıralı"
          data={chartRows}
          categoryKey="etiket"
          categoryLabel="Ürün"
          valueKey="financial_impact_tl"
          valueLabel="Parasal etki"
          unit="TL"
          colorFor={(row) => severityToken(String(row.severity)).color}
          statusLegend={severityLegend}
          extraColumns={[{ key: "title", label: "Risk", align: "left" }]}
        />
      ) : null}

      <section className="rounded-xl border border-border bg-surface-1">
        <h2 className="px-4 py-3 text-[13px] font-semibold text-ink-1">
          Risk sicili
          <span className="ml-2 font-normal text-ink-muted">
            satıra tıklayınca gerekçe, öneri ve kanıtlar açılır
          </span>
        </h2>

        {filtered.length > 0 ? (
          <ul className="border-t border-border">
            {filtered.map((risk, i) => (
              <RiskRow
                key={`${risk.code}-${risk.entity}`}
                risk={risk}
                // İlk satır açık gelsin: kanıt pill'leri ilk bakışta görünür olsun.
                defaultOpen={i === 0}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            bare
            title="Bu filtrelerle risk yok"
            description="Filtreleri gevşetip tekrar deneyin."
          />
        )}
      </section>
    </div>
  );
}
