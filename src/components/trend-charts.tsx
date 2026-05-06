"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  date: string;
  calories: number;
  waterMl: number;
  exerciseMinutes: number;
  exerciseCalories: number;
  weightKg: number | null;
  bmi: number | null;
  systolic: number | null;
  diastolic: number | null;
  glucoseMmolL: number | null;
};

export function TrendCharts({ data }: { data: TrendPoint[] }) {
  const compactData = data.map((point) => ({
    ...point,
    label: point.date.slice(5),
    bmi: point.bmi ? Number(point.bmi.toFixed(1)) : null,
    weightKg: point.weightKg ? Number(point.weightKg.toFixed(1)) : null,
    glucoseMmolL: point.glucoseMmolL
      ? Number(point.glucoseMmolL.toFixed(1))
      : null,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartPanel title="Calories">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Bar dataKey="calories" fill="#256f5b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Water">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Bar dataKey="waterMl" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Weight and BMI">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="#0f766e"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="bmi"
              stroke="#d97706"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Exercise">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Bar
              dataKey="exerciseMinutes"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Blood Pressure">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#ea580c"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Blood Glucose">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={compactData}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={44} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="glucoseMmolL"
              stroke="#be123c"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}
