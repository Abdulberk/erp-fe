"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EvidenceList } from "@/components/domain/EvidencePill";
import { SeverityChip } from "@/components/domain/StatusChip";
import { DASH, formatPeriod, formatValue } from "@/lib/format";
import type { RiskOut } from "@/lib/types";

interface Props {
  risk: RiskOut;
  defaultOpen?: boolean;
}

/**
 * Risk sicilinin bir satırı. Kapalıyken tarama için, açıkken karar için:
 * gerekçe, öneri ve **kanıt pill'leri**.
 */
export function RiskRow({ risk, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const dimensions = Object.values(risk.dimensions ?? {}).filter(Boolean);

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-hover"
      >
        <ChevronDown
          size={15}
          aria-hidden
          className={[
            "mt-0.5 shrink-0 text-ink-muted transition-transform",
            open ? "rotate-0" : "-rotate-90",
          ].join(" ")}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <SeverityChip severity={risk.severity} />
            <span className="font-mono text-[11px] text-ink-muted">
              {risk.code}
            </span>
            <span className="text-[13px] font-semibold text-ink-1">
              {risk.entity}
            </span>
            <span className="truncate text-[13px] text-ink-2">
              {risk.entity_label}
            </span>
          </div>

          <p className="mt-1 text-[13px] text-ink-1">{risk.title}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
            {dimensions.length > 0 ? <span>{dimensions.join(" · ")}</span> : null}
            <span>
              İlk görülme:{" "}
              <span className="tnum">
                {risk.first_seen_period ? formatPeriod(risk.first_seen_period) : DASH}
              </span>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[10px] tracking-wide text-ink-muted uppercase">
            Parasal etki
          </p>
          <p className="tnum text-[13px] font-semibold text-ink-1">
            {formatValue(risk.financial_impact_tl ?? null, "TL")}
          </p>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-page px-4 py-4 pl-12">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              Ne oluyor
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-1">
              {risk.narrative}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              Öneri
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-1">
              {risk.recommendation}
            </p>
          </div>

          <EvidenceList evidence={risk.evidence ?? []} />
        </div>
      ) : null}
    </li>
  );
}
