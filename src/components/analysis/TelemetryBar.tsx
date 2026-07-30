import { GroundingBadge } from "@/components/analysis/GroundingBadge";
import { formatDateTime, formatDuration, formatUsd, formatValue } from "@/lib/format";
import type { GroundingOut, TelemetryOut } from "@/lib/types";

interface Props {
  model: string;
  telemetry: TelemetryOut;
  grounding: GroundingOut;
  cached: boolean;
  cachedAt: string | null | undefined;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="tnum mt-0.5 text-[12px] font-medium text-ink-1">{value}</dd>
    </div>
  );
}

/** Üretimin maliyeti ve güvenilirliği — küçük ama gizlenmeyen bir satır. */
export function TelemetryBar({ model, telemetry, grounding, cached, cachedAt }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <GroundingBadge grounding={grounding} />
        <span className="rounded-md border border-border px-2 py-1 text-[11px] text-ink-2">
          {cached
            ? `Önbellekten geldi${cachedAt ? ` · ${formatDateTime(cachedAt)}` : ""} — yeni AI çağrısı yapılmadı`
            : "Bu koşuda üretildi"}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <Item label="Model" value={model} />
        <Item label="Çağrı" value={formatValue(telemetry.call_count ?? 0, "sayi")} />
        <Item
          label="Önbellek isabeti"
          value={`${formatValue(telemetry.cache_hit_calls ?? 0, "sayi")} çağrı`}
        />
        <Item
          label="Token (giriş/çıkış)"
          value={`${formatValue(telemetry.input_tokens ?? 0, "sayi")} / ${formatValue(
            telemetry.output_tokens ?? 0,
            "sayi",
          )}`}
        />
        <Item label="Maliyet" value={formatUsd(telemetry.total_cost_usd)} />
        <Item label="Süre" value={formatDuration(telemetry.duration_ms)} />
      </dl>
    </section>
  );
}
