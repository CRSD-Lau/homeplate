import { Trash2 } from "lucide-react";

import { deleteFoodLogAction, logFoodAction } from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getFoodLogPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { formatNumber } from "@/lib/units";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

export default async function FoodLogPage() {
  const user = await requireUser();
  const data = await getFoodLogPageData(user.id);
  const logsByMeal = Object.fromEntries(
    mealTypes.map((meal) => [
      meal,
      data.logs.filter((log) => log.mealType === meal),
    ]),
  ) as Record<(typeof mealTypes)[number], typeof data.logs>;

  return (
    <>
      <PageHeader
        title="Food Log"
        description="Log foods by meal. Nutrition totals use snapshots, so old logs stay stable if a food is edited later."
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Add Food">
          {data.foodOptions.length === 0 ? (
            <p className="text-sm text-slate-600">
              Add a manual food first, then it will appear here.
            </p>
          ) : (
            <form action={logFoodAction} className="space-y-3">
              <Field label="Date">
                <input
                  name="logDate"
                  type="date"
                  defaultValue={toDateInputValue()}
                  required
                  className="field"
                />
              </Field>
              <Field label="Meal">
                <select name="mealType" defaultValue="breakfast" className="field">
                  {mealTypes.map((meal) => (
                    <option key={meal} value={meal}>
                      {labelMeal(meal)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Food">
                <select name="foodServing" required className="field">
                  {data.foodOptions.map((food) => (
                    <option
                      key={`${food.foodId}-${food.servingId}`}
                      value={`${food.foodId}|${food.servingId}`}
                    >
                      {food.brand ? `${food.brand} ` : ""}
                      {food.foodName} ({food.servingLabel})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  defaultValue="1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={2} className="field min-h-20" />
              </Field>
              <button className="primary-button" type="submit">
                Log food
              </button>
            </form>
          )}
        </Panel>

        <div className="space-y-4">
          {mealTypes.map((meal) => (
            <Panel key={meal} title={labelMeal(meal)}>
              {logsByMeal[meal].length === 0 ? (
                <p className="text-sm text-slate-500">No foods logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {logsByMeal[meal].map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{log.foodNameSnapshot}</p>
                        <p className="text-sm text-slate-500">
                          {log.quantity} x {log.servingLabelSnapshot} ·{" "}
                          {formatNumber(log.caloriesSnapshot, 0)} kcal ·{" "}
                          {formatNumber(log.proteinGSnapshot, 0)}g protein
                        </p>
                      </div>
                      <form action={deleteFoodLogAction}>
                        <input type="hidden" name="id" value={log.id} />
                        <button
                          className="icon-button"
                          type="submit"
                          title="Delete food log"
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          ))}
        </div>
      </div>
    </>
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
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function labelMeal(meal: string) {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}
