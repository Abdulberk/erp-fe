/**
 * Backend istemcisi.
 *
 * Veri sayfa başına bir kez Server Component içinden çekilir; etkileşim
 * gerektiren uçlar (yükleme, analiz üretimi, soru-cevap) tarayıcıdan çağrılır.
 * Ekstra veri kütüphanesi yok.
 */
import { ApiError, NETWORK_ERROR, type ApiErrorBody } from "./errors";
import type {
  AnalysisResponse,
  AnalysisStatusResponse,
  AskResponse,
  DatasetSummary,
  EntitiesResponse,
  OverviewResponse,
  PackOut,
  PeriodsResponse,
  QualityReportOut,
  RisksResponse,
  UploadResponse,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
).replace(/\/$/, "");

function isErrorBody(v: unknown): v is ApiErrorBody {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as ApiErrorBody).code === "string" &&
    typeof (v as ApiErrorBody).message === "string"
  );
}

/** FastAPI'nin ham doğrulama hatası: `{ detail: [{ loc, msg, type }] }`. */
function fastapiValidationMessage(v: unknown): string | null {
  if (typeof v !== "object" || v === null) return null;
  const detail = (v as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return null;
  const parts = detail
    .map((d) =>
      typeof d === "object" && d !== null && typeof (d as { msg?: unknown }).msg === "string"
        ? String((d as { msg: string }).msg)
        : null,
    )
    .filter((s): s is string => s !== null);
  return parts.length > 0 ? parts.join(", ") : null;
}

async function toApiError(res: Response): Promise<ApiError> {
  const requestId = res.headers.get("x-request-id");
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* gövde yok ya da JSON değil */
  }

  if (isErrorBody(body)) {
    return new ApiError(
      body.code,
      body.message,
      res.status,
      body.details ?? {},
      requestId,
    );
  }

  const validationMsg = fastapiValidationMessage(body);
  if (validationMsg) {
    return new ApiError("validation_error", validationMsg, res.status, {}, requestId);
  }

  return new ApiError(
    res.status === 404 ? "not_found" : "internal_error",
    `Beklenmeyen yanıt (HTTP ${res.status})`,
    res.status,
    {},
    requestId,
  );
}

interface FetchOptions extends Omit<RequestInit, "cache"> {
  /** Sunucu tarafında veriyi tazelemek için varsayılan `no-store`. */
  revalidate?: number | false;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate, ...init } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: revalidate === undefined || revalidate === false ? "no-store" : undefined,
      next: typeof revalidate === "number" ? { revalidate } : undefined,
    });
  } catch (cause) {
    throw new ApiError(
      NETWORK_ERROR,
      cause instanceof Error ? cause.message : "Bağlantı kurulamadı",
      0,
    );
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ okuma */

export function getPacks(): Promise<PackOut[]> {
  return apiFetch<PackOut[]>("/packs");
}

export function getDatasets(): Promise<DatasetSummary[]> {
  return apiFetch<DatasetSummary[]>("/datasets");
}

export function getDataset(id: string): Promise<DatasetSummary> {
  return apiFetch<DatasetSummary>(`/datasets/${encodeURIComponent(id)}`);
}

export function getOverview(id: string, top = 8): Promise<OverviewResponse> {
  return apiFetch<OverviewResponse>(
    `/datasets/${encodeURIComponent(id)}/overview?top=${top}`,
  );
}

export function getPeriods(id: string): Promise<PeriodsResponse> {
  return apiFetch<PeriodsResponse>(`/datasets/${encodeURIComponent(id)}/periods`);
}

export function getEntities(id: string, includeSeries = true): Promise<EntitiesResponse> {
  return apiFetch<EntitiesResponse>(
    `/datasets/${encodeURIComponent(id)}/entities?include_series=${includeSeries}`,
  );
}

export function getQuality(id: string): Promise<QualityReportOut> {
  return apiFetch<QualityReportOut>(`/datasets/${encodeURIComponent(id)}/quality`);
}

export function getRisks(
  id: string,
  params: { severity?: string; period?: string } = {},
): Promise<RisksResponse> {
  const qs = new URLSearchParams();
  if (params.severity) qs.set("severity", params.severity);
  if (params.period) qs.set("period", params.period);
  const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
  return apiFetch<RisksResponse>(`/datasets/${encodeURIComponent(id)}/risks${suffix}`);
}

export function getAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
  return apiFetch<AnalysisStatusResponse>(
    `/datasets/${encodeURIComponent(id)}/analysis/status`,
  );
}

/* ------------------------------------------------------------------ yazma */

/**
 * CSV yükler. `pack` gönderilmez — backend başlıklardan tespit ediyor.
 * Tespit edemezse `unknown_pack` döner, o zaman kullanıcıya seçim sunulur.
 */
export function uploadDataset(file: File, pack?: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (pack) form.append("pack", pack);
  return apiFetch<UploadResponse>("/datasets", { method: "POST", body: form });
}

export function deleteDataset(id: string): Promise<void> {
  return apiFetch<void>(`/datasets/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * AI analizini üretir. Önbellekte varsa anında döner; değilse ~100 sn sürer
 * ve para harcar. `refresh` yalnızca kullanıcı açıkça isterse true olmalı.
 */
export function createAnalysis(id: string, refresh = false): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>(
    `/datasets/${encodeURIComponent(id)}/analysis?refresh=${refresh}`,
    { method: "POST" },
  );
}

export function askQuestion(id: string, question: string): Promise<AskResponse> {
  return apiFetch<AskResponse>(`/datasets/${encodeURIComponent(id)}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

/** PDF doğrudan tarayıcıda açılır — blob indirmeye gerek yok. */
export function reportPdfUrl(id: string, includeAi = true): string {
  return `${API_URL}/datasets/${encodeURIComponent(id)}/report.pdf?include_ai=${includeAi}`;
}
