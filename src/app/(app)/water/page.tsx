import { Trash2 } from "lucide-react";

import { deleteWaterLogAction, logWaterAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { PageHeader, Panel } from "@/components/page-header";
import { getWaterPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { formatWater } from "@/lib/units";

export default async function WaterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { logs, settings } = await getWaterPageData(user.id);
  const { error, saved } = await searchParams;
  const quickAdds = getQuickAdds(settings.waterUnit);

  return (
    <>
      <PageHeader
        title="Water"
        description="Quick-add or manually log water. Values are stored in millilitres internally."
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Add Water">
          <FormMessage error={error} saved={saved} savedText="Water saved." />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {quickAdds.map((quickAdd) => (
              <form action={logWaterAction} key={quickAdd.label}>
                <input type="hidden" name="logDate" value={toDateInputValue()} />
                <input
                  type="hidden"
                  name="entryAmount"
                  value={quickAdd.amount}
                />
                <input
                  type="hidden"
                  name="entryUnit"
                  value={settings.waterUnit}
                />
                <button className="secondary-button w-full" type="submit">
                  {quickAdd.label}
                </button>
              </form>
            ))}
          </div>

          <form action={logWaterAction} className="space-y-3">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={toDateInputValue()}
                required
                className="field"
              />
            </Field>
            <Field label={`Amount (${waterUnitLabel(settings.waterUnit)})`}>
              <input
                name="entryAmount"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                max={
                  settings.waterUnit === "ml"
                    ? 10000
                    : settings.waterUnit === "oz"
                      ? 350
                      : 40
                }
                required
                className="field"
              />
              <input name="entryUnit" type="hidden" value={settings.waterUnit} />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={2} className="field min-h-20" />
            </Field>
            <button type="submit" className="primary-button">
              Save water
            </button>
          </form>
        </Panel>

        <Panel title="History">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No water logs yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">
                      {formatWater(log.amountMl, settings.waterUnit)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {log.logDate} · entered {log.entryAmount} {log.entryUnit}
                    </p>
                  </div>
                  <form action={deleteWaterLogAction}>
                    <input type="hidden" name="id" value={log.id} />
                    <button className="icon-button" type="submit" title="Delete water log">
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </form>
                </div>
              ))}
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
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function getQuickAdds(unit: "ml" | "oz" | "cups") {
  if (unit === "oz") {
    return [
      { amount: 8, label: "8 oz" },
      { amount: 16, label: "16 oz" },
      { amount: 24, label: "24 oz" },
    ];
  }

  if (unit === "cups") {
    return [
      { amount: 1, label: "1 cup" },
      { amount: 2, label: "2 cups" },
      { amount: 3, label: "3 cups" },
    ];
  }

  return [
    { amount: 250, label: "250 ml" },
    { amount: 500, label: "500 ml" },
    { amount: 750, label: "750 ml" },
  ];
}

function waterUnitLabel(unit: "ml" | "oz" | "cups") {
  return unit === "cups" ? "cups" : unit;
}
