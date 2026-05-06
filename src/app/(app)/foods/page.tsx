import { createManualFoodAction } from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getFoodsPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { formatNumber } from "@/lib/units";

export default async function FoodsPage() {
  await requireUser();
  const foods = await getFoodsPageData();

  return (
    <>
      <PageHeader
        title="Foods"
        description="Create household foods manually. Imported CNF and barcode records will use the same provenance-ready model later."
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Panel title="Manual Food">
          <form action={createManualFoodAction} className="space-y-3">
            <Field label="Food name">
              <input name="name" required className="field" />
            </Field>
            <Field label="Brand">
              <input name="brand" className="field" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serving label">
                <input name="servingLabel" defaultValue="1 serving" required className="field" />
              </Field>
              <Field label="Grams">
                <input name="grams" type="number" step="0.1" className="field" />
              </Field>
            </div>
            <Field label="Millilitres">
              <input name="millilitres" type="number" step="0.1" className="field" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories">
                <input name="calories" type="number" step="0.1" required className="field" />
              </Field>
              <Field label="Protein g">
                <input name="proteinG" type="number" step="0.1" required className="field" />
              </Field>
              <Field label="Carbs g">
                <input name="carbsG" type="number" step="0.1" required className="field" />
              </Field>
              <Field label="Fat g">
                <input name="fatG" type="number" step="0.1" required className="field" />
              </Field>
              <Field label="Fibre g">
                <input name="fibreG" type="number" step="0.1" className="field" />
              </Field>
              <Field label="Sugar g">
                <input name="sugarG" type="number" step="0.1" className="field" />
              </Field>
            </div>
            <Field label="Sodium mg">
              <input name="sodiumMg" type="number" step="1" className="field" />
            </Field>
            <button className="primary-button" type="submit">
              Save food
            </button>
          </form>
        </Panel>

        <Panel title="Food Library">
          {foods.length === 0 ? (
            <p className="text-sm text-slate-500">No foods created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-3">Food</th>
                    <th className="py-2 pr-3">Serving</th>
                    <th className="py-2 pr-3">Calories</th>
                    <th className="py-2 pr-3">Macros</th>
                    <th className="py-2 pr-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((food) => (
                    <tr key={food.foodId} className="border-b border-slate-100">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-slate-950">{food.name}</p>
                        {food.brand ? (
                          <p className="text-xs text-slate-500">{food.brand}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3 text-slate-600">
                        {food.servingLabel}
                        {food.grams ? ` · ${formatNumber(food.grams, 0)}g` : ""}
                        {food.millilitres
                          ? ` · ${formatNumber(food.millilitres, 0)}ml`
                          : ""}
                      </td>
                      <td className="py-3 pr-3">{formatNumber(food.calories, 0)}</td>
                      <td className="py-3 pr-3 text-slate-600">
                        P {formatNumber(food.proteinG, 0)}g · C{" "}
                        {formatNumber(food.carbsG, 0)}g · F{" "}
                        {formatNumber(food.fatG, 0)}g
                      </td>
                      <td className="py-3 pr-3 text-slate-600">
                        {food.confidenceStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
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
