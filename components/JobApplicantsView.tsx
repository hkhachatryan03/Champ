"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { StatusPill } from "@/components/ui";

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

// Softer versions of the same five colours, readable on the dark glass look.
const GLASS_COLORS: Record<string, string> = {
  New: "#C9A28F",
  Interviewing: "#EA9A2E",
  Offer: "#7FB08A",
  Hired: "#4E9A6A",
  "Not moving forward": "#6F7480",
};

export default function JobApplicantsView({
  applicants,
  description,
  glass = false,
}: {
  applicants: Applicant[];
  description: React.ReactNode;
  /** Dark "Ethereal Glass" look. Default = original light layout. */
  glass?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const chartData = STATUSES.map((status) => ({
    status,
    count: applicants.filter((a) => a.status === status).length,
  }));

  const filtered = selected ? applicants.filter((a) => a.status === selected) : applicants;

  if (glass) {
    const max = Math.max(1, ...chartData.map((d) => d.count));
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-[26px] items-start">
        <div>{description}</div>
        <div>
          {applicants.length === 0 ? (
            <div className="aur-bezel">
              <div className="aur-bezel-inner p-[26px] text-center text-[13.5px] text-paper/55">There are no applicants for this role yet.</div>
            </div>
          ) : (
            <div className="aur-bezel">
              <div className="aur-bezel-inner px-[22px] py-5">
                <p className="text-sm font-semibold text-paper/75">Applicant statistics</p>
                <p className="text-xs text-paper/45 mt-[3px] mb-3.5">Click a bar to filter the list below</p>
                <div className={`aur-bars ${selected ? "has-sel" : ""}`}>
                  {chartData.map((d) => (
                    <button
                      key={d.status}
                      type="button"
                      onClick={() => setSelected(selected === d.status ? null : d.status)}
                      className={`aur-bar ${selected === d.status ? "on" : ""}`}
                      style={{ ["--c" as string]: GLASS_COLORS[d.status] }}
                      aria-pressed={selected === d.status}
                    >
                      <b>{d.count}</b>
                      <i style={{ height: d.count ? Math.max(4, Math.round((110 * d.count) / max)) : 4 }} />
                      <span>{d.status}</span>
                    </button>
                  ))}
                </div>
                {selected && (
                  <button onClick={() => setSelected(null)} className="text-xs underline underline-offset-[3px] text-apricot mt-2.5">
                    Clear filter
                  </button>
                )}
              </div>
            </div>
          )}

          {applicants.length > 0 && (
            <>
              <h2 className="font-display font-semibold text-xl mt-[26px] mb-3 text-paper">
                Applicants ({applicants.length})
                {selected && <span className="text-[13px] font-normal text-paper/50 font-sans"> — showing &quot;{selected}&quot;</span>}
              </h2>
              <div className="flex flex-col gap-2.5">
                {filtered.map((a) => (
                  <div key={a.id} className="aur-bezel-sm">
                    <div className="aur-bezel-inner flex items-center justify-between gap-3 px-[18px] py-[15px]">
                      <div className="min-w-0">
                        <Link href={`/company/candidates/${a.candidate_user_id}`} className="text-[14.5px] font-medium text-paper hover:underline">
                          {a.candidate_name || "(unnamed candidate)"}
                        </Link>
                        <div className="text-xs text-paper/50 mt-0.5">{a.candidate_title}</div>
                      </div>
                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        <StatusPill glass status={a.status} />
                        <Link href={`/thread/${a.id}`} prefetch={false} className="text-[12.5px] underline underline-offset-[3px] text-apricot whitespace-nowrap">
                          Chat →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-center py-8 text-paper/55">No applicants with status &quot;{selected}&quot;.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

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
