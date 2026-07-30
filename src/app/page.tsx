import { Download } from "lucide-react";
import { DatasetList } from "@/components/domain/DatasetList";
import { UploadDropzone } from "@/components/domain/UploadDropzone";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ErrorState } from "@/components/ui/ErrorState";
import { getDatasets, getPacks } from "@/lib/api";
import type { DatasetSummary, PackOut } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let datasets: DatasetSummary[] = [];
  let packs: PackOut[] = [];
  let error: unknown = null;

  try {
    [datasets, packs] = await Promise.all([getDatasets(), getPacks()]);
  } catch (e) {
    error = e;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          {/* Logo "Sonart"ı söylüyor, yanındaki metin ürün adını tamamlıyor:
              ekran okuyucu "Sonart Insight" duyuyor. */}
          <h1 className="flex items-center gap-3">
            <Logo className="h-9" priority />
            <span className="border-l border-border pl-3 text-[20px] font-semibold tracking-tight text-ink-1">
              Insight
            </span>
          </h1>
          <p className="mt-2.5 text-[13px] text-ink-2">
            ERP stok ve satış raporunu yükleyin; veri kalitesi, dönemsel trend,
            risk sicili ve AI aksiyon önerileri arayüzde açılır.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <UploadDropzone packs={packs} />

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
            <a
              href="/ornek/sonart_erp_bozuk_encoding.csv"
              download
              className="inline-flex items-center gap-1.5 text-ink-2 underline underline-offset-2 hover:text-ink-1"
            >
              <Download size={13} aria-hidden />
              Örnek CSV (bozuk karakter kodlamalı)
            </a>
            {packs.length > 0 ? (
              <span>
                Tanımlı rapor tipleri: {packs.map((p) => p.title).join(" · ")}
              </span>
            ) : null}
          </div>

          <section className="mt-10">
            <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-muted uppercase">
              Yüklenmiş veri setleri
            </h2>
            <DatasetList datasets={datasets} />
          </section>
        </>
      )}
    </div>
  );
}
