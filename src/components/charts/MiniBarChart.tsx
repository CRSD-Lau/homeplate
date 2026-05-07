"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MiniBarChart({
  data,
  color = "var(--brand-coral)",
  height = 96,
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--brand-muted)" }}
        />
        <YAxis hide />
        <Tooltip
          cursor={false}
          contentStyle={{
            border: "1px solid var(--brand-line)",
            borderRadius: 12,
            background: "var(--brand-card)",
            color: "var(--brand-ink)",
          }}
        />
        <Bar dataKey="value" radius={[8, 8, 2, 2]} fill={color}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
