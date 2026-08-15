"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  New: "#B98B7C",
  Interviewing: "#C97D1B",
  Offer: "#5C7A5E",
  "Not moving forward": "#726A5B",
};

export default function StatusPieChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const router = useRouter();
  const nonZero = data.filter((d) => d.count > 0);
  if (nonZero.length === 0) return null;

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
