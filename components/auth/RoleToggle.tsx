"use client";

import { useRouter } from "next/navigation";

export default function RoleToggle({ role }: { role: "candidate" | "company" }) {
  const router = useRouter();

  return (
    <div className="relative grid grid-cols-2 rounded-xl border border-line bg-paper-dim/60 p-1">
      <div
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: role === "company" ? "translateX(calc(100% + 8px))" : "translateX(0)" }}
      />
      <button
        type="button"
        onClick={() => router.push("/signup?role=candidate")}
        className={`relative z-10 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          role === "candidate" ? "text-ink" : "text-muted"
        }`}
      >
        I&apos;m looking for a job
      </button>
      <button
        type="button"
        onClick={() => router.push("/signup?role=company")}
        className={`relative z-10 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          role === "company" ? "text-ink" : "text-muted"
        }`}
      >
        I&apos;m hiring
      </button>
    </div>
  );
}
