import { Plus, Star } from "lucide-react";

import { logFoodAction, toggleFoodFavoriteAction } from "@/app/actions";
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
  isFavorite: boolean;
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
    <article className="grid min-h-20 grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-[var(--brand-line)] py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <form action={toggleFoodFavoriteAction} className="pt-1">
        <input type="hidden" name="foodId" value={food.foodId} />
        <input type="hidden" name="servingId" value={food.servingId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="icon-button"
          aria-label={
            food.isFavorite
              ? `Remove ${food.name} from favourites`
              : `Add ${food.name} to favourites`
          }
        >
          <Star
            aria-hidden="true"
            size={20}
            fill={food.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </form>
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
      <form
        action={logFoodAction}
        className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:col-span-1 sm:min-w-44"
      >
        <input type="hidden" name="logDate" value={date} />
        <input type="hidden" name="mealType" value={mealType} />
        <input
          type="hidden"
          name="foodServing"
          value={`${food.foodId}|${food.servingId}`}
        />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="min-w-0">
          <span className="sr-only">Quantity</span>
          <input
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0.25"
            defaultValue="1"
            className="field min-h-11 rounded-2xl text-center"
          />
        </label>
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
