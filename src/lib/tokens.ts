/**
 * Renk ve durum eşlemeleri — PLAN.md bölüm 6.
 *
 * Değişmez kurallar:
 *  - Kategorik renkler sabit sırayla atanır, asla döngüsel değil. Bir filtre
 *    seri sayısını değiştirdiğinde kalan serilerin rengi değişmez.
 *  - Durum renkleri yalnızca risk şiddeti için; asla "seri 5" rengi değil.
 *  - Durum her zaman ikon + etiketle birlikte; renk tek başına anlam taşımaz.
 */
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Ban,
  CircleDot,
  Flag,
  Info,
  Sparkles,
  Trash2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Confidence, Priority, QualityAction, Severity } from "./types";

/** Kategorik palet — sıra sabit, slot bir kez atanınca değişmez. */
export const SERIES_SLOTS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
] as const;

/** 5. ve sonrası için: seri rengi harcanmaz, "Diğer" olarak toplanır. */
export const OTHER_COLOR = "var(--ink-muted)";
export const OTHER_LABEL = "Diğer";

/**
 * Sonart ERP kategorileri için sabit eşleme. Bu veri setinde renk-anlam
 * ilişkisi ekran görüntüleri arasında da tutarlı kalsın diye çakılı.
 */
export const CATEGORY_COLOR: Record<string, string> = {
  Giyimlik: "var(--series-1)",
  Döşemelik: "var(--series-2)",
  Ayakkabılık: "var(--series-3)",
  Çantalık: "var(--series-4)",
};

/**
 * Bir boyutun *tüm* değerlerinden kalıcı bir renk haritası kurar.
 *
 * Haritayı her zaman filtrelenmemiş evrenle kurun; filtrelenmiş listeyle
 * kurarsanız seri sayısı değiştiğinde renkler kayar — kural ihlali.
 *
 * Bilinen kategoriler çakılı slotunu alır. Bilinmeyenler kalan slotlara
 * alfabetik sırayla yerleşir. Slotlar bittiğinde kalanlar "Diğer".
 */
export function buildColorMap(allValues: readonly string[]): Map<string, string> {
  const unique = Array.from(new Set(allValues));
  const map = new Map<string, string>();
  const used = new Set<string>();

  for (const value of unique) {
    const fixed = CATEGORY_COLOR[value];
    if (fixed && !used.has(fixed)) {
      map.set(value, fixed);
      used.add(fixed);
    }
  }

  const free = SERIES_SLOTS.filter((slot) => !used.has(slot));
  let cursor = 0;
  for (const value of unique.filter((v) => !map.has(v)).sort((a, b) => a.localeCompare(b, "tr"))) {
    const slot = free[cursor];
    if (slot) {
      map.set(value, slot);
      cursor += 1;
    } else {
      map.set(value, OTHER_COLOR);
    }
  }

  return map;
}

/** Renk haritasında slot bulamamış değerler tek bir "Diğer" serisine katlanır. */
export function isOther(color: string): boolean {
  return color === OTHER_COLOR;
}

export interface StatusToken {
  color: string;
  label: string;
  Icon: LucideIcon;
}

/** Risk şiddeti. `bilgi` durum rengi harcamaz, ink-muted kullanır. */
export const SEVERITY: Record<Severity, StatusToken> = {
  kritik: { color: "var(--critical)", label: "Kritik", Icon: AlertOctagon },
  yuksek: { color: "var(--serious)", label: "Yüksek", Icon: AlertTriangle },
  orta: { color: "var(--warning)", label: "Orta", Icon: AlertCircle },
  dusuk: { color: "var(--good)", label: "Düşük", Icon: Info },
  bilgi: { color: "var(--ink-muted)", label: "Bilgi", Icon: Info },
};

export const SEVERITY_ORDER: Severity[] = [
  "kritik",
  "yuksek",
  "orta",
  "dusuk",
  "bilgi",
];

export function severityToken(severity: string): StatusToken {
  return SEVERITY[severity as Severity] ?? SEVERITY.bilgi;
}

