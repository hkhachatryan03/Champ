import ThreadView from "@/components/ThreadView";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const { id } = await params;
  const { show } = await searchParams;

  return <ThreadView applicationId={Number(id)} showLimit={show ? Number(show) : undefined} />;
}
