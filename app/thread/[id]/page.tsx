import ThreadView from "@/components/ThreadView";
import GuestPage from "@/components/GuestPage";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const { id } = await params;
  const { show } = await searchParams;

  return (
    <GuestPage>
      <ThreadView glass applicationId={Number(id)} showLimit={show ? Number(show) : undefined} />
    </GuestPage>
  );
}
