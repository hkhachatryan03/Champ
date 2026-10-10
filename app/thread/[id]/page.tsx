import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ThreadView from "@/components/ThreadView";
import GuestPage from "@/components/GuestPage";

export const metadata: Metadata = pageMetadata({
  title: "Conversation",
  description: "A conversation between a candidate and a recruiter on Champ.",
  noindex: true,
});

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
