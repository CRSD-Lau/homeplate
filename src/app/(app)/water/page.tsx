import { Trash2 } from "lucide-react";

import { deleteWaterLogAction, logWaterAction } from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getWaterPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { formatWater } from "@/lib/units";

export default async function WaterPage() {
  const user = await requireUser();
  const { logs, settings } = await getWaterPageData(user.id);

  return (
    <>
      <PageHeader
        title="Water"
        description="Quick-add or manually log water. Values are stored in millilitres internally."
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Add Water">
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[250, 500, 750].map((amount) => (
              <form action={logWaterAction} key={amount}>
                <input type="hidden" name="logDate" value={toDateInputValue()} />
                <input type="hidden" name="entryAmount" value={amount} />
                <input type="hidden" name="entryUnit" value="ml" />
                <button className="secondary-button w-full" type="submit">
                  {amount} ml
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
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <Field label="Amount">
                <input
                  name="entryAmount"
                  type="number"
                  step="0.1"
                  required
                  className="field"
                />
              </Field>
              <Field label="Unit">
                <select name="entryUnit" defaultValue={settings.waterUnit} className="field">
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="cups">cups</option>
                </select>
              </Field>
            </div>
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
