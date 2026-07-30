import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { formatRatio, formatValue } from "@/lib/format";
import type { GroundingOut } from "@/lib/types";

/**
 * Kanıt doğrulama oranı.
 *
 * Bu projenin ana iddiası "AI sayı uydurmuyor": modelin ürettiği her kanıt,
 * hesaplanmış tablodaki değerle karşılaştırılıyor. Oran o karşılaştırmanın
 * sonucu — arayüzde görünmezse iddia ispatsız kalır.
 */
export function GroundingBadge({
  grounding,
  size = "md",
}: {
  grounding: GroundingOut;
  size?: "sm" | "md";
}) {
  const ratio = grounding.grounding_ratio;
  const { color, Icon } =
    ratio >= 0.95
      ? { color: "var(--good)", Icon: ShieldCheck }
      : ratio >= 0.8
        ? { color: "var(--warning)", Icon: ShieldQuestion }
        : { color: "var(--critical)", Icon: ShieldAlert };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
      ].join(" ")}
      style={{
        borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
      title={`${grounding.verified_evidence} / ${grounding.total_evidence} kanıt hesaplanmış veriyle doğrulandı`}
    >
      <Icon size={size === "sm" ? 12 : 14} style={{ color }} aria-hidden />
      <span className="text-ink-muted">Kanıt doğrulama</span>
      <span className="tnum font-semibold text-ink-1">
        {formatRatio(ratio)}
      </span>
      <span className="tnum text-ink-muted">
        ({formatValue(grounding.verified_evidence, "sayi")}/
        {formatValue(grounding.total_evidence, "sayi")})
      </span>
    </span>
  );
}
