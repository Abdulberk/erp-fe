"use client";

import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HealthBadge } from "@/components/domain/HealthBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteDataset } from "@/lib/api";
import { formatDateTime, formatValue } from "@/lib/format";
import type { DatasetSummary } from "@/lib/types";

export function DatasetList({ datasets }: { datasets: DatasetSummary[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (datasets.length === 0) {
    return (
      <EmptyState
        title="Henüz veri seti yok"
        description="Yukarıdan bir CSV yükleyin; işlendikten sonra dashboard burada listelenir."
      />
    );
  }

  async function remove(id: string) {
    setRemoving(id);
    try {
      await deleteDataset(id);
      router.refresh();
    } finally {
      setRemoving(null);
      setConfirming(null);
    }
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {datasets.map((d) => (
        <li
          key={d.id}
          className="group relative rounded-xl border border-border bg-surface-1 transition-colors hover:bg-hover"
        >
          <Link href={`/d/${d.id}`} className="block p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="truncate text-[14px] font-semibold text-ink-1"
                  title={d.filename}
                >
                  {d.filename}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                  {d.pack_title}
                </p>
              </div>
              <ChevronRight
                size={16}
                aria-hidden
                className="mt-0.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <HealthBadge score={d.health_score} />
              <span className="tnum text-[12px] text-ink-2">
                {formatValue(d.clean_row_count, "sayi")} satır
              </span>
              {d.quarantined_row_count > 0 ? (
                <span className="tnum text-[12px] text-ink-muted">
                  {formatValue(d.quarantined_row_count, "sayi")} karantina
                </span>
              ) : null}
            </div>

            <p className="mt-2.5 text-[11px] text-ink-muted">
              {formatDateTime(d.created_at)} · {d.encoding_detected}
            </p>
          </Link>

          <div className="absolute right-3 bottom-3">
            {confirming === d.id ? (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void remove(d.id)}
                  disabled={removing === d.id}
                  className="inline-flex items-center gap-1 rounded border border-[color-mix(in_srgb,var(--critical)_40%,transparent)] bg-[color-mix(in_srgb,var(--critical)_12%,transparent)] px-2 py-1 text-[11px] font-medium text-ink-1"
                >
                  {removing === d.id ? (
                    <Loader2 size={11} className="animate-spin" aria-hidden />
                  ) : null}
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded border border-border px-2 py-1 text-[11px] text-ink-2"
                >
                  Vazgeç
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(d.id)}
                aria-label={`${d.filename} veri setini sil`}
                className="rounded p-1.5 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-critical"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
