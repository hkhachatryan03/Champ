"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Applicant = {
  id: number;
  candidate_user_id: number;
  candidate_name: string;
  candidate_title: string;
  status: string;
  updated_at: string;
};

const STATUSES = ["New", "Interviewing", "Offer", "Hired", "Not moving forward"];
const COLORS: Record<string, string> = {
  New: "#B98B7C",
  Interviewing: "#C97D1B",
  Offer: "#5C7A5E",
  Hired: "#3F5B41",
  "Not moving forward": "#726A5B",
};

export default function JobApplicantsView({
  applicants,
  description,
}: {
  applicants: Applicant[];
  description: React.ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const chartData = STATUSES.map((status) => ({
    status,
    count: applicants.filter((a) => a.status === status).length,
  }));

  const filtered = selected ? applicants.filter((a) => a.status === selected) : applicants;

  return (
    <div className="grid md:grid-cols-[2fr_3fr] gap-6 items-start">
      <div>{description}</div>

      <div>
        {applicants.length === 0 ? (
          <div className="p-6 rounded-xl border border-line bg-white text-center">
            <p className="text-sm text-muted">There are no applicants for this role yet.</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-line bg-white">
            <p className="text-sm font-medium text-muted mb-1">Applicant statistics</p>
            <p className="text-xs text-muted mb-3">Click a bar to filter the list below</p>
            <div style={{ width: "100%", height: 190 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 30 }}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any) => setSelected(selected === data.status ? null : data.status)}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={COLORS[entry.status]}
                        opacity={selected && selected !== entry.status ? 0.35 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-xs underline text-muted mt-1">
                Clear filter
              </button>
            )}
          </div>
        )}

        {applicants.length > 0 && (
          <>
            <h2 className="font-display font-semibold text-lg mt-6 mb-3">
              Applicants ({applicants.length})
              {selected && <span className="text-sm font-normal text-muted"> — showing &quot;{selected}&quot;</span>}
            </h2>
            <div className="flex flex-col gap-3">
              {filtered.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-line bg-white flex items-center justify-between">
                  <div>
                    <Link href={`/company/candidates/${a.candidate_user_id}`} className="text-sm font-medium hover:underline">
                      {a.candidate_name || "(unnamed candidate)"}
                    </Link>
                    <div className="text-xs text-muted mt-0.5">{a.candidate_title}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: `${COLORS[a.status]}22`, color: COLORS[a.status] }}
                    >
                      {a.status}
                    </span>
                    <Link href={`/thread/${a.id}`} prefetch={false} className="text-xs underline text-apricot-deep whitespace-nowrap">
                      Chat →
                    </Link>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-center py-8 text-muted">No applicants with status &quot;{selected}&quot;.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
