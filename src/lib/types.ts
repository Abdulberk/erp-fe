/**
 * Backend sözleşmesinin tip yüzeyi.
 *
 * Şemadan üretilen `api-types.ts` tek doğruluk kaynağı; burada yalnızca
 * kullanışlı takma adlar veriliyor. Tek istisna: OpenAPI'de gövdesi
 * tanımsız `object` olan satır dizileri (`period_rows`, `rows`,
 * `series_rows`, `dimension_rows`, `deltas`). Üretici bunlara
 * `Record<string, never>` diyor — okunamaz. Onları `DataRow` ile
 * değiştiriyoruz ve grafik çizdiğimiz alanlar için dar yardımcı tipler
 * tanımlıyoruz.
 *
 * Bunlar veri *şekli*, etiket değil. Etiketler (`label`, `unit`, kolon
 * başlıkları, risk başlıkları) her zaman backend'den geliyor.
 */
import type { components } from "./api-types";

type S = components["schemas"];

export type DatasetSummary = S["DatasetSummary"];
export type MetricOut = S["MetricOut"];
export type Evidence = S["Evidence"];
export type RiskOut = S["RiskOut"];
export type RiskHighlight = S["RiskHighlight"];
export type QualityIssueOut = S["QualityIssueOut"];
export type QualityReportOut = S["QualityReportOut"];
export type PackOut = S["PackOut"];
export type Action = S["Action"];
export type PeriodAnalysis = S["PeriodAnalysis"];
export type ExecutiveSummary = S["ExecutiveSummary"];
export type GroundingOut = S["GroundingOut"];
export type TelemetryOut = S["TelemetryOut"];
export type AnalysisResponse = S["AnalysisResponse"];
export type AnalysisStatusResponse = S["AnalysisStatusResponse"];
export type AskResponse = S["AskResponse"];
export type QAAnswer = S["QAAnswer"];

/** Şemada gövdesi tanımsız kalan satırlar. */
export type DataRow = Record<string, unknown>;

export type OverviewResponse = Omit<S["OverviewResponse"], "period_rows"> & {
  period_rows: PeriodRow[];
};

export type PeriodsResponse = Omit<
  S["PeriodsResponse"],
  "rows" | "deltas" | "dimension_rows"
> & {
  rows: PeriodRow[];
  deltas: PeriodDelta[];
  dimension_rows: DimensionRow[];
};

export type EntitiesResponse = Omit<
  S["EntitiesResponse"],
  "columns" | "rows" | "series_rows"
> & {
  columns: ColumnSpec[];
  rows: DataRow[];
  series_rows: SeriesRow[];
};

export type UploadResponse = Omit<S["UploadResponse"], never>;
export type RisksResponse = S["RisksResponse"];

/** `/entities` kolon tanımı — tablo başlıkları buradan gelir. */
export interface ColumnSpec {
  name: string;
  label: string;
  unit: string;
}

/**
 * Dönem bazında portföy özeti. Her toplulaştırma için `_delta` ve
 * `_delta_pct` ikizleri de geliyor; index signature onları taşıyor.
 */
export interface PeriodRow extends DataRow {
  donem: string;
  toplam_ciro_tl: number;
  toplam_brut_kar_tl: number;
  ortalama_marj_yuzde: number;
  toplam_stok_degeri_tl: number;
  tukenen_urun_sayisi: number;
  toplam_cikis: number;
  toplam_giris: number;
  toplam_stok_adet: number;
}

/** `dimension` alanı `"kategori"` veya `"depo"` — filtrelemeyi buna göre yapın. */
export interface DimensionRow extends DataRow {
  dimension: string;
  dimension_value: string;
  donem: string;
  toplam_ciro_tl: number;
  toplam_brut_kar_tl: number;
  ortalama_marj_yuzde: number;
  toplam_stok_degeri_tl: number;
  toplam_cikis: number;
  urun_sayisi: number;
}

export interface PeriodDelta {
  period: string;
  previous_period: string | null;
  metrics: MetricOut[];
  movers_up: MetricOut[];
  movers_down: MetricOut[];
  new_risks: string[];
  resolved_risks: string[];
}

/** `(ürün, dönem)` uzun tablosu. `*__imputed` alanları türetilmiş değeri işaret eder. */
export interface SeriesRow extends DataRow {
  stok_kodu: string;
  urun_adi: string;
  kategori: string;
  depo: string;
  donem: string;
  giris_miktar: number | null;
  cikis_miktar: number | null;
  donem_sonu_stok: number | null;
  birim_maliyet_tl: number | null;
  birim_satis_tl: number | null;
  giris_miktar__imputed: boolean;
  cikis_miktar__imputed: boolean;
  donem_sonu_stok__imputed: boolean;
  ciro_tl: number | null;
  brut_kar_tl: number | null;
  marj_yuzde: number | null;
  stok_degeri_tl: number | null;
  kapama_ay: number | null;
}

export type Severity = "kritik" | "yuksek" | "orta" | "dusuk" | "bilgi";
export type Priority = "kritik" | "yuksek" | "orta" | "dusuk";
export type QualityAction =
  | "onarildi"
  | "turetildi"
  | "silindi"
  | "karantina"
  | "isaretlendi";
export type Confidence = "yuksek" | "orta" | "dusuk";

/** Satır kaydından güvenli sayı okuma — `null`/eksik alan `null` döner. */
export function num(row: DataRow | undefined, key: string): number | null {
  if (!row) return null;
  const v = row[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Satır kaydından güvenli metin okuma. */
export function str(row: DataRow | undefined, key: string): string | null {
  if (!row) return null;
  const v = row[key];
  return typeof v === "string" ? v : null;
}

export function bool(row: DataRow | undefined, key: string): boolean {
  return row?.[key] === true;
}
