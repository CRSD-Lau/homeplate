import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { updateManualFoodAction } from "@/app/actions";
import { formatNumber } from "@/lib/units";

type FoodCardProps = {
  food: {
    foodId: string;
    name: string;
    brand: string | null;
    foodType: string;
    confidenceStatus: string;
    servingId: string;
    servingLabel: string;
    grams: number | null;
    millilitres: number | null;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fibreG: number | null;
    sugarG: number | null;
    sodiumMg: number | null;
  };
};

export function FoodCard({ food }: FoodCardProps) {
  const editable = food.foodType === "manual" || food.confidenceStatus === "manual";

  return (
    <article className="hp-card overflow-hidden">
      <div className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
              {food.name}
            </p>
            {food.brand ? (
              <p className="break-words text-sm font-semibold text-[var(--brand-muted)]">
                {food.brand}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold capitalize text-[var(--brand-teal)]">
            {food.confidenceStatus.replace("_", " ")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <FoodDetail label="Calories" value={`${formatNumber(food.calories, 0)} kcal`} />
          <FoodDetail
            label="Macros"
            value={`P ${formatNumber(food.proteinG, 0)}g · C ${formatNumber(food.carbsG, 0)}g · F ${formatNumber(food.fatG, 0)}g`}
          />
          <FoodDetail
            label="Serving"
            value={`${food.servingLabel}${food.grams ? ` · ${formatNumber(food.grams, 0)}g` : ""}${food.millilitres ? ` · ${formatNumber(food.millilitres, 0)}ml` : ""}`}
          />
          <FoodDetail
            label="Extra"
            value={`Fiber ${formatNumber(food.fibreG ?? 0, 0)}g · Sugar ${formatNumber(food.sugarG ?? 0, 0)}g`}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/log?meal=breakfast&foodServing=${encodeURIComponent(
              `${food.foodId}|${food.servingId}`,
            )}`}
            className="secondary-button inline-flex items-center justify-center gap-2"
          >
            <Plus aria-hidden="true" size={17} />
            Log
          </Link>
          {editable ? (
            <details className="group">
              <summary className="secondary-button flex cursor-pointer list-none items-center justify-center gap-2 text-center">
                <Pencil aria-hidden="true" size={17} />
                Edit
              </summary>
              <form action={updateManualFoodAction} className="mt-4 space-y-3">
                <input type="hidden" name="foodId" value={food.foodId} />
                <FoodField label="Food name">
                  <input name="name" defaultValue={food.name} required className="field" />
                </FoodField>
                <FoodField label="Brand">
                  <input name="brand" defaultValue={food.brand ?? ""} className="field" />
                </FoodField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FoodField label="Serving label">
                    <input
                      name="servingLabel"
                      defaultValue={food.servingLabel}
                      required
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Grams">
                    <input
                      name="grams"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.grams ?? ""}
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Millilitres">
                    <input
                      name="millilitres"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.millilitres ?? ""}
                      className="field"
                    />
                  </FoodField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FoodField label="Calories">
                    <input
                      name="calories"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.calories}
                      required
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Protein g">
                    <input
                      name="proteinG"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.proteinG}
                      required
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Carbs g">
                    <input
                      name="carbsG"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.carbsG}
                      required
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Fat g">
                    <input
                      name="fatG"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.fatG}
                      required
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Fibre g">
                    <input
                      name="fibreG"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.fibreG ?? ""}
                      className="field"
                    />
                  </FoodField>
                  <FoodField label="Sugar g">
                    <input
                      name="sugarG"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      defaultValue={food.sugarG ?? ""}
                      className="field"
                    />
                  </FoodField>
                </div>
                <FoodField label="Sodium mg">
                  <input
                    name="sodiumMg"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    defaultValue={food.sodiumMg ?? ""}
                    className="field"
                  />
                </FoodField>
                <button type="submit" className="primary-button">
                  Save food
                </button>
              </form>
            </details>
          ) : (
            <span className="secondary-button inline-flex items-center justify-center text-[var(--brand-muted)]">
              Locked
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FoodDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--brand-soft)] p-3">
      <p className="text-xs font-bold uppercase text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-[var(--brand-ink)]">
        {value}
      </p>
    </div>
  );
}

function FoodField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold text-[var(--brand-ink)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
