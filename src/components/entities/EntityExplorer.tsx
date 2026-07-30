"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ComboChartCard } from "@/components/chart/ComboChartCard";
import type { SeriesSpec } from "@/components/chart/types";
import { StatusChip } from "@/components/domain/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASH, formatCell } from "@/lib/format";
import { severityRank, severityToken } from "@/lib/tokens";
import type { ColumnSpec, DataRow, EntitiesResponse, RiskOut } from "@/lib/types";

/** 27 kolon tek ekrana sığmıyor; kimlik + en çok bakılan ölçüler önde. */
const DEFAULT_COLUMN_COUNT = 10;

interface Props {
  entities: EntitiesResponse;
  risks: RiskOut[];
}

type SortDir = "asc" | "desc";

function isNumericColumn(col: ColumnSpec, rows: DataRow[]): boolean {
  if (col.unit) return true;
  return rows.some((r) => typeof r[col.name] === "number");
}

export function EntityExplorer({ entities, risks }: Props) {
  const { entity_key: entityKey, entity_label_key: labelKey, columns, rows } = entities;

  const [sortKey, setSortKey] = useState<string>(entityKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [allColumns, setAllColumns] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  /** Ürün başına en yüksek şiddetli risk — satırda şiddet noktası olarak görünür. */
  const worstRisk = useMemo(() => {
    const map = new Map<string, RiskOut>();
    for (const risk of risks) {
      const current = map.get(risk.entity);
      if (!current || severityRank(risk.severity) < severityRank(current.severity)) {
        map.set(risk.entity, risk);
      }
    }
    return map;
  }, [risks]);

  const riskCountByEntity = useMemo(() => {
    const map = new Map<string, number>();
    for (const risk of risks) map.set(risk.entity, (map.get(risk.entity) ?? 0) + 1);
    return map;
  }, [risks]);

  const visibleColumns = allColumns ? columns : columns.slice(0, DEFAULT_COLUMN_COUNT);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "tr");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const selectedRow = selected
    ? (rows.find((r) => r[entityKey] === selected) ?? null)
    : null;

  const selectedSeries = useMemo(
    () => entities.series_rows.filter((r) => r[entityKey] === selected),
    [entities.series_rows, entityKey, selected],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-ink-1">
            Ürünler
            <span className="ml-2 font-normal text-ink-muted">
              satıra tıklayınca zaman serisi açılır
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setAllColumns((v) => !v)}
            aria-pressed={allColumns}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-ink-2 hover:bg-hover hover:text-ink-1"
          >
            {allColumns
              ? `İlk ${DEFAULT_COLUMN_COUNT} kolon`
              : `Tüm kolonlar (${columns.length})`}
          </button>
        </div>

        <div className="scroll-x border-t border-border">
          <table className="w-full min-w-max border-collapse text-[12px]">
            <caption className="sr-only">
              Ürün bazında özet tablo. Kolon başlığına tıklayarak sıralayın.
            </caption>
            <thead>
              <tr className="border-b border-border bg-page">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-page px-3 py-2 text-left font-medium text-ink-2"
                >
                  Risk
                </th>
                {visibleColumns.map((col) => {
                  const active = sortKey === col.name;
                  const numeric = isNumericColumn(col, rows);
                  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                  return (
                    <th
                      key={col.name}
                      scope="col"
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      className={numeric ? "text-right" : "text-left"}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.name)}
                        className={[
                          "flex w-full items-center gap-1 px-3 py-2 font-medium whitespace-nowrap hover:text-ink-1",
                          numeric ? "justify-end" : "justify-start",
                          active ? "text-ink-1" : "text-ink-2",
                        ].join(" ")}
                      >
                        {col.label}
                        {col.unit ? (
                          <span className="font-normal text-ink-muted">
                            ({col.unit})
                          </span>
                        ) : null}
                        <Icon size={11} aria-hidden className="text-ink-muted" />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const code = String(row[entityKey] ?? "");
                const risk = worstRisk.get(code);
                const count = riskCountByEntity.get(code) ?? 0;
                const isSelected = code === selected;
                return (
                  <tr
                    key={code}
                    onClick={() => setSelected(isSelected ? null : code)}
                    aria-selected={isSelected}
                    className={[
                      "cursor-pointer border-b border-border last:border-b-0",
                      isSelected ? "bg-hover" : "hover:bg-hover",
                    ].join(" ")}
                  >
                    <td
                      className={[
                        "sticky left-0 z-10 px-3 py-1.5",
                        isSelected ? "bg-surface-1" : "bg-surface-1",
                      ].join(" ")}
                    >
                      {risk ? (
                        <span
                          className="flex items-center gap-1.5"
                          title={`${severityToken(risk.severity).label} · ${count} risk`}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: severityToken(risk.severity).color }}
                          />
                          <span className="tnum text-[11px] text-ink-2">
                            {count}
                          </span>
                          <span className="sr-only">
                            {severityToken(risk.severity).label}, {count} risk
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">{DASH}</span>
                      )}
                    </td>

                    {visibleColumns.map((col) => {
                      const numeric = isNumericColumn(col, rows);
                      return (
                        <td
                          key={col.name}
                          className={[
                            "px-3 py-1.5 whitespace-nowrap",
                            numeric
                              ? "tnum text-right text-ink-1"
                              : "text-left text-ink-2",
                            col.name === labelKey ? "font-medium text-ink-1" : "",
                          ].join(" ")}
                        >
                          {formatCell(row[col.name], col.unit)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow ? (
        <EntityDetail
          code={String(selectedRow[entityKey] ?? "")}
          label={String(selectedRow[labelKey] ?? "")}
          rows={selectedSeries}
          risks={risks.filter((r) => r.entity === selectedRow[entityKey])}
          onClose={() => setSelected(null)}
        />
      ) : (
        <EmptyState
          title="Zaman serisi için bir ürün seçin"
          description="Tablodaki bir satıra tıklayın; o ürünün dönem dönem stok seviyesi ve çıkış hacmi burada açılır."
        />
      )}
    </div>
  );
}

function EntityDetail({
  code,
  label,
  rows,
  risks,
  onClose,
}: {
  code: string;
  label: string;
  rows: DataRow[];
  risks: RiskOut[];
  onClose: () => void;
}) {
  // Stok (seviye) ve çıkış (hacim) aynı birimde — ortak eksen meşru.
  const stock: SeriesSpec = {
    key: "donem_sonu_stok",
    label: "Dönem sonu stok",
    unit: "adet",
    color: "var(--series-1)",
    imputedKey: "donem_sonu_stok__imputed",
  };
  const outflow: SeriesSpec = {
    key: "cikis_miktar",
    label: "Çıkış",
    unit: "adet",
    color: "var(--series-2)",
    imputedKey: "cikis_miktar__imputed",
  };

  const hasImputed = rows.some(
    (r) => r.donem_sonu_stok__imputed === true || r.cikis_miktar__imputed === true,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[14px] font-semibold text-ink-1">
          <span className="font-mono">{code}</span> {label}
        </h2>
        {/* Aynı şiddette birden fazla risk olabiliyor; kod olmadan rozetler
            tekrar ediyormuş gibi görünüyor. */}
        {risks.map((r) => (
          <StatusChip
            key={r.code}
            token={{ ...severityToken(r.severity), label: `${severityToken(r.severity).label} · ${r.code}` }}
          />
        ))}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-ink-2 hover:bg-hover"
        >
          <X size={12} aria-hidden />
          Kapat
        </button>
      </div>

      <ComboChartCard
        title="Stok seviyesi ve çıkış hacmi"
        subtitle={
          hasImputed
            ? "İçi boş kesikli işaretçiler backend'in türettiği değerleri gösterir."
            : "Her iki seri de adet cinsinden — ortak eksen meşru."
        }
        data={rows}
        xKey="donem"
        xLabel="Dönem"
        lineSeries={stock}
        barSeries={outflow}
        unit="adet"
      />
    </div>
  );
}
