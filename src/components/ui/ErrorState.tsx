import { AlertOctagon, Info } from "lucide-react";
import Link from "next/link";
import { detailStringArray, isApiError, presentError } from "@/lib/errors";

interface Props {
  error: unknown;
  /** Listeye dönüş bağlantısı gösterilsin mi. */
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

/**
 * Hata kodundan anlamlı ekran üretir. Dallanma **`code`** alanına göre
 * yapılır, mesaj metnine göre değil; backend mesajı ayrıca gösterilir.
 */
export function ErrorState({ error, backHref, backLabel, children }: Props) {
  const code = isApiError(error) ? error.code : "internal_error";
  const message = error instanceof Error ? error.message : String(error);
  const details = isApiError(error) ? error.details : {};
  const requestId = isApiError(error) ? error.requestId : null;
  const view = presentError(code);

  const durum = view.tone === "durum";
  const accent = durum ? "var(--ink-muted)" : "var(--critical)";
  const Icon = durum ? Info : AlertOctagon;

  const missing = detailStringArray(details, "missing_columns");
  const found = detailStringArray(details, "found_columns");
  const available = detailStringArray(details, "available");

  return (
    <div
      role={durum ? "status" : "alert"}
      className="rounded-xl border border-border bg-surface-1 p-6"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} style={{ color: accent }} aria-hidden className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-ink-1">{view.title}</h2>

          {message && message !== view.title ? (
            <p className="mt-1.5 text-sm text-ink-2">{message}</p>
          ) : null}

          {view.hint ? (
            <p className="mt-2 text-[13px] text-ink-muted">{view.hint}</p>
          ) : null}

          {missing.length > 0 ? (
            <div className="mt-3">
              <p className="text-[12px] font-medium text-ink-2">Eksik kolonlar</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {missing.map((c) => (
                  <li
                    key={c}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-ink-2"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {found.length > 0 ? (
            <div className="mt-3">
              <p className="text-[12px] font-medium text-ink-2">
                Dosyada bulunan kolonlar
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {found.map((c) => (
                  <li
                    key={c}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {available.length > 0 ? (
            <div className="mt-3">
              <p className="text-[12px] font-medium text-ink-2">
                Seçilebilir rapor tipleri
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {available.map((c) => (
                  <li
                    key={c}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-ink-2"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {children ? <div className="mt-4">{children}</div> : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
            <span className="font-mono">{code}</span>
            {requestId ? (
              <span className="font-mono">istek: {requestId}</span>
            ) : null}
            {backHref ? (
              <Link
                href={backHref}
                className="font-medium text-ink-2 underline underline-offset-2 hover:text-ink-1"
              >
                {backLabel ?? "Listeye dön"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
