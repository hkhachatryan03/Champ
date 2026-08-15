"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Applicant = {
  id: number;
  candidate_name: string;
  candidate_title: string;
  status: string;
  updated_at: string;
};

const STATUSES = ["New", "Interviewing", "Offer", "Not moving forward"];
const COLORS: Record<string, string> = {
  New: "#B98B7C",
  Interviewing: "#C97D1B",
  Offer: "#5C7A5E",
  "Not moving forward": "#726A5B",
};

export default function JobApplicantsView({ applicants }: { applicants: Applicant[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const chartData = STATUSES.map((status) => ({
    status,
    count: applicants.filter((a) => a.status === status).length,
  }));

  const filtered = selected ? applicants.filter((a) => a.status === selected) : applicants;

  return (
    <div>
      <div className="p-4 rounded-xl border border-line bg-white mb-6">
        <p className="text-xs text-muted mb-2">
          Click a bar to filter the list below{selected ? ` — showing "${selected}" only` : ""}
        </p>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
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

      <div className="flex flex-col gap-3">
        {filtered.map((a) => (
          <Link
            key={a.id}
            href={`/thread/${a.id}`}
            className="p-4 rounded-xl border border-line bg-white flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium">{a.candidate_name || "(unnamed candidate)"}</div>
              <div className="text-xs text-muted mt-0.5">{a.candidate_title}</div>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${COLORS[a.status]}22`, color: COLORS[a.status] }}
            >
              {a.status}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-center py-8 text-muted">
            {selected ? `No applicants with status "${selected}".` : "No applicants yet."}
          </p>
        )}
      </div>
    </div>
  );
}
