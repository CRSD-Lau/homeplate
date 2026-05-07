import { Trash2 } from "lucide-react";

import {
  deleteFoodLogAction,
  updateFoodLogQuantityAction,
} from "@/app/actions";
import { formatNumber } from "@/lib/units";

type MealReviewLog = {
  id: string;
  foodNameSnapshot: string;
  servingLabelSnapshot: string | null;
  quantity: number;
  caloriesSnapshot: number;
  proteinGSnapshot: number;
  carbsGSnapshot: number;
  fatGSnapshot: number;
};

export function MealReviewItem({
  log,
  returnTo,
}: {
  log: MealReviewLog;
  returnTo: string;
}) {
  return (
    <article className="border-b border-[var(--brand-line)] py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-extrabold text-[var(--brand-ink)]">
            {log.foodNameSnapshot}
          </h3>
          <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
            {formatNumber(log.caloriesSnapshot, 0)} cal · P{" "}
            {formatNumber(log.proteinGSnapshot, 0)}g · C{" "}
            {formatNumber(log.carbsGSnapshot, 0)}g · F{" "}
            {formatNumber(log.fatGSnapshot, 0)}g
          </p>
        </div>
        <form action={deleteFoodLogAction}>
          <input type="hidden" name="id" value={log.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="icon-button" type="submit" title="Delete food log">
            <Trash2 aria-hidden="true" size={17} />
          </button>
        </form>
      </div>
      <form
        action={updateFoodLogQuantityAction}
        className="mt-3 grid grid-cols-[minmax(0,1fr)_6rem] gap-3"
      >
        <input type="hidden" name="id" value={log.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="block">
          <span className="text-xs font-bold uppercase text-[var(--brand-muted)]">
            Serving
          </span>
          <input
            className="field mt-1"
            value={log.servingLabelSnapshot ?? "serving"}
            readOnly
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[var(--brand-muted)]">
            Qty
          </span>
          <input
            name="quantity"
            className="field mt-1"
            type="number"
            inputMode="decimal"
            min="0.1"
            step="0.1"
            defaultValue={log.quantity}
            aria-label="Quantity"
          />
        </label>
        <button type="submit" className="secondary-button col-span-2">
          Update quantity
        </button>
      </form>
    </article>
  );
}
