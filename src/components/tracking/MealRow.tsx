import Link from "next/link";
import { Check, Circle, Plus } from "lucide-react";

import { formatMealLabel, type ActiveMealType } from "@/lib/tracking";
import { formatNumber } from "@/lib/units";

export function MealRow({
  mealType,
  date,
  calories,
  itemCount,
}: {
  mealType: ActiveMealType;
  date: string;
  calories: number;
  itemCount: number;
}) {
  const logged = itemCount > 0;

  return (
    <div className="flex min-h-20 items-center gap-3 border-b border-[var(--brand-line)] py-3 last:border-b-0">
      <Link
        href={`/log/${mealType}/review?date=${date}`}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          logged
            ? "bg-[var(--brand-green)] text-white"
            : "bg-[var(--brand-soft)] text-[var(--brand-muted)]"
        }`}
        aria-label={`Review ${formatMealLabel(mealType)}`}
      >
        {logged ? <Check aria-hidden="true" size={26} /> : <Circle aria-hidden="true" size={24} />}
      </Link>
      <Link
        href={`/log/${mealType}/review?date=${date}`}
        className="min-w-0 flex-1"
      >
        <span className="block text-xl font-extrabold text-[var(--brand-ink)]">
          {formatMealLabel(mealType)}
        </span>
        <span className="text-sm font-medium text-[var(--brand-muted)]">
          {logged
            ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
            : "No foods logged"}
        </span>
      </Link>
      <span className="shrink-0 text-lg font-extrabold text-[var(--brand-ink)]">
        {calories > 0 ? `${formatNumber(calories, 0)} cal` : ""}
      </span>
      <Link
        href={`/log/${mealType}/add?date=${date}`}
        className="icon-button shrink-0"
        aria-label={`Add food to ${formatMealLabel(mealType)}`}
      >
        <Plus aria-hidden="true" size={22} />
      </Link>
    </div>
  );
}
