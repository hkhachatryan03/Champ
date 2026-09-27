"use client";

import { useRouter } from "next/navigation";

export default function RecruiterTypeToggle({ recruiterType }: { recruiterType: "company" | "agency" }) {
  const router = useRouter();

  return (
    <div>
      <label className="text-xs font-medium text-muted">Type of recruiter</label>
      <div className="relative grid grid-cols-2 gap-2 mt-1 rounded-xl border border-line bg-paper-dim/60 p-1">
        <div
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: recruiterType === "agency" ? "translateX(calc(100% + 8px))" : "translateX(0)" }}
        />
        <button
          type="button"
          onClick={() => router.push("/signup?role=company&type=company")}
          className={`relative z-10 py-2 rounded-lg text-sm font-medium transition-colors ${
            recruiterType === "company" ? "text-ink" : "text-muted"
          }`}
        >
          In-house
        </button>
        <button
          type="button"
          onClick={() => router.push("/signup?role=company&type=agency")}
          className={`relative z-10 py-2 rounded-lg text-sm font-medium transition-colors ${
            recruiterType === "agency" ? "text-ink" : "text-muted"
          }`}
        >
          Agency
        </button>
      </div>
    </div>
  );
}
