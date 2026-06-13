import { GuidePage } from "@/components/GuidePage";

export default async function Page({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const params = await searchParams;
  return <GuidePage policyCenter={params?.section === "policies"} />;
}
