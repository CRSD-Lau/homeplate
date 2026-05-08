import { createManualFoodAction } from "@/app/actions";
import { FoodCard } from "@/components/foods/FoodCard";
import { FoodSearch } from "@/components/foods/FoodSearch";
import { FormMessage } from "@/components/form-message";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFoodsPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";

const sources = ["all", "manual", "verified", "provisional"] as const;

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    source?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.q ?? "";
  const source = sources.includes(params.source as (typeof sources)[number])
    ? (params.source as (typeof sources)[number])
    : "all";
  const foods = await getFoodsPageData({ query, source, userId: user.id });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="hp-display text-3xl md:text-4xl">Foods</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[var(--brand-muted)]">
          Search, create, edit, and log household foods without desktop tables.
        </p>
      </div>

      <FormMessage
        error={params.error}
        saved={params.saved}
        savedText="Food saved."
      />

      <FoodSearch query={query} source={source} />

      <section className="hp-card-lg p-4">
        <details>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
                Manual food
              </span>
              <span className="text-sm font-medium text-[var(--brand-muted)]">
                Add a private household food.
              </span>
            </span>
            <span className="secondary-button inline-flex items-center">Create</span>
          </summary>
          <form action={createManualFoodAction} className="mt-4 space-y-3">
            <Field label="Food name">
              <input name="name" required className="field" />
            </Field>
            <Field label="Brand">
              <input name="brand" className="field" />
            </Field>
            <Field label="Aliases">
              <textarea
                name="aliases"
                rows={2}
                className="field min-h-20"
                placeholder="yogurt, yoghurt, breakfast oats"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Serving label">
                <input name="servingLabel" defaultValue="1 serving" required className="field" />
              </Field>
              <Field label="Grams">
                <input name="grams" type="number" inputMode="decimal" step="0.1" className="field" />
              </Field>
              <Field label="Millilitres">
                <input
                  name="millilitres"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="field"
                />
              </Field>
            </div>
            <Field label="Additional servings">
              <textarea
                name="servingOptions"
                rows={3}
                className="field min-h-24"
                placeholder={"1 cup, 240g\nLarge bowl, 480ml\n1 oz, 28.35g"}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories">
                <input
                  name="calories"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Protein g">
                <input
                  name="proteinG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Carbs g">
                <input
                  name="carbsG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Fat g">
                <input
                  name="fatG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Fibre g">
                <input name="fibreG" type="number" inputMode="decimal" step="0.1" className="field" />
              </Field>
              <Field label="Sugar g">
                <input name="sugarG" type="number" inputMode="decimal" step="0.1" className="field" />
              </Field>
            </div>
            <Field label="Sodium mg">
              <input name="sodiumMg" type="number" inputMode="numeric" step="1" className="field" />
            </Field>
            <button className="primary-button" type="submit">
              Save food
            </button>
          </form>
        </details>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-normal text-[var(--brand-ink)]">
            Food library
          </h2>
          <p className="text-sm font-bold text-[var(--brand-muted)]">
            {foods.length} food{foods.length === 1 ? "" : "s"}
          </p>
        </div>
        {foods.length === 0 ? (
          <EmptyState
            title="No foods match this view."
            description="Try a different search or add a manual food."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {foods.map((food) => (
              <FoodCard key={food.foodId} food={food} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
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
