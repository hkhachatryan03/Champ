import { getVisibleFlagsForUser } from "@/lib/queries";

export default async function AdminNoticeBanner({ userId, glass = false }: { userId: number; glass?: boolean }) {
  const notices = await getVisibleFlagsForUser(userId);
  if (notices.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-2">
      {notices.map((n) => (
        <div key={n.id} className={glass ? "px-[18px] py-3.5 rounded-2xl border border-apricot/40 bg-apricot/10" : "p-4 rounded-xl border border-apricot/40 bg-apricot/10"}>
          <p className={`text-xs font-medium uppercase tracking-wide ${glass ? "text-apricot tracking-[.12em]" : "text-apricot-deep"}`}>A note from the Champ team</p>
          <p className={`text-sm mt-1 whitespace-pre-wrap ${glass ? "text-paper/85 leading-[1.6]" : ""}`}>{n.user_message}</p>
        </div>
      ))}
    </div>
  );
}
