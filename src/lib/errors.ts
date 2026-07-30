/**
 * Hata sözleşmesi — PLAN.md bölüm 4.
 *
 * Backend'in tüm hataları aynı gövdeyi döner:
 *   { code, message, details }
 * İstemci **`code` alanına göre dallanır, mesaj metnine göre değil.**
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;

  constructor(
    code: string,
    message: string,
    status: number,
    details: Record<string, unknown> = {},
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Ağa hiç çıkamadık (backend kapalı, CORS, DNS). */
export const NETWORK_ERROR = "network_error";

export interface ErrorPresentation {
  /** Kullanıcıya gösterilecek başlık. */
  title: string;
  /** Ne yapması gerektiğini söyleyen kısa yönlendirme. */
  hint?: string;
  /** Hata bir engel değil, bir durum mu (AI kapalıysa uygulama çalışmaya devam eder). */
  tone: "hata" | "durum";
}

/**
 * Koddan kullanıcıya gösterilecek metni üretir.
 *
 * `message` alanı backend'den geldiği gibi ayrıca gösterilir — burada
 * yalnızca *ne yapılacağını* söyleyen çerçeve metni var. Backend mesajını
 * kopyalamıyoruz ki tek doğruluk kaynağı bozulmasın.
 */
const PRESENTATION: Record<string, ErrorPresentation> = {
  empty_dataset: {
    title: "Dosyada işlenebilir veri satırı yok.",
    hint: "Dosyanın doğru rapor olduğundan ve satır içerdiğinden emin olun.",
    tone: "hata",
  },
  schema_mismatch: {
    title: "Beklenen kolonlar dosyada yok.",
    hint: "Eksik kolonlar aşağıda. ERP export'unu başlık satırıyla birlikte alın.",
    tone: "hata",
  },
  unknown_pack: {
    title: "Rapor tipi tanınmadı.",
    hint: "Aşağıdaki tiplerden birini seçip tekrar yükleyin.",
    tone: "hata",
  },
  file_too_large: {
    title: "Dosya boyut sınırını aşıyor.",
    hint: "Daha küçük bir dönem aralığı ile tekrar deneyin.",
    tone: "hata",
  },
  not_found: {
    title: "Veri seti bulunamadı.",
    hint: "Silinmiş olabilir. Listeye dönüp yeniden seçin.",
    tone: "hata",
  },
  undecodable_file: {
    title: "Dosya okunamadı.",
    hint: "Karakter kodlamasını kontrol edin (UTF-8 veya Windows-1254).",
    tone: "hata",
  },
  ai_not_configured: {
    title: "AI anahtarı tanımlı değil.",
    hint: "Backend'de ANTHROPIC_API_KEY tanımlayıp servisi yeniden başlatın. Dashboard, veri kalitesi, riskler, ürünler ve PDF bu durumda da çalışır.",
    tone: "durum",
  },
  ai_rate_limited: {
    title: "AI istek limiti aşıldı.",
    hint: "Biraz bekleyip tekrar deneyin.",
    tone: "hata",
  },
  ai_error: {
    title: "AI yanıtı alınamadı.",
    hint: "Tekrar deneyin. Sorun sürerse backend loglarına bakın.",
    tone: "hata",
  },
  ai_response_invalid: {
    title: "AI yanıtı beklenen biçimde değil.",
    hint: "Tekrar deneyin — model çıktısı şema doğrulamasından geçemedi.",
    tone: "hata",
  },
  validation_error: {
    title: "Girdi doğrulanamadı.",
    tone: "hata",
  },
  internal_error: {
    title: "Beklenmeyen bir hata oluştu.",
    hint: "Tekrar deneyin. Sorun sürerse aşağıdaki istek numarasıyla destek isteyin.",
    tone: "hata",
  },
  [NETWORK_ERROR]: {
    title: "Backend'e ulaşılamıyor.",
    hint: "Servisin çalıştığını doğrulayın: uvicorn app.main:app --reload",
    tone: "hata",
  },
};

export function presentError(code: string): ErrorPresentation {
  return (
    PRESENTATION[code] ?? {
      title: "Beklenmeyen bir hata oluştu.",
      tone: "hata",
    }
  );
}

/** `details.missing_columns` gibi dizi alanlarını güvenle okur. */
export function detailStringArray(
  details: Record<string, unknown>,
  key: string,
): string[] {
  const v = details[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}
