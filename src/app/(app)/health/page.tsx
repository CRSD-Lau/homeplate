import Link from "next/link";
import {
  Activity,
  Droplets,
  Flame,
  HeartPulse,
  Scale,
  Trash2,
  Weight,
} from "lucide-react";

import {
  deleteBloodGlucoseLogAction,
  deleteBloodPressureLogAction,
  logBloodGlucoseAction,
  logBloodPressureAction,
  logExerciseAction,
  logWaterAction,
  logWeightAction,
} from "@/app/actions";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import { MiniLineChart } from "@/components/charts/MiniLineChart";
import { FormMessage } from "@/components/form-message";
import { HealthQuickLogCard } from "@/components/health/HealthQuickLogCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendCard } from "@/components/ui/TrendCard";
import { getHealthPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { formatMealLabel } from "@/lib/tracking";
import {
  formatGlucose,
  formatNumber,
  formatWater,
  formatWeight,
  kgToLb,
  mmolLToMgDl,
} from "@/lib/units";

const tabs = ["trends", "logs", "insights"] as const;

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const data = await getHealthPageData(user.id);
  const params = await searchParams;
  const activeTab = tabs.includes(params.tab as (typeof tabs)[number])
    ? (params.tab as (typeof tabs)[number])
    : "trends";

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="hp-display text-3xl md:text-4xl">Health</h1>
      </div>

      <nav className="grid grid-cols-3 gap-2 border-b border-[var(--brand-line)]">
        <HealthTab href="/health?tab=trends" active={activeTab === "trends"}>
          Trends
        </HealthTab>
        <HealthTab href="/health?tab=logs" active={activeTab === "logs"}>
          Health Logs
        </HealthTab>
        <HealthTab href="/health?tab=insights" active={activeTab === "insights"}>
          Insights
        </HealthTab>
      </nav>

      <FormMessage
        error={params.error}
        saved={params.saved}
        savedText={savedText(params.saved)}
      />

      {activeTab === "trends" ? <TrendsTab data={data} /> : null}
      {activeTab === "logs" ? <LogsTab data={data} /> : null}
      {activeTab === "insights" ? <InsightsTab data={data} /> : null}
    </div>
  );
}

