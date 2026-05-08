import { Plus, Save, Search } from "lucide-react";

import {
  logFoodAction,
  saveOpenFoodFactsProductAction,
} from "@/app/actions";
import type { ParsedOpenFoodFactsProduct } from "@/lib/open-food-facts";
import { formatNumber } from "@/lib/units";

type BarcodeFood = {
  foodId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  confidenceStatus: string;
  servingId: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

export function BarcodeSearchForm({
  defaultBarcode,
  meal,
  date,
}: {
  defaultBarcode?: string | null;
  meal?: string | null;
  date?: string | null;
}) {
  return (
    <form action="/scan" className="hp-card-lg grid gap-3 p-4">
      {meal ? <input type="hidden" name="meal" value={meal} /> : null}
      {date ? <input type="hidden" name="date" value={date} /> : null}
      <label className="grid gap-2">
        <span className="text-sm font-extrabold text-[var(--brand-ink)]">
          Barcode
        </span>
        <input
          name="barcode"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={defaultBarcode ?? ""}
          placeholder="Enter UPC, EAN, or GTIN"
          className="field min-h-14 rounded-2xl"
        />
      </label>
      <button
        type="submit"
        className="primary-button inline-flex items-center justify-center gap-2"
      >
        <Search aria-hidden="true" size={18} />
        Look up barcode
      </button>
    </form>
  );
}

export function LocalBarcodeMatchCard({
  food,
  meal,
  date,
  returnTo,
}: {
  food: BarcodeFood;
  meal?: string | null;
  date?: string | null;
  returnTo: string;
}) {
  return (
    <article className="hp-card grid gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase text-[var(--brand-teal)]">
          Local match
        </p>
        <h2 className="mt-1 break-words text-xl font-extrabold text-[var(--brand-ink)]">
          {food.name}
        </h2>
        <p className="text-sm font-medium text-[var(--brand-muted)]">
          {food.brand ? `${food.brand} · ` : ""}
          {food.servingLabel}
        </p>
        <NutritionLine
          calories={food.calories}
          proteinG={food.proteinG}
          carbsG={food.carbsG}
          fatG={food.fatG}
          fibreG={food.fibreG}
          sugarG={food.sugarG}
          sodiumMg={food.sodiumMg}
        />
        <p className="mt-2 text-xs font-semibold text-[var(--brand-muted)]">
          {food.barcode ? `Barcode ${food.barcode} · ` : ""}
          {food.confidenceStatus}
        </p>
      </div>

      {meal && date ? (
        <form
          action={logFoodAction}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        >
          <input type="hidden" name="logDate" value={date} />
          <input type="hidden" name="mealType" value={meal} />
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
      ) : null}
    </article>
  );
}

export function LiveBarcodeReviewCard({
  product,
  barcode,
  returnTo,
}: {
  product: ParsedOpenFoodFactsProduct;
  barcode: string;
  returnTo: string;
}) {
  return (
    <article className="hp-card grid gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase text-[var(--brand-teal)]">
          Open Food Facts
        </p>
        <h2 className="mt-1 break-words text-xl font-extrabold text-[var(--brand-ink)]">
          {product.name}
        </h2>
        <p className="text-sm font-medium text-[var(--brand-muted)]">
          {product.brand ? `${product.brand} · ` : ""}
          {product.defaultServing.label}
        </p>
        <NutritionLine
          calories={product.nutrients.calories}
          proteinG={product.nutrients.proteinG}
          carbsG={product.nutrients.carbsG}
          fatG={product.nutrients.fatG}
          fibreG={product.nutrients.fibreG ?? null}
          sugarG={product.nutrients.sugarG ?? null}
          sodiumMg={product.nutrients.sodiumMg ?? null}
        />
      </div>

      {product.qualityWarnings.length > 0 ? (
        <div className="rounded-2xl border border-[var(--brand-coral)]/30 bg-[var(--brand-coral)]/10 px-3 py-2 text-sm font-bold text-[var(--brand-coral)]">
          <p>Quality warnings</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {product.qualityWarnings.map((warning) => (
              <li key={warning}>{warning.replace(/^en:/, "").replace(/-/g, " ")}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={saveOpenFoodFactsProductAction}>
        <input type="hidden" name="barcode" value={barcode} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          className="primary-button inline-flex w-full items-center justify-center gap-2"
        >
          <Save aria-hidden="true" size={18} />
          Save product
        </button>
      </form>
    </article>
  );
}

export function BarcodeFailureCard({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-[var(--brand-coral)]/30 bg-[var(--brand-coral)]/10 px-3 py-2 text-sm font-bold text-[var(--brand-coral)]">
      {message}
    </p>
  );
}

function NutritionLine({
  calories,
  proteinG,
  carbsG,
  fatG,
  fibreG,
  sugarG,
  sodiumMg,
}: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
}) {
  return (
    <p className="mt-2 text-xs font-semibold text-[var(--brand-muted)]">
      {formatNumber(calories, 0)} cal · P {formatNumber(proteinG, 0)}g · C{" "}
      {formatNumber(carbsG, 0)}g · F {formatNumber(fatG, 0)}g · Fibre{" "}
      {formatNumber(fibreG, 0)}g · Sugar {formatNumber(sugarG, 0)}g · Sodium{" "}
      {formatNumber(sodiumMg, 0)}mg
    </p>
  );
}
