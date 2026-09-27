import { getVisibleFlagsForUser } from "@/lib/queries";

export default async function AdminNoticeBanner({ userId }: { userId: number }) {
  const notices = await getVisibleFlagsForUser(userId);
  if (notices.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-2">
      {notices.map((n) => (
        <div key={n.id} className="p-4 rounded-xl border border-apricot/40 bg-apricot/10">
          <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">A note from the Champ team</p>
          <p className="text-sm mt-1 whitespace-pre-wrap">{n.user_message}</p>
        </div>
      ))}
    </div>
  );
}