function TrendsTab({ data }: { data: Awaited<ReturnType<typeof getHealthPageData>> }) {
  const seven = data.trends.slice(-7);
  const labels = seven.map((point) =>
    new Date(`${point.date}T00:00:00`).toLocaleDateString("en-CA", {
      weekday: "short",
    }).charAt(0),
  );
  const latestWeight = [...seven].reverse().find((point) => point.weightKg !== null);
  const firstWeight = seven.find((point) => point.weightKg !== null);
  const weightDiffKg =
    latestWeight?.weightKg !== null &&
    latestWeight?.weightKg !== undefined &&
    firstWeight?.weightKg !== null &&
    firstWeight?.weightKg !== undefined
      ? latestWeight.weightKg - firstWeight.weightKg
      : null;
  const weightDiff =
    weightDiffKg === null
      ? null
      : data.settings.weightUnit === "lb"
        ? kgToLb(weightDiffKg)
        : weightDiffKg;
  const caloriesAverage =
    seven.reduce((total, point) => total + point.calories, 0) / Math.max(seven.length, 1);
  const waterAverage =
    seven.reduce((total, point) => total + point.waterMl, 0) / Math.max(seven.length, 1);
  const exerciseTotal = seven.reduce(
    (total, point) => total + point.exerciseMinutes,
    0,
  );
  const latestBp = data.bloodPressure[0] ?? null;
  const latestGlucose = data.bloodGlucose[0] ?? null;

  const chartData = seven.map((point, index) => ({
    label: labels[index],
    weight:
      point.weightKg === null
        ? null
        : data.settings.weightUnit === "lb"
          ? Number(kgToLb(point.weightKg).toFixed(1))
          : Number(point.weightKg.toFixed(1)),
    bmi: point.bmi ? Number(point.bmi.toFixed(1)) : null,
    systolic: point.systolic,
    diastolic: point.diastolic,
    glucose:
      point.glucoseMmolL === null
        ? null
        : data.settings.bloodGlucoseUnit === "mg_dl"
          ? Number(mmolLToMgDl(point.glucoseMmolL).toFixed(0))
          : Number(point.glucoseMmolL.toFixed(1)),
  }));

  return (
    <div className="space-y-3">
      <TrendCard
        icon={Weight}
        title="Weight"
        value={
          latestWeight?.weightKg
            ? formatWeight(latestWeight.weightKg, data.settings.weightUnit)
            : "-"
        }
        detail={
          weightDiff === null
            ? "Add weight logs to see change"
            : `${formatNumber(weightDiff, 1)} ${data.settings.weightUnit} · past 7 days`
        }
        color="var(--brand-teal)"
      >
        <MiniLineChart
          data={chartData}
          lines={[{ key: "weight", color: "var(--brand-teal)" }]}
        />
      </TrendCard>

      {latestWeight?.bmi ? (
        <TrendCard
          icon={Scale}
          title="BMI"
          value={formatNumber(latestWeight.bmi, 1)}
          detail="Latest calculated value"
          color="var(--brand-green)"
        >
          <MiniLineChart
            data={chartData}
            lines={[{ key: "bmi", color: "var(--brand-green)" }]}
          />
        </TrendCard>
      ) : null}

      <TrendCard
        icon={Flame}
        title="Calories"
        value={`${formatNumber(caloriesAverage, 0)} cal`}
        detail="7-day average"
        color="var(--brand-coral)"
      >
        <MiniBarChart
          data={seven.map((point, index) => ({
            label: labels[index],
            value: point.calories,
          }))}
          color="var(--brand-coral)"
        />
      </TrendCard>

      <TrendCard
        icon={Droplets}
        title="Water"
        value={formatWater(waterAverage, data.settings.waterUnit)}
        detail={`Avg · goal ${formatWater(
          data.settings.dailyWaterGoalMl,
          data.settings.waterUnit,
        )}`}
        color="var(--brand-teal-light)"
      >
        <MiniBarChart
          data={seven.map((point, index) => ({
            label: labels[index],
            value: point.waterMl,
            color:
              point.waterMl >= data.settings.dailyWaterGoalMl
                ? "var(--brand-teal)"
                : "var(--brand-teal-light)",
          }))}
          color="var(--brand-teal-light)"
        />
      </TrendCard>

      <TrendCard
        icon={Activity}
        title="Movement"
        value={`${formatNumber(exerciseTotal, 0)} min`}
        detail="7-day total"
        color="var(--brand-green)"
      >
        <MiniBarChart
          data={seven.map((point, index) => ({
            label: labels[index],
            value: point.exerciseMinutes,
          }))}
          color="var(--brand-green)"
        />
      </TrendCard>

      <TrendCard
        icon={HeartPulse}
        title="Blood pressure"
        value={latestBp ? `${latestBp.systolicMmhg} / ${latestBp.diastolicMmhg}` : "-"}
        detail={latestBp ? `Latest · ${latestBp.logDate}` : "No entries yet"}
        color="var(--brand-coral)"
      >
        <MiniLineChart
          data={chartData}
          lines={[
            { key: "systolic", color: "var(--brand-coral)" },
            { key: "diastolic", color: "var(--brand-teal-light)" },
          ]}
        />
      </TrendCard>

      <TrendCard
        icon={Droplets}
        title="Blood glucose"
        value={
          latestGlucose
            ? formatGlucose(latestGlucose.glucoseMmolL, data.settings.bloodGlucoseUnit)
            : "-"
        }
        detail={latestGlucose ? `Latest · ${latestGlucose.logDate}` : "No entries yet"}
        color="var(--brand-yellow)"
      >
        <MiniLineChart
          data={chartData}
          lines={[{ key: "glucose", color: "var(--brand-yellow)" }]}
        />
      </TrendCard>
    </div>
  );
}

