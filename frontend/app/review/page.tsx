import { ReviewPage } from "@/components/ReviewPage";

export default async function Page({ searchParams }: { searchParams?: Promise<{ queue?: string }> }) {
  const params = await searchParams;
  return <ReviewPage initialQueue={params?.queue} />;
}