export function severityRank(severity: string): number {
  const i = SEVERITY_ORDER.indexOf(severity as Severity);
  return i === -1 ? SEVERITY_ORDER.length : i;
}

/** AI aksiyon önceliği — şiddetle aynı görsel dil. */
export const PRIORITY: Record<Priority, StatusToken> = {
  kritik: { color: "var(--critical)", label: "Kritik", Icon: AlertOctagon },
  yuksek: { color: "var(--serious)", label: "Yüksek", Icon: AlertTriangle },
  orta: { color: "var(--warning)", label: "Orta", Icon: AlertCircle },
  dusuk: { color: "var(--good)", label: "Düşük", Icon: Info },
};

export function priorityToken(priority: string): StatusToken {
  return PRIORITY[priority as Priority] ?? PRIORITY.dusuk;
}

export const PRIORITY_ORDER: Priority[] = ["kritik", "yuksek", "orta", "dusuk"];

/**
 * Veri kalitesi bulgusunda *ne yapıldığı*. Bu rozet panelin can damarı:
 * "sorunu buldum" değil "sorunu buldum ve şunu yaptım" mesajını veriyor.
 */
export const QUALITY_ACTION: Record<QualityAction, StatusToken> = {
  onarildi: { color: "var(--good)", label: "Onarıldı", Icon: Wrench },
  turetildi: { color: "var(--series-1)", label: "Türetildi", Icon: Sparkles },
  silindi: { color: "var(--ink-muted)", label: "Silindi", Icon: Trash2 },
  karantina: { color: "var(--serious)", label: "Karantinaya alındı", Icon: Ban },
  isaretlendi: { color: "var(--warning)", label: "İşaretlendi", Icon: Flag },
};

export function qualityActionToken(action: string): StatusToken {
  return (
    QUALITY_ACTION[action as QualityAction] ?? {
      color: "var(--ink-muted)",
      label: action,
      Icon: CircleDot,
    }
  );
}

/** Soru-cevap güven rozeti. */
export const CONFIDENCE: Record<Confidence, StatusToken> = {
  yuksek: { color: "var(--good)", label: "Yüksek güven", Icon: CircleDot },
  orta: { color: "var(--warning)", label: "Orta güven", Icon: CircleDot },
  dusuk: { color: "var(--serious)", label: "Düşük güven", Icon: CircleDot },
};

export function confidenceToken(confidence: string): StatusToken {
  return CONFIDENCE[confidence as Confidence] ?? CONFIDENCE.orta;
}

/** Sağlık puanı rozetinin rengi — 0-100. */
export function healthColor(score: number): string {
  if (score >= 85) return "var(--good)";
  if (score >= 60) return "var(--warning)";
  return "var(--critical)";
}

/**
 * Aksiyon sahibi departman ve zaman ufku — backend serbest metin gönderiyor,
 * bilinen değerler için okunur karşılık veriyoruz, bilinmeyen olduğu gibi geçer.
 */
const OWNER_LABEL: Record<string, string> = {
  satinalma: "Satın alma",
  uretim: "Üretim",
  satis: "Satış",
  finans: "Finans",
};

export function ownerLabel(owner: string): string {
  return OWNER_LABEL[owner] ?? owner;
}

const HORIZON_LABEL: Record<string, string> = {
  bu_hafta: "Bu hafta",
  bu_ay: "Bu ay",
  bu_ceyrek: "Bu çeyrek",
};

export function horizonLabel(horizon: string): string {
  return HORIZON_LABEL[horizon] ?? horizon;
}

/**
 * Metriğin artışı iyi mi kötü mü. KPI kartındaki okun rengini bu belirler —
 * sabit kodlanmaz, metrik adına bakılır.
 */
const LOWER_IS_BETTER = new Set(["tukenen_urun_sayisi"]);

export function deltaIsGood(metric: string, delta: number): "iyi" | "kotu" | "notr" {
  if (delta === 0) return "notr";
  const lowerBetter = LOWER_IS_BETTER.has(metric);
  const rising = delta > 0;
  return rising !== lowerBetter ? "iyi" : "kotu";
}
