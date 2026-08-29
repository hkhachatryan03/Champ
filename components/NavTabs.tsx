"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-apricot text-ink text-[10px] font-semibold">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function NavTabs({ tabs }: { tabs: [string, string, number][] }) {
  const pathname = usePathname();

  return (
    <div className="px-6 flex gap-5 border-t border-white/10 overflow-x-auto">
      {tabs.map(([href, label, unread]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={`text-sm py-3 font-medium whitespace-nowrap flex items-center border-b-2 transition-colors ${
              active ? "text-apricot border-apricot" : "text-paper/85 border-transparent hover:text-apricot"
            }`}
          >
            {label}
            <Badge count={unread} />
          </Link>
        );
      })}
    </div>
  );
}
