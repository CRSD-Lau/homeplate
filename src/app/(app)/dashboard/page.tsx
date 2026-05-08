import Link from "next/link";
import {
  Apple,
  Droplets,
  Dumbbell,
  HeartPulse,
  Settings,
  Utensils,
  Weight,
} from "lucide-react";

import { DayStrip } from "@/components/app/DayStrip";
import { ActionCard } from "@/components/ui/ActionCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDashboardData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import {
  normalizeDateInputValue,
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/dates";
import {
  formatGlucose,
  formatNumber,
  formatWater,
  formatWeight,
} from "@/lib/units";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const { date } = await searchParams;
  const selectedDate = normalizeDateInputValue(date, toDateInputValue());
  const data = await getDashboardData(user.id, selectedDate);
  const selectedDay = parseDateInputValue(data.today);
  const calorieTarget = data.dashboardPreferences.calorieTarget;
  const caloriesRemaining = calorieTarget
    ? Math.max(0, calorieTarget - data.nutrition.calories)
    : null;
  const caloriePercent = calorieTarget
    ? Math.round((data.nutrition.calories / calorieTarget) * 100)
    : null;
  const waterPercent = Math.min(
    100,
    Math.round((data.waterTotalMl / data.settings.dailyWaterGoalMl) * 100),
  );
  const selectedWeight = data.selectedWeight ?? null;

  return (
    <div className="space-y-5">
      <DayStrip
        selectedDate={data.today}
        loggedDates={data.loggedDates}
        basePath="/dashboard"
      />

      <section className="hp-card-lg p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hp-icon-chip bg-[var(--brand-teal)]">
              <Utensils aria-hidden="true" size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
                Daily progress
              </p>
              <p className="text-sm font-medium text-[var(--brand-muted)]">
                {selectedDay.toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="icon-button"
            aria-label="Open goals"
          >
            <Settings aria-hidden="true" size={18} />
          </Link>
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--brand-ink)]">
              Calories
            </p>
            <p className="text-4xl font-extrabold tracking-normal text-[var(--brand-ink)]">
              {formatNumber(data.nutrition.calories, 0)}
            </p>
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              {calorieTarget
                ? `of ${formatNumber(calorieTarget, 0)} cal`
                : "Set a target in Settings"}
            </p>
          </div>
          {caloriePercent !== null ? (
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[var(--brand-ink)]">
                {formatNumber(caloriePercent, 0)}%
              </p>
              <p className="text-sm font-medium text-[var(--brand-muted)]">
                of target
              </p>
            </div>
          ) : null}
        </div>

        <ProgressBar
          value={data.nutrition.calories}
          max={calorieTarget}
          color="var(--brand-teal)"
        />
        <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">
          {caloriesRemaining !== null
            ? `${formatNumber(caloriesRemaining, 0)} cal remaining`
            : "Add optional calorie and macro targets to unlock progress rings."}
        </p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--brand-line)] rounded-2xl border border-[var(--brand-line)] p-3">
          <MacroPanel
            label="Protein"
            value={data.nutrition.proteinG}
            target={data.dashboardPreferences.macroTargets.proteinG}
            color="var(--brand-teal)"
          />
          <MacroPanel
            label="Carbs"
            value={data.nutrition.carbsG}
            target={data.dashboardPreferences.macroTargets.carbsG}
            color="var(--brand-yellow)"
          />
          <MacroPanel
            label="Fat"
            value={data.nutrition.fatG}
            target={data.dashboardPreferences.macroTargets.fatG}
            color="var(--brand-coral)"
          />
        </div>
      </section>

      <section>
        <SectionHeading title="Today’s progress" />
        <div className="space-y-3">
          <ActionCard
            href={`/log?date=${data.today}`}
            icon={Apple}
            title="Log your meals"
            subtitle={`${data.mealCount} meal${data.mealCount === 1 ? "" : "s"} logged today`}
            color="var(--brand-teal)"
          />
          <ActionCard
            href="/weight"
            icon={Weight}
            title={selectedWeight ? "Weight logged" : "Log weight"}
            subtitle={
              selectedWeight
                ? `${formatWeight(selectedWeight.weightKg, data.settings.weightUnit)} · Today`
                : data.latestWeight
                  ? `Latest ${formatWeight(data.latestWeight.weightKg, data.settings.weightUnit)}`
                  : "Add your first weight entry"
            }
            color="var(--brand-green)"
          />
          <ActionCard
            href="/water"
            icon={Droplets}
            title="Stay hydrated"
            subtitle={`${formatWater(data.waterTotalMl, data.settings.waterUnit)} of ${formatWater(
              data.settings.dailyWaterGoalMl,
              data.settings.waterUnit,
            )} · ${waterPercent}%`}
            color="var(--brand-teal-light)"
            progress={{
              value: data.waterTotalMl,
              max: data.settings.dailyWaterGoalMl,
              color: "var(--brand-teal-light)",
            }}
          />
          <ActionCard
            href="/movement"
            icon={Dumbbell}
            title="Movement"
            subtitle={`${data.exerciseDurationMinutes} min · ${data.exerciseCalories} cal`}
            color="var(--brand-yellow)"
          />
          <ActionCard
            href="/health"
            icon={HeartPulse}
            title="Health check"
            subtitle={`${data.latestBloodPressure ? `BP ${data.latestBloodPressure.systolicMmhg} / ${data.latestBloodPressure.diastolicMmhg}` : "No BP yet"} · ${
              data.latestBloodGlucose
                ? `Glucose ${formatGlucose(
                    data.latestBloodGlucose.glucoseMmolL,
                    data.settings.bloodGlucoseUnit,
                  )}`
                : "No glucose yet"
            }`}
            color="var(--brand-coral)"
          />
        </div>
      </section>
    </div>
  );
}

function MacroPanel({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number | null;
  color: string;
}) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <p className="text-sm font-bold text-[var(--brand-ink)]">{label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
        {formatNumber(value, 0)}g
      </p>
      <p className="text-xs font-medium text-[var(--brand-muted)]">
        {target ? `of ${formatNumber(target, 0)}g` : "no target"}
      </p>
      <div className="mt-2">
        <ProgressBar value={value} max={target} color={color} />
      </div>
    </div>
  );
}
