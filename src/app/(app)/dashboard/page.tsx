import { Droplets, Flame, HeartPulse, Salad, Timer, Weight } from "lucide-react";

import { PageHeader, Panel, StatCard } from "@/components/page-header";
import { TrendCharts } from "@/components/trend-charts";
import { getDashboardData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import {
  formatGlucose,
  formatHeight,
  formatNumber,
  formatWater,
  formatWeight,
} from "@/lib/units";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  const waterPercent = Math.min(
    100,
    Math.round((data.waterTotalMl / data.settings.dailyWaterGoalMl) * 100),
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today at a glance, with simple trends over the last 30 days."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Calories"
          value={formatNumber(data.nutrition.calories, 0)}
          detail={`${formatNumber(data.nutrition.proteinG, 0)}g protein`}
        />
        <StatCard
          label="Water"
          value={formatWater(data.waterTotalMl, data.settings.waterUnit)}
          detail={`${waterPercent}% of daily goal`}
        />
        <StatCard
          label="Latest Weight"
          value={
            data.latestWeight
              ? formatWeight(data.latestWeight.weightKg, data.settings.weightUnit)
              : "-"
          }
          detail={data.bmi ? `BMI ${formatNumber(data.bmi, 1)}` : "Add height and weight"}
        />
        <StatCard
          label="Exercise"
          value={`${data.exerciseDurationMinutes} min`}
          detail={`${data.exerciseCalories} calories logged`}
        />
      </div>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Nutrition">
          <Metric icon={Flame} label="Calories" value={data.nutrition.calories} />
          <Metric icon={Salad} label="Carbs" value={data.nutrition.carbsG} suffix="g" />
          <Metric icon={Salad} label="Protein" value={data.nutrition.proteinG} suffix="g" />
          <Metric icon={Salad} label="Fat" value={data.nutrition.fatG} suffix="g" />
          <Metric icon={Salad} label="Fibre" value={data.nutrition.fibreG ?? 0} suffix="g" />
          <Metric icon={Salad} label="Sugar" value={data.nutrition.sugarG ?? 0} suffix="g" />
          <Metric
            icon={Salad}
            label="Sodium"
            value={data.nutrition.sodiumMg ?? 0}
            suffix="mg"
          />
        </Panel>

        <Panel title="Body and Water">
          <Metric icon={Droplets} label="Water goal" value={waterPercent} suffix="%" />
          <Metric
            icon={Weight}
            label="Weight"
            text={
              data.latestWeight
                ? formatWeight(data.latestWeight.weightKg, data.settings.weightUnit)
              : "-"
            }
          />
          <Metric
            icon={Weight}
            label="Height"
            text={
              data.profile?.heightCm
                ? formatHeight(data.profile.heightCm, data.settings.heightUnit)
                : "-"
            }
          />
          <Metric
            icon={Weight}
            label="BMI"
            text={data.bmi ? formatNumber(data.bmi, 1) : "-"}
          />
        </Panel>

        <Panel title="Health Logs">
          <Metric icon={Timer} label="Exercise" value={data.exerciseDurationMinutes} suffix="min" />
          <Metric
            icon={HeartPulse}
            label="Blood pressure"
            text={
              data.latestBloodPressure
                ? `${data.latestBloodPressure.systolicMmhg}/${data.latestBloodPressure.diastolicMmhg} mmHg`
                : "-"
            }
          />
          <Metric
            icon={HeartPulse}
            label="Blood glucose"
            text={
              data.latestBloodGlucose
                ? formatGlucose(
                    data.latestBloodGlucose.glucoseMmolL,
                    data.settings.bloodGlucoseUnit,
                  )
                : "-"
            }
          />
        </Panel>
      </section>

      <div className="mt-5">
        <TrendCharts data={data.trends} />
      </div>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix = "",
  text,
}: {
  icon: typeof Flame;
  label: string;
  value?: number;
  suffix?: string;
  text?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Icon aria-hidden="true" size={16} />
        <span>{label}</span>
      </div>
      <span className="font-medium text-slate-950">
        {text ?? `${formatNumber(value ?? 0, suffix === "%" ? 0 : 1)}${suffix}`}
      </span>
    </div>
  );
}
