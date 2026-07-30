"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useId, useState } from "react";
import { ChartLegend } from "./ChartLegend";
import { DataTable } from "./DataTable";
import type { ChartRow, SeriesSpec, TableColumn } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  /** ≥2 seride legend otomatik çıkar; tek seride başlık zaten adlandırıyor. */
  series?: readonly SeriesSpec[];
  /** Her grafiğin tablo karşılığı — kural, opsiyon değil. */
  table: { columns: TableColumn[]; rows: ChartRow[] };
  /** Başlığın altında, grafiğin üstünde tek satır filtre alanı. */
  controls?: React.ReactNode;
  /**
   * Filtre alanı zaten renkli işaret + etiket taşıyorsa (seri aç/kapa
   * düğmeleri) ayrı legend basmaya gerek yok — aynı bilgi iki kere görünmesin.
   */
  legendInControls?: boolean;
  /** Grafik gövdesinin en az yüksekliği; kart esnerse grafik de esner. */
  bodyHeight?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Grafik kartının çerçevesi: başlık, alt başlık, legend, tablo görünümü
 * toggle'ı ve yatay kayan konteyner.
 *
 * Tablo görünümü her grafikte var; erişilebilirlik gereği ve light modda
 * düşük kontrastlı serilerin okunabilir kalmasının şartı.
 */
export function ChartFrame({
  title,
  subtitle,
  series,
  table,
  controls,
  legendInControls = false,
  bodyHeight = 240,
  children,
  className = "",
}: Props) {
  const [asTable, setAsTable] = useState(false);
  const bodyId = useId();

  return (
    <section
      className={[
        "flex flex-col rounded-xl border border-border bg-surface-1 p-4",
        className,
      ].join(" ")}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink-1">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          aria-controls={bodyId}
          title={asTable ? "Grafik görünümü" : "Tablo görünümü"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink-1"
        >
          {asTable ? (
            <BarChart3 size={12} aria-hidden />
          ) : (
            <Table2 size={12} aria-hidden />
          )}
          {asTable ? "Grafik" : "Tablo"}
        </button>
      </div>

      {series && series.length > 1 && !legendInControls ? (
        <div className="mt-1.5 mb-1">
          <ChartLegend series={series} />
        </div>
      ) : null}

      {controls ? <div className="mt-2 mb-1">{controls}</div> : null}

      {/* Grid + min-height: grafik gövdesi kesin bir yükseklik kazanır, böylece
          `ResponsiveContainer height="100%"` çözülür. Kart bir grid satırında
          esnediğinde grafik de esner; tek başınayken min-height taban olur. */}
      <div
        id={bodyId}
        className="mt-2 grid min-w-0 flex-1"
        style={{ minHeight: asTable ? undefined : bodyHeight }}
      >
        {asTable ? (
          <DataTable
            columns={table.columns}
            rows={table.rows}
            caption={`${title} — tablo görünümü`}
          />
        ) : (
          <div className="min-w-0">{children}</div>
        )}
      </div>
    </section>
  );
}
