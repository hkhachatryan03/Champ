"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

export default function StatusPieChart({
  data,
  glass = false,
}: {
  data: { status: string; count: number }[];
  /** Dark "Ethereal Glass" look. Default = original light card. */
  glass?: boolean;
}) {
  const router = useRouter();
  const nonZero = data.filter((d) => d.count > 0);
  if (nonZero.length === 0) return null;

  if (glass) {
    const total = data.reduce((n, d) => n + d.count, 0);
    return (
      <div className="aur-bezel-sm">
        <div className="aur-bezel-inner flex items-center gap-[18px] px-4 py-2.5 max-md:flex-col max-md:items-start max-md:gap-3">
          <div className="relative flex-shrink-0" style={{ width: 58, height: 58 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={nonZero}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={18}
                  outerRadius={28}
                  paddingAngle={3}
                  stroke="none"
                  cursor="pointer"
                  onClick={(entry: unknown) =>
                    router.push(`/candidate/applications?status=${encodeURIComponent((entry as { status: string }).status)}`)
                  }
                >
                  {nonZero.map((entry) => (
                    <Cell key={entry.status} fill={GLASS_COLORS[entry.status] || "#C9A28F"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#15181d", border: "1px solid rgba(250,246,238,.16)", borderRadius: 12, fontSize: 12 }}
                  itemStyle={{ color: "#FAF6EE" }}
                  labelStyle={{ color: "#FAF6EE" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center font-display font-semibold text-[19px] text-paper pointer-events-none">
              {total}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {data.map((d) => (
              <button
                key={d.status}
                onClick={() => router.push(`/candidate/applications?status=${encodeURIComponent(d.status)}`)}
                disabled={d.count === 0}
                className="flex items-center gap-[9px] px-[13px] py-2 rounded-full bg-paper/[.04] border border-paper/10 text-[13px] text-left transition-[border-color,background,transform] duration-300 enabled:hover:border-apricot/45 enabled:hover:bg-apricot/[.07] enabled:hover:-translate-y-px disabled:opacity-40 disabled:cursor-default"
              >
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: GLASS_COLORS[d.status] || "#C9A28F" }} />
                <span className="text-paper/70">{d.status}</span>
                <span className="font-mono-num text-paper">{d.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-line bg-white mb-6">
      <div style={{ width: 110, height: 110 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={nonZero}
              dataKey="count"
              nameKey="status"
              innerRadius={28}
              outerRadius={50}
              paddingAngle={2}
              cursor="pointer"
              onClick={(entry: any) =>
                router.push(`/candidate/applications?status=${encodeURIComponent(entry.status)}`)
              }
            >
              {nonZero.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] || "#B98B7C"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <button
            key={d.status}
            onClick={() => router.push(`/candidate/applications?status=${encodeURIComponent(d.status)}`)}
            className="flex items-center gap-2 text-sm text-left"
            disabled={d.count === 0}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: COLORS[d.status] || "#B98B7C" }}
            />
            <span className="text-muted">{d.status}:</span>
            <span className="font-medium">{d.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
