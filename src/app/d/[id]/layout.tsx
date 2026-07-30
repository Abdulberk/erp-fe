import { DatasetShell } from "@/components/layout/DatasetShell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAnalysisStatus, getOverview } from "@/lib/api";
import type { OverviewResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * `ai_configured === false` bir hata değil, bir durum: dashboard, kalite,
 * riskler, ürünler ve PDF çalışmaya devam eder, yalnızca AI sekmeleri kapanır.
 * Uç hiç yanıt vermezse de aynı şekilde davranırız.
 */
async function aiConfigured(id: string): Promise<boolean> {
  try {
    const status = await getAnalysisStatus(id);
    return status.ai_configured;
  } catch {
    return false;
  }
}

export default async function DatasetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let overview: OverviewResponse;
  try {
    // Sayfalar da aynı uca gidiyor; Next aynı render içinde tek isteğe indiriyor.
    overview = await getOverview(id);
  } catch (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>
        <ErrorState error={error} backHref="/" />
      </div>
    );
  }

  return (
    <DatasetShell
      dataset={overview.dataset}
      periods={overview.periods}
      aiConfigured={await aiConfigured(id)}
    >
      {children}
    </DatasetShell>
  );
}
