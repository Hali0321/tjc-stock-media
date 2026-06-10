import { EnterpriseAssetDetailPage } from "@/components/dam/EnterpriseDamPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnterpriseAssetDetailPage id={id} />;
}
