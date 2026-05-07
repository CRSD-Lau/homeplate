import { Plus } from "lucide-react";

import { logFoodAction } from "@/app/actions";
import { formatNumber } from "@/lib/units";

type FoodResult = {
  foodId: string;
  name: string;
  brand: string | null;
  servingId: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function FoodSearchResult({
  food,
  date,
  mealType,
  returnTo,
}: {
  food: FoodResult;
  date: string;
  mealType: string;
  returnTo: string;
}) {
  return (
    <article className="flex min-h-20 items-center gap-3 border-b border-[var(--brand-line)] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-lg font-extrabold text-[var(--brand-ink)]">
          {food.name}
        </h3>
        <p className="text-sm font-medium text-[var(--brand-muted)]">
          {food.brand ? `${food.brand} · ` : ""}
          {food.servingLabel}
        </p>
        <p className="text-xs font-semibold text-[var(--brand-muted)]">
          {formatNumber(food.calories, 0)} cal · P{" "}
          {formatNumber(food.proteinG, 0)}g · C {formatNumber(food.carbsG, 0)}g · F{" "}
          {formatNumber(food.fatG, 0)}g
        </p>
      </div>
      <form action={logFoodAction} className="shrink-0">
        <input type="hidden" name="logDate" value={date} />
        <input type="hidden" name="mealType" value={mealType} />
        <input
          type="hidden"
          name="foodServing"
          value={`${food.foodId}|${food.servingId}`}
        />
        <input type="hidden" name="quantity" value="1" />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="icon-button"
          aria-label={`Add ${food.name}`}
        >
          <Plus aria-hidden="true" size={21} />
        </button>
      </form>
    </article>
  );
}
