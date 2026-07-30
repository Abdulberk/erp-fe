import { healthColor } from "@/lib/tokens";

/**
 * Veri sağlığı puanı. Renk tek başına anlam taşımasın diye puan her zaman
 * rakamla birlikte, `/100` payda göstererek yazılır.
 */
export function HealthBadge({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const color = healthColor(score);
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-[13px]",
      ].join(" ")}
      style={{
        borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
      title={`Veri sağlığı ${score}/100`}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{
          background: color,
          width: size === "sm" ? 7 : 9,
          height: size === "sm" ? 7 : 9,
        }}
      />
      <span className="text-ink-muted">Sağlık</span>
      <span className="tnum font-semibold text-ink-1">{score}</span>
      <span className="tnum text-ink-muted">/100</span>
    </span>
  );
}
