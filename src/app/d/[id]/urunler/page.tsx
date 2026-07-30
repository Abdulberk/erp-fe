import { EntityExplorer } from "@/components/entities/EntityExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getEntities, getRisks } from "@/lib/api";
import type { EntitiesResponse, RisksResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ürünler" };

export default async function EntitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let entities: EntitiesResponse;
  let risks: RisksResponse;
  try {
    [entities, risks] = await Promise.all([getEntities(id), getRisks(id)]);
  } catch (error) {
    return <ErrorState error={error} backHref="/" />;
  }

  if (entities.rows.length === 0) {
    return <EmptyState title="Kayıt yok" description="Bu veri setinde ürün satırı yok." />;
  }

  return <EntityExplorer entities={entities} risks={risks.risks} />;
}
