import Link from "next/link";
import { BarChart3, CheckCircle2, Search } from "lucide-react";

import { MealRow } from "@/components/tracking/MealRow";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { getFoodLogPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { normalizeDateInputValue } from "@/lib/dates";
import {
  ACTIVE_MEAL_TYPES,
  formatMealLabel,
  normalizeMealType,
} from "@/lib/tracking";
import { formatNumber } from "@/lib/units";

export default async function FoodLogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const selectedDate = normalizeDateInputValue(params.date);
  const data = await getFoodLogPageData(user.id, selectedDate);

  return (
    <TrackingPageShell
      title="Today"
      eyebrow={data.date}
      action={
        <span className="text-right text-lg font-extrabold text-[var(--brand-ink)]">
          {formatNumber(data.nutrition.calories, 0)} cal
        </span>
      }
    >
      <form
        action="/log"
        className="mx-auto flex min-h-14 max-w-sm items-center gap-2 rounded-full border border-[var(--brand-line)] bg-[var(--brand-card)] px-4 shadow-sm"
      >
        <input
          name="date"
          type="date"
          defaultValue={data.date}
          className="min-h-11 flex-1 bg-transparent text-center font-bold text-[var(--brand-ink)] outline-none"
        />
        <button
          type="submit"
          className="min-h-11 min-w-12 rounded-full px-3 text-sm font-bold text-[var(--brand-teal)] hover:bg-[var(--brand-soft)]"
        >
          Go
        </button>
      </form>

      <section className="hp-card p-4">
        {ACTIVE_MEAL_TYPES.map((mealType) => {
          const logs = data.logs.filter(
            (log) => normalizeMealType(log.mealType) === mealType,
          );
          return (
            <MealRow
              key={mealType}
              mealType={mealType}
              date={data.date}
              calories={data.mealTotals.byMeal[mealType].calories}
              itemCount={logs.length}
            />
          );
        })}
      </section>

      <section className="hp-card p-4">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
          Quick add
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={`/log/breakfast/add?date=${data.date}`}
            className="secondary-button flex items-center justify-center gap-2"
          >
            <Search aria-hidden="true" size={18} />
            Search foods
          </Link>
          <Link
            href="/foods"
            className="secondary-button flex items-center justify-center gap-2"
          >
            Create manual food
          </Link>
        </div>
        {data.recentFoods.length > 0 ? (
          <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2">
            {data.recentFoods.map((food) => (
              <Link
                key={`${food.foodId}|${food.servingId}`}
                href={`/log/breakfast/add?date=${data.date}&q=${encodeURIComponent(
                  food.foodName,
                )}`}
                className="hp-card min-w-40 p-3"
              >
                <p className="line-clamp-2 text-sm font-extrabold text-[var(--brand-ink)]">
                  {food.foodName}
                </p>
                <p className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">
                  {formatNumber(food.calories, 0)} cal
                </p>
                <p className="text-xs font-medium text-[var(--brand-muted)]">
                  Default meal: {formatMealLabel("breakfast")}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/health"
          className="secondary-button flex min-h-14 items-center justify-center gap-2"
        >
          <BarChart3 aria-hidden="true" size={19} />
          View analysis
        </Link>
        <Link
          href="/dashboard"
          className="primary-button flex min-h-14 items-center justify-center gap-2"
        >
          <CheckCircle2 aria-hidden="true" size={19} />
          Finish day
        </Link>
      </div>
    </TrackingPageShell>
  );
}
