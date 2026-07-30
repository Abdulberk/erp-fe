/** Grafik primitiflerinin ortak sözleşmesi. */

/**
 * Bir seri. `label` ve `unit` backend'den gelir — burada yeniden
 * tanımlanmaz. `color` sabit slot eşlemesinden gelir; filtre seri sayısını
 * değiştirdiğinde bu değer değişmez.
 */
export interface SeriesSpec {
  key: string;
  label: string;
  unit: string;
  color: string;
  /**
   * Değerin backend tarafından türetildiğini söyleyen bool alanın adı
   * (`cikis_miktar__imputed` gibi). Verilirse o noktalar içi boş işaretçiyle
   * çizilir ve tooltip'te "türetilmiş değer" notu görünür.
   */
  imputedKey?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  unit?: string;
  /** Sayısal kolonlar sağa yaslı. Belirtilmezse birime bakılır. */
  align?: "left" | "right";
}

export type ChartRow = Record<string, unknown>;

export const CHART_MARGIN = { top: 8, right: 12, bottom: 4, left: 4 } as const;

/** Izgara ve eksenin geri planda kalması için ortak eksen ayarları. */
export const AXIS_STYLE = {
  stroke: "var(--axis)",
  tick: { fill: "var(--ink-muted)", fontSize: 11 },
  tickLine: false,
} as const;
