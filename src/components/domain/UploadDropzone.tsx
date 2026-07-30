"use client";

import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { uploadDataset } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { formatBytes } from "@/lib/format";
import type { PackOut } from "@/lib/types";

type Phase = "bos" | "yukleniyor" | "isleniyor";

const PHASE_TEXT: Record<Exclude<Phase, "bos">, string> = {
  yukleniyor: "Dosya gönderiliyor…",
  isleniyor: "Kodlama onarımı, veri kalitesi ve risk taraması çalışıyor…",
};

export function UploadDropzone({ packs }: { packs: PackOut[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("bos");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState<File | null>(null);

  const busy = phase !== "bos";
  /** Backend rapor tipini bulamadıysa kullanıcıya seçim sunulur. */
  const needsPack = isApiError(error) && error.code === "unknown_pack";

  async function send(file: File, pack?: string) {
    setError(null);
    setPending(file);
    setPhase("yukleniyor");
    try {
      // Gönderim anlıktır; asıl bekleme sunucudaki işleme adımı.
      const timer = setTimeout(() => setPhase("isleniyor"), 350);
      const result = await uploadDataset(file, pack);
      clearTimeout(timer);
      router.push(`/d/${result.dataset.id}`);
      router.refresh();
    } catch (e) {
      setError(e);
      setPhase("bos");
    }
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) void send(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) pick(e.dataTransfer.files);
        }}
        className={[
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragging
            ? "border-series-1 bg-[color-mix(in_srgb,var(--series-1)_7%,transparent)]"
            : "border-border bg-surface-1",
        ].join(" ")}
      >
        <div className="flex flex-col items-center px-6 py-10 text-center">
          {busy ? (
            <>
              <Loader2
                size={24}
                className="animate-spin text-series-1"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-ink-1">
                {PHASE_TEXT[phase]}
              </p>
              {pending ? (
                <p className="mt-1 text-[12px] text-ink-muted">
                  {pending.name} · {formatBytes(pending.size)}
                </p>
              ) : null}
              <div
                role="progressbar"
                aria-label="Yükleme durumu"
                className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-grid"
              >
                <div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-series-1" />
              </div>
            </>
          ) : (
            <>
              <UploadCloud size={24} className="text-ink-muted" aria-hidden />
              <p className="mt-3 text-sm font-medium text-ink-1">
                CSV dosyasını buraya bırakın
              </p>
              <p className="mt-1 text-[13px] text-ink-muted">
                Rapor tipi başlık satırından otomatik tespit edilir.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-page px-3.5 py-2 text-[13px] font-medium text-ink-1 transition-colors hover:bg-hover"
              >
                <FileUp size={15} aria-hidden />
                Dosya seç
              </button>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState error={error}>
            {needsPack && pending ? (
              <div>
                <p className="mb-2 text-[12px] font-medium text-ink-2">
                  Rapor tipini seçin
                </p>
                <div className="flex flex-wrap gap-2">
                  {packs.map((pack) => (
                    <button
                      key={pack.key}
                      type="button"
                      onClick={() => void send(pending, pack.key)}
                      className="rounded-lg border border-border bg-page px-3 py-1.5 text-[12px] font-medium text-ink-1 hover:bg-hover"
                    >
                      {pack.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </ErrorState>
        </div>
      ) : null}

      <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
