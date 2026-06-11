import { notFound } from "next/navigation";
import { EnterpriseAssetDetailPage } from "@/components/dam/EnterpriseDamPages";
import { normalizeAssetId } from "@/lib/request-validation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = normalizeAssetId((await params).id);
  if (!id) notFound();
  return <EnterpriseAssetDetailPage id={id} />;
}
