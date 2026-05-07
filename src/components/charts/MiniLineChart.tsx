"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = Record<string, number | string | null>;

export function MiniLineChart({
  data,
  lines,
  height = 96,
}: {
  data: ChartPoint[];
  lines: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--brand-muted)" }}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          cursor={false}
          contentStyle={{
            border: "1px solid var(--brand-line)",
            borderRadius: 12,
            background: "var(--brand-card)",
            color: "var(--brand-ink)",
          }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2.5}
            dot={{ r: 2.5, strokeWidth: 2, fill: "var(--brand-card)" }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