function LogsTab({ data }: { data: Awaited<ReturnType<typeof getHealthPageData>> }) {
  const isLb = data.settings.weightUnit === "lb";

  return (
    <div className="space-y-3">
      <HealthQuickLogCard title="Weight" description="Add a body weight entry.">
        <form action={logWeightAction} className="space-y-3">
          <input type="hidden" name="returnTo" value="/health?tab=logs&saved=weight" />
          <Field label="Date">
            <input name="logDate" type="date" defaultValue={toDateInputValue()} required className="field" />
          </Field>
          <Field label={`Weight (${data.settings.weightUnit})`}>
            <input
              name="entryWeightValue"
              type="number"
              inputMode="decimal"
              min={isLb ? 50 : 20}
              max={isLb ? 800 : 360}
              step="0.1"
              required
              className="field"
            />
            <input name="entryWeightUnit" type="hidden" value={data.settings.weightUnit} />
          </Field>
          <button type="submit" className="primary-button">Save weight</button>
        </form>
      </HealthQuickLogCard>

      <HealthQuickLogCard title="Water" description="Log hydration in your preferred unit.">
        <form action={logWaterAction} className="space-y-3">
          <input type="hidden" name="returnTo" value="/health?tab=logs&saved=water" />
          <Field label="Date">
            <input name="logDate" type="date" defaultValue={toDateInputValue()} required className="field" />
          </Field>
          <Field label={`Amount (${waterUnitLabel(data.settings.waterUnit)})`}>
            <input name="entryAmount" type="number" inputMode="decimal" min="0.1" step="0.1" required className="field" />
            <input name="entryUnit" type="hidden" value={data.settings.waterUnit} />
          </Field>
          <button type="submit" className="primary-button">Save water</button>
        </form>
      </HealthQuickLogCard>

      <HealthQuickLogCard title="Movement" description="Track minutes and optional calories.">
        <form action={logExerciseAction} className="space-y-3">
          <input type="hidden" name="returnTo" value="/health?tab=logs&saved=movement" />
          <Field label="Date">
            <input name="logDate" type="date" defaultValue={toDateInputValue()} required className="field" />
          </Field>
          <Field label="Activity">
            <input name="activity" required className="field" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minutes">
              <input name="durationMinutes" type="number" inputMode="numeric" step="1" className="field" />
            </Field>
            <Field label="Calories">
              <input name="caloriesBurned" type="number" inputMode="numeric" step="1" className="field" />
            </Field>
          </div>
          <button type="submit" className="primary-button">Save movement</button>
        </form>
      </HealthQuickLogCard>

      <HealthQuickLogCard title="Blood pressure" description="Store raw readings only.">
        <form action={logBloodPressureAction} className="space-y-3">
          <input type="hidden" name="returnTo" value="/health?tab=logs&saved=pressure" />
          <Field label="Date">
            <input name="logDate" type="date" defaultValue={toDateInputValue()} required className="field" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Systolic">
              <input name="systolicMmhg" type="number" inputMode="numeric" required className="field" />
            </Field>
            <Field label="Diastolic">
              <input name="diastolicMmhg" type="number" inputMode="numeric" required className="field" />
            </Field>
            <Field label="Pulse">
              <input name="pulseBpm" type="number" inputMode="numeric" className="field" />
            </Field>
          </div>
          <button type="submit" className="primary-button">Save blood pressure</button>
        </form>
      </HealthQuickLogCard>

      <HealthQuickLogCard title="Blood glucose" description="Store raw glucose readings only.">
        <form action={logBloodGlucoseAction} className="space-y-3">
          <input type="hidden" name="returnTo" value="/health?tab=logs&saved=glucose" />
          <Field label="Date">
            <input name="logDate" type="date" defaultValue={toDateInputValue()} required className="field" />
          </Field>
          <Field label={`Glucose (${glucoseUnitLabel(data.settings.bloodGlucoseUnit)})`}>
            <input
              name="entryValue"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={data.settings.bloodGlucoseUnit === "mmol_l" ? 1 : 18}
              max={data.settings.bloodGlucoseUnit === "mmol_l" ? 35 : 630}
              required
              className="field"
            />
            <input name="entryUnit" type="hidden" value={data.settings.bloodGlucoseUnit} />
          </Field>
          <Field label="Context">
            <select name="context" defaultValue="other" className="field">
              <option value="fasting">Fasting</option>
              <option value="before_meal">Before meal</option>
              <option value="after_meal">After meal</option>
              <option value="bedtime">Bedtime</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <button type="submit" className="primary-button">Save blood glucose</button>
        </form>
      </HealthQuickLogCard>

      <History title="Blood pressure history">
        {data.bloodPressure.length === 0 ? (
          <EmptyState title="No blood pressure logs yet." />
        ) : (
          data.bloodPressure.slice(0, 8).map((log) => (
            <HistoryRow
              key={log.id}
              id={log.id}
              title={`${log.systolicMmhg}/${log.diastolicMmhg} mmHg`}
              detail={`${log.logDate}${log.pulseBpm ? ` · ${log.pulseBpm} bpm` : ""}`}
              action={deleteBloodPressureLogAction}
            />
          ))
        )}
      </History>

      <History title="Blood glucose history">
        {data.bloodGlucose.length === 0 ? (
          <EmptyState title="No blood glucose logs yet." />
        ) : (
          data.bloodGlucose.slice(0, 8).map((log) => (
            <HistoryRow
              key={log.id}
              id={log.id}
              title={formatGlucose(log.glucoseMmolL, data.settings.bloodGlucoseUnit)}
              detail={`${log.logDate} · ${log.context.replaceAll("_", " ")}`}
              action={deleteBloodGlucoseLogAction}
            />
          ))
        )}
      </History>
    </div>
  );
}

