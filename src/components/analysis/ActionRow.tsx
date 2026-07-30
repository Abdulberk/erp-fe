"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EvidenceList } from "@/components/domain/EvidencePill";
import { PriorityChip } from "@/components/domain/StatusChip";
import { formatValue } from "@/lib/format";
import { horizonLabel, ownerLabel } from "@/lib/tokens";
import type { Action } from "@/lib/types";

/**
 * Tek bir AI aksiyonu.
 *
 * Açıldığında gerekçe ve **kanıtlar** görünür: backend her aksiyona
 * `evidence[]` koymak zorunda, arayüz de onu göstermek zorunda.
 */
export function ActionRow({ action }: { action: Action }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-border bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-hover"
      >
        <ChevronDown
          size={14}
          aria-hidden
          className={[
            "mt-0.5 shrink-0 text-ink-muted transition-transform",
            open ? "rotate-0" : "-rotate-90",
          ].join(" ")}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityChip priority={action.priority} />
            <span className="text-[11px] text-ink-muted">
              {ownerLabel(action.owner)} · {horizonLabel(action.horizon)}
            </span>
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink-1">
            {action.title}
          </p>
        </div>

        {action.expected_impact_tl !== null && action.expected_impact_tl !== undefined ? (
          <div className="shrink-0 text-right">
            <p className="text-[10px] tracking-wide text-ink-muted uppercase">
              Beklenen etki
            </p>
            <p className="tnum text-[12px] font-semibold text-ink-1">
              {formatValue(action.expected_impact_tl, "TL")}
            </p>
          </div>
        ) : null}
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-page px-3 py-3 pl-9">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              Neden şimdi
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-1">
              {action.rationale}
            </p>
          </div>
          <EvidenceList evidence={action.evidence} />
        </div>
      ) : null}
    </li>
  );
}
