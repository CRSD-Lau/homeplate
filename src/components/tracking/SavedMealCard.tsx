import {
  addSavedMealToLogAction,
  deleteSavedMealAction,
  toggleSavedMealFavoriteAction,
  updateSavedMealAction,
} from "@/app/actions";
import { Star } from "lucide-react";
import { ACTIVE_MEAL_TYPES, formatMealLabel } from "@/lib/tracking";
import { formatNumber } from "@/lib/units";

type SavedMeal = {
  id: string;
  name: string;
  mealType: string | null;
  isFavorite: boolean;
  notes: string | null;
  items: unknown[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
};

export function SavedMealCard({
  meal,
  date,
  mealType,
  returnTo,
}: {
  meal: SavedMeal;
  date: string;
  mealType: string;
  returnTo: string;
}) {
  return (
    <article className="hp-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2">
          <form action={toggleSavedMealFavoriteAction}>
            <input type="hidden" name="id" value={meal.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              className="icon-button"
              aria-label={
                meal.isFavorite
                  ? `Remove ${meal.name} from favourite meals`
                  : `Add ${meal.name} to favourite meals`
              }
            >
              <Star
                aria-hidden="true"
                size={19}
                fill={meal.isFavorite ? "currentColor" : "none"}
              />
            </button>
          </form>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-extrabold text-[var(--brand-ink)]">
              {meal.name}
            </h3>
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              {meal.items.length} item{meal.items.length === 1 ? "" : "s"}
              {meal.mealType ? ` · ${formatMealLabel(meal.mealType)}` : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-sm font-extrabold text-[var(--brand-teal)]">
          {formatNumber(meal.totals.calories, 0)} cal
        </span>
      </div>
      {meal.notes ? (
        <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">
          {meal.notes}
        </p>
      ) : null}
      <p className="mt-3 text-sm font-semibold text-[var(--brand-muted)]">
        P {formatNumber(meal.totals.proteinG, 0)}g · C{" "}
        {formatNumber(meal.totals.carbsG, 0)}g · F{" "}
        {formatNumber(meal.totals.fatG, 0)}g
      </p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <form action={addSavedMealToLogAction}>
          <input type="hidden" name="savedMealId" value={meal.id} />
          <input type="hidden" name="logDate" value={date} />
          <input type="hidden" name="mealType" value={mealType} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className="primary-button">
            Add all
          </button>
        </form>
        <form action={deleteSavedMealAction}>
          <input type="hidden" name="id" value={meal.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className="secondary-button text-[var(--brand-coral)]">
            Delete
          </button>
        </form>
      </div>
      <details className="mt-3">
        <summary className="secondary-button flex cursor-pointer list-none items-center justify-center">
          Edit saved meal
        </summary>
        <form action={updateSavedMealAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={meal.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Name</span>
            <input name="name" defaultValue={meal.name} required className="field mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">
              Default meal
            </span>
            <select name="mealType" defaultValue={meal.mealType ?? ""} className="field mt-1">
              <option value="">Any meal</option>
              {ACTIVE_MEAL_TYPES.map((option) => (
                <option key={option} value={option}>
                  {formatMealLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Notes</span>
            <textarea
              name="notes"
              rows={2}
              defaultValue={meal.notes ?? ""}
              className="field mt-1 min-h-20"
            />
          </label>
          <button type="submit" className="primary-button">
            Save changes
          </button>
        </form>
      </details>
    </article>
  );
}
