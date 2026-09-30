"use client";

import { useRouter } from "next/navigation";

export default function RecruiterTypeToggle({ recruiterType }: { recruiterType: "company" | "agency" }) {
  const router = useRouter();

  return (
    <div>
      <label className="aur-label">Type of recruiter</label>
      <div className={`aur-seg aur-seg-sm ${recruiterType === "agency" ? "is-right" : ""}`}>
        <div className="aur-seg-thumb" />
        <button
          type="button"
          onClick={() => router.push("/signup?role=company&type=company")}
          className={recruiterType === "company" ? "is-on" : ""}
        >
          In-house
        </button>
        <button
          type="button"
          onClick={() => router.push("/signup?role=company&type=agency")}
          className={recruiterType === "agency" ? "is-on" : ""}
        >
          Agency
        </button>
      </div>
    </div>
  );
}
