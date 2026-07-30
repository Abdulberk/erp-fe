import type { StatusToken } from "@/lib/tokens";
import {
  confidenceToken,
  priorityToken,
  qualityActionToken,
  severityToken,
} from "@/lib/tokens";

interface ChipProps {
  token: StatusToken;
  /** Etiketi gizleyip yalnızca ikon göstermek yasak — renk tek başına anlam taşımaz. */
  prefix?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Durum rozeti. **Renk ikonda, metin ink token'ında** — renk tek başına
 * bilgi taşımaz, her zaman ikon + etiketle birlikte gelir.
 */
export function StatusChip({ token, prefix, size = "sm", className = "" }: ChipProps) {
  const { color, label, Icon } = token;
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[12px]",
        "text-ink-1",
        className,
      ].join(" ")}
      style={{
        borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <Icon size={size === "sm" ? 12 : 14} style={{ color }} aria-hidden />
      {prefix ? <span className="text-ink-muted">{prefix}</span> : null}
      {label}
    </span>
  );
}

export function SeverityChip({
  severity,
  size,
}: {
  severity: string;
  size?: "sm" | "md";
}) {
  return <StatusChip token={severityToken(severity)} size={size} />;
}

export function PriorityChip({
  priority,
  size,
}: {
  priority: string;
  size?: "sm" | "md";
}) {
  return <StatusChip token={priorityToken(priority)} size={size} />;
}

/**
 * Veri kalitesi bulgusunda ne yapıldığı. Bu rozet "sorunu buldum" değil
 * "sorunu buldum **ve şunu yaptım**" mesajını veriyor.
 */
export function ActionBadge({ action, size }: { action: string; size?: "sm" | "md" }) {
  return <StatusChip token={qualityActionToken(action)} size={size} />;
}

export function ConfidenceBadge({
  confidence,
  size,
}: {
  confidence: string;
  size?: "sm" | "md";
}) {
  return <StatusChip token={confidenceToken(confidence)} size={size} />;
}
