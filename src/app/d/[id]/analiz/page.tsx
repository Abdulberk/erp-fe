import { AnalysisRunner } from "@/components/analysis/AnalysisRunner";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAnalysisStatus } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import type { AnalysisStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI analizi" };

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let status: AnalysisStatusResponse;
  try {
    status = await getAnalysisStatus(id);
  } catch (error) {
    return <ErrorState error={error} backHref={`/d/${id}`} backLabel="Dashboard'a dön" />;
  }

  // `ai_not_configured` bir hata değil, bir durum: uygulamanın geri kalanı
  // (dashboard, kalite, riskler, ürünler, PDF) tam çalışmaya devam ediyor.
  if (!status.ai_configured) {
    return (
      <ErrorState
        error={
          new ApiError(
            "ai_not_configured",
            "Bu bölüm bir AI anahtarı gerektiriyor.",
            503,
          )
        }
        backHref={`/d/${id}`}
        backLabel="Dashboard'a dön"
      />
    );
  }

  return <AnalysisRunner status={status} />;
}