function InsightsTab({ data }: { data: Awaited<ReturnType<typeof getHealthPageData>> }) {
  const insightRows = [
    `You logged weight ${data.insights.weightEntries} time${
      data.insights.weightEntries === 1 ? "" : "s"
    } this week.`,
    `Average daily water: ${formatWater(
      data.insights.averageDailyWaterMl,
      data.settings.waterUnit,
    )}.`,
    data.insights.mostConsistentMeal
      ? `Most consistent meal logged: ${formatMealLabel(
          data.insights.mostConsistentMeal,
        )}.`
      : "No meals logged this week yet.",
    `Movement logged on ${data.insights.exerciseDays} day${
      data.insights.exerciseDays === 1 ? "" : "s"
    }.`,
    `Blood pressure entries: ${data.insights.bloodPressureEntries} this week.`,
    `Blood glucose entries: ${data.insights.bloodGlucoseEntries} this week.`,
  ];

  return (
    <div className="space-y-3">
      {insightRows.map((text) => (
        <div key={text} className="hp-card p-4">
          <p className="text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}

function HealthTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`min-h-14 whitespace-nowrap border-b-4 px-1 py-3 text-center text-base font-extrabold transition sm:text-lg ${
        active
          ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
          : "border-transparent text-[var(--brand-muted)]"
      }`}
    >
      {children}
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[var(--brand-ink)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function History({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hp-card p-4">
      <h2 className="mb-3 text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function HistoryRow({
  id,
  title,
  detail,
  action,
}: {
  id: string;
  title: string;
  detail: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--brand-line)] p-3">
      <div className="min-w-0">
        <p className="break-words font-bold text-[var(--brand-ink)]">{title}</p>
        <p className="text-sm font-medium text-[var(--brand-muted)]">{detail}</p>
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button className="icon-button" type="submit" title="Delete health log">
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </form>
    </div>
  );
}

function glucoseUnitLabel(unit: "mmol_l" | "mg_dl") {
  return unit === "mmol_l" ? "mmol/L" : "mg/dL";
}

function waterUnitLabel(unit: "ml" | "oz" | "cups") {
  return unit === "cups" ? "cups" : unit;
}

function savedText(saved: string | undefined) {
  if (saved === "weight") return "Weight saved.";
  if (saved === "water") return "Water saved.";
  if (saved === "movement" || saved === "exercise") return "Movement saved.";
  if (saved === "pressure") return "Blood pressure saved.";
  if (saved === "glucose") return "Blood glucose saved.";
  return "Saved.";
}
