"use client";

import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { ErrorState } from "@/components/ui/ErrorState";
import { createAnalysis } from "@/lib/api";
import { formatValue } from "@/lib/format";
import type { AnalysisResponse, AnalysisStatusResponse } from "@/lib/types";

/**
 * Üretim ilerlemesi. Backend adım bildirimi yapmadığı için bu bir *tahmin*;
 * kullanıcıya öyle söyleniyor. Spinner tek başına 100 saniyeyi taşımıyor —
 * ne olduğunu anlatan bir metin gerekiyor.
 */
const STEPS = [
  { at: 0, label: "Hesaplanmış tablolar modele hazırlanıyor" },
  { at: 8, label: "Her dönem paralel analiz ediliyor" },
  { at: 70, label: "Yönetici özeti sentezleniyor" },
  { at: 100, label: "Kanıtlar hesaplanmış değerlerle doğrulanıyor" },
];

interface Props {
  status: AnalysisStatusResponse;
}

export function AnalysisRunner({ status }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const started = useRef(false);

  const run = useCallback(async (refresh: boolean) => {
    setError(null);
    setRunning(true);
    setElapsed(0);
    try {
      const result = await createAnalysis(status.dataset_id, refresh);
      setAnalysis(result);
    } catch (e) {
      setError(e);
    } finally {
      setRunning(false);
    }
  }, [status.dataset_id]);

  // Önbellekte varsa çağrı ücretsiz ve anında döner — beklemeye gerek yok.
  useEffect(() => {
    if (status.cached && !started.current) {
      started.current = true;
      void run(false);
    }
  }, [status.cached, run]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (running) {
    return <RunningState elapsed={elapsed} calls={status.estimated_calls} />;
  }

  if (error) {
    return (
      <ErrorState error={error}>
        <button
          type="button"
          onClick={() => void run(false)}
          className="rounded-lg border border-border bg-page px-3 py-1.5 text-[12px] font-medium text-ink-1 hover:bg-hover"
        >
          Tekrar dene
        </button>
      </ErrorState>
    );
  }

  if (analysis) {
    return (
      <div className="space-y-4">
        <AnalysisView analysis={analysis} />
        <div className="flex items-center justify-end gap-3">
          <p className="text-[11px] text-ink-muted">
            Yeniden üretmek yeni AI çağrıları yapar ve ücretlendirilir.
          </p>
          <RefreshButton onConfirm={() => void run(true)} />
        </div>
      </div>
    );
  }

  return <StartCard status={status} onStart={() => void run(false)} />;
}

function StartCard({
  status,
  onStart,
}: {
  status: AnalysisStatusResponse;
  onStart: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink-1">
        <Sparkles size={16} style={{ color: "var(--series-1)" }} aria-hidden />
        Dönemsel analiz henüz üretilmedi
      </h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-2">
        Her dönem için ayrı bir AI çağrısı, ardından tek bir sentez çağrısı
        yapılır. Model ham veriyi görmez; yalnızca hesaplanmış tabloları yorumlar
        ve ürettiği her sayı kaynak tabloyla karşılaştırılır.
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <dt className="text-[10px] tracking-wide text-ink-muted uppercase">
            Yapılacak çağrı
          </dt>
          <dd className="tnum text-[13px] font-semibold text-ink-1">
            {formatValue(status.estimated_calls, "sayi")}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-ink-muted uppercase">
            Tahmini süre
          </dt>
          <dd className="text-[13px] font-semibold text-ink-1">~2 dakika</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-ink-muted uppercase">
            Model
          </dt>
          <dd className="text-[13px] font-semibold text-ink-1">
            {status.model} · {status.effort}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-page px-4 py-2 text-[13px] font-medium text-ink-1 transition-colors hover:bg-hover"
      >
        <Sparkles size={15} aria-hidden />
        Analizi üret
      </button>
      <p className="mt-2 text-[11px] text-ink-muted">
        Sonuç önbelleğe yazılır; bu veri seti için tekrar açıldığında AI&apos;a
        gidilmez.
      </p>
    </div>
  );
}

function RunningState({ elapsed, calls }: { elapsed: number; calls: number }) {
  const active = STEPS.reduce((acc, step, i) => (elapsed >= step.at ? i : acc), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="flex items-center gap-2.5">
          <Loader2 size={17} className="animate-spin text-series-1" aria-hidden />
          <h2 className="text-[15px] font-semibold text-ink-1">
            Analiz üretiliyor
          </h2>
          <span className="tnum ml-auto text-[13px] text-ink-2" role="timer">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        </div>

        <ol className="mt-4 space-y-2">
          {STEPS.map((step, i) => (
            <li key={step.label} className="flex items-center gap-2.5 text-[13px]">
              {i < active ? (
                <Check size={14} style={{ color: "var(--good)" }} aria-hidden />
              ) : i === active ? (
                <Loader2
                  size={14}
                  className="animate-spin text-series-1"
                  aria-hidden
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-axis"
                  style={{ margin: "0 6px" }}
                />
              )}
              <span
                className={
                  i <= active ? "text-ink-1" : "text-ink-muted"
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-[11px] text-ink-muted">
          {calls} çağrı yapılıyor, tipik süre ~2 dakika. Adım göstergesi geçen
          süreye dayalı bir tahmindir; sayfayı kapatmayın.
        </p>
      </div>

      <div aria-hidden className="space-y-4">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface-1" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-1" />
      </div>
    </div>
  );
}

function RefreshButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink-1"
      >
        <RefreshCw size={13} aria-hidden />
        Yeniden üret
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
        className="rounded-lg border border-[color-mix(in_srgb,var(--serious)_40%,transparent)] bg-[color-mix(in_srgb,var(--serious)_12%,transparent)] px-2.5 py-1.5 text-[12px] font-medium text-ink-1"
      >
        Evet, yeniden üret
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-ink-2"
      >
        Vazgeç
      </button>
    </span>
  );
}
