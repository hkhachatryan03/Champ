"use client";

import { useRouter } from "next/navigation";

export default function RoleToggle({ role }: { role: "candidate" | "company" }) {
  const router = useRouter();

  return (
    <div className={`aur-seg ${role === "company" ? "is-right" : ""}`}>
      <div className="aur-seg-thumb" />
      <button
        type="button"
        onClick={() => router.push("/signup?role=candidate")}
        className={role === "candidate" ? "is-on" : ""}
      >
        I&apos;m looking for a job
      </button>
      <button
        type="button"
        onClick={() => router.push("/signup?role=company")}
        className={role === "company" ? "is-on" : ""}
      >
        I&apos;m hiring
      </button>
    </div>
  );
}
