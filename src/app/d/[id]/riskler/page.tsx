import { RiskRegistry } from "@/components/risks/RiskRegistry";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getRisks } from "@/lib/api";
import type { RisksResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Riskler" };

export default async function RisksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let risks: RisksResponse;
  try {
    // Filtreleme istemcide: tüm sicil bir kez geliyor, filtre anında uygulanıyor.
    risks = await getRisks(id);
  } catch (error) {
    return <ErrorState error={error} backHref="/" />;
  }

  if (risks.risks.length === 0) {
    return (
      <EmptyState
        title="Risk bulunamadı"
        description="Tanımlı kurallar bu veri setinde bir bulgu üretmedi."
      />
    );
  }

  return <RiskRegistry data={risks} />;
}
