"use client";

import { AlertTriangle, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { GroundingBadge } from "@/components/analysis/GroundingBadge";
import { EvidenceList } from "@/components/domain/EvidencePill";
import { ConfidenceBadge } from "@/components/domain/StatusChip";
import { ErrorState } from "@/components/ui/ErrorState";
import { askQuestion } from "@/lib/api";
import { formatUsd, formatValue } from "@/lib/format";
import type { AskResponse } from "@/lib/types";

const MIN = 3;
const MAX = 500;

const EXAMPLES = [
  "Marjı en hızlı daralan ürün hangisi ve neden?",
  "Hangi ürünlerde sermaye gereksiz bağlı duruyor?",
  "Mart ayında ne değişti?",
];

export function AskPanel({ datasetId }: { datasetId: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AskResponse[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const trimmed = question.trim();
  const valid = trimmed.length >= MIN && trimmed.length <= MAX;

  async function ask(text: string) {
    const value = text.trim();
    if (value.length < MIN || value.length > MAX || pending) return;
    setPending(true);
    setError(null);
    try {
      const answer = await askQuestion(datasetId, value);
      setHistory((prev) => [answer, ...prev]);
      setQuestion("");
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface-1 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <label htmlFor="soru" className="text-[13px] font-semibold text-ink-1">
            Veri üzerine soru sorun
          </label>
          <p className="mt-1 text-[12px] text-ink-muted">
            Model SQL yazmaz; hesaplanmış tabloları yorumlar ve yanıtına kanıt
            iliştirir.
          </p>

          <div className="mt-3 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <textarea
                id="soru"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(question);
                  }
                }}
                rows={2}
                maxLength={MAX}
                placeholder="Örn. Hangi kategoride marj en çok geriledi?"
                className="w-full resize-y rounded-lg border border-border bg-page px-3 py-2 text-[13px] text-ink-1 placeholder:text-ink-muted"
              />
              <p className="tnum mt-1 text-[11px] text-ink-muted">
                {trimmed.length}/{MAX} karakter · en az {MIN}
              </p>
            </div>

            <button
              type="submit"
              disabled={!valid || pending}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-page px-3.5 py-2 text-[13px] font-medium text-ink-1 transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <Send size={15} aria-hidden />
              )}
              Sor
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={pending}
              onClick={() => {
                setQuestion(example);
                void ask(example);
              }}
              className="rounded-md border border-border bg-page px-2 py-1 text-[11px] text-ink-2 transition-colors hover:bg-hover hover:text-ink-1 disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      {error ? <ErrorState error={error} /> : null}

      {pending ? (
        <div
          aria-hidden
          className="h-32 animate-pulse rounded-xl border border-border bg-surface-1"
        />
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[12px] font-medium tracking-wide text-ink-muted uppercase">
            Yanıtlar
          </h2>
          {history.map((item, i) => (
            <AnswerCard key={`${item.question}-${i}`} response={item} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function AnswerCard({ response }: { response: AskResponse }) {
  const { answer, grounding, telemetry } = response;

  return (
    <article className="rounded-xl border border-border bg-surface-1 p-4">
      <p className="text-[13px] font-medium text-ink-2">
        <span className="text-ink-muted">Soru: </span>
        {response.question}
      </p>

      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-1">
        {answer.answer}
      </p>

      {answer.evidence && answer.evidence.length > 0 ? (
        <div className="mt-3">
          <EvidenceList evidence={answer.evidence} />
        </div>
      ) : null}

      {answer.caveats && answer.caveats.length > 0 ? (
        <div
          className="mt-3 rounded-lg border border-border bg-page p-3"
          style={{ borderLeft: "2px solid var(--warning)" }}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
            <AlertTriangle size={12} style={{ color: "var(--warning)" }} aria-hidden />
            Yanıtın sınırları
          </p>
          <ul className="mt-1 space-y-0.5">
            {answer.caveats.map((caveat, i) => (
              <li key={i} className="text-[12px] leading-relaxed text-ink-2">
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <ConfidenceBadge confidence={answer.confidence} />
        <GroundingBadge grounding={grounding} size="sm" />
        <span className="tnum ml-auto text-[11px] text-ink-muted">
          {response.cached
            ? "önbellekten — ücretsiz"
            : `${formatValue(telemetry.call_count ?? 0, "sayi")} çağrı · ${formatUsd(
                telemetry.total_cost_usd,
              )}`}
        </span>
      </div>
    </article>
  );
}
