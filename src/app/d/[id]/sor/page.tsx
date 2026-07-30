import { AskPanel } from "@/components/ask/AskPanel";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAnalysisStatus } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import type { AnalysisStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Soru-cevap" };

export default async function AskPage({
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

  return <AskPanel datasetId={id} />;
}
