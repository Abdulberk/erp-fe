/**
 * Sayı ve tarih biçimlendirme — tamamı `tr-TR`.
 * Binlik ayracı nokta, ondalık virgül. `null` her yerde "-" olarak görünür,
 * asla `0` değil.
 */

/** Değer yoksa ekrana basılan işaret. */
export const DASH = "—";

const nf = (min: number, max: number) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

const int0 = nf(0, 0);
const dec1 = nf(1, 1);
const dec2 = nf(2, 2);

export type Unit = "TL" | "%" | "adet" | "ay" | "oran" | "sayi" | "" | string;

/**
 * Backend'in verdiği `unit` alanına göre biçimlendirir.
 * Birim bilgisi metnin içine gömülür (`168.696 TL`, `%39,6`, `13,7 ay`).
 */
export function formatValue(value: number | null | undefined, unit: Unit): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;

  switch (unit) {
    case "TL":
      return `${int0.format(Math.round(value))} TL`;
    case "%": {
      // Türkçede yüzde işareti sayıdan önce gelir; eksi işareti onun da önünde.
      const sign = value < 0 ? "-" : "";
      return `${sign}%${dec1.format(Math.abs(value))}`;
    }
    case "adet":
      return int0.format(Math.round(value));
    case "ay":
      return `${dec1.format(value)} ay`;
    case "oran":
      return dec2.format(value);
    case "sayi":
      return int0.format(value);
    default:
      return Number.isInteger(value) ? int0.format(value) : dec2.format(value);
  }
}

/** Grafik eksen tick'leri — birim eki yok, kısa gösterim. */
export function formatAxis(value: number, unit: Unit): string {
  if (!Number.isFinite(value)) return "";
  if (unit === "%") {
    // Dar bir banda yakınlaştırılmış eksende tam sayıya yuvarlamak aynı
    // etiketi iki kez bastırıyor; gerekiyorsa bir ondalık gösteriyoruz.
    return `${value < 0 ? "-" : ""}%${nf(0, 1).format(Math.abs(value))}`;
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${dec1.format(value / 1_000_000)} Mn`;
  if (abs >= 10_000) return `${int0.format(Math.round(value / 1000))} B`;
  return int0.format(Math.round(value));
}

/** Yüzde değişim, işaretiyle: `+%4,2` / `-%2,9`. */
export function formatDeltaPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return DASH;
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  return `${sign}%${dec1.format(Math.abs(pct))}`;
}

/** Mutlak değişim, işaretiyle ve birimiyle. */
export function formatDelta(
  delta: number | null | undefined,
  unit: Unit,
): string {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) return DASH;
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${formatValue(Math.abs(delta), unit)}`;
}

/** Tablo hücresi: birimi kolon başlığında olan sayılar için sade gösterim. */
export function formatCell(value: unknown, unit: Unit): string {
  if (value === null || value === undefined || value === "") return DASH;
  if (typeof value === "boolean") return value ? "evet" : "hayır";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return DASH;
    switch (unit) {
      case "TL":
        return int0.format(Math.round(value));
      case "%":
        return dec1.format(value);
      case "adet":
      case "sayi":
        return int0.format(Math.round(value));
      case "ay":
        return dec2.format(value);
      default:
        return Number.isInteger(value) ? int0.format(value) : dec2.format(value);
    }
  }
  return String(value);
}

/** `"2026-01"` → `"Oca 2026"`. Tanınmayan biçim olduğu gibi döner. */
const MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export function formatPeriod(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const idx = Number(m[2]) - 1;
  const label = MONTHS_SHORT[idx];
  return label ? `${label} ${m[1]}` : period;
}

/** `["2026-01", …, "2026-06"]` → `"Oca 2026 – Haz 2026"`. */
export function formatPeriodRange(periods: readonly string[]): string {
  if (periods.length === 0) return DASH;
  const first = periods[0]!;
  const last = periods[periods.length - 1]!;
  return first === last
    ? formatPeriod(first)
    : `${formatPeriod(first)} – ${formatPeriod(last)}`;
}

const dtf = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return dtf.format(d);
}

/** `0.9831` → `"%98,3"`, `1` → `"%100"`. */
export function formatRatio(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return DASH;
  return `%${nf(0, 1).format(ratio * 100)}`;
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return `$${nf(2, 4).format(value)}`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return DASH;
  const s = ms / 1000;
  if (s < 60) return `${dec1.format(s)} sn`;
  const min = Math.floor(s / 60);
  const rest = Math.round(s % 60);
  return `${min} dk ${rest} sn`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${dec1.format(bytes / 1024)} KB`;
  return `${dec1.format(bytes / (1024 * 1024))} MB`;
}
