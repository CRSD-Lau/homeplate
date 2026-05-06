import { Trash2 } from "lucide-react";

import { deleteWeightLogAction, logWeightAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { PageHeader, Panel } from "@/components/page-header";
import { getWeightPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { calculateBmi } from "@/lib/bmi";
import { toDateInputValue } from "@/lib/dates";
import { formatNumber, formatWeight } from "@/lib/units";

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { logs, profile, settings } = await getWeightPageData(user.id);
  const { error, saved } = await searchParams;
  const isLb = settings.weightUnit === "lb";

  return (
    <>
      <PageHeader
        title="Weight"
        description="Log weight in pounds or kilograms. BMI is calculated from your stored height when available."
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Add Weight">
          <FormMessage
            error={error}
            saved={saved}
            savedText="Weight saved."
          />
          <form action={logWeightAction} className="space-y-3">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={toDateInputValue()}
                required
                className="field"
              />
            </Field>
            <Field label={`Weight (${settings.weightUnit})`}>
              <input
                name="entryWeightValue"
                type="number"
                inputMode="decimal"
                min={isLb ? 50 : 20}
                max={isLb ? 800 : 360}
                step="0.1"
                placeholder={isLb ? "210" : "95"}
                required
                className="field"
              />
              <input
                name="entryWeightUnit"
                type="hidden"
                value={settings.weightUnit}
              />
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={2} className="field min-h-20" />
            </Field>
            <button type="submit" className="primary-button">
              Save weight
            </button>
          </form>
        </Panel>

        <Panel title="History">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No weight logs yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const bmi = profile?.heightCm
                  ? calculateBmi(log.weightKg, profile.heightCm)
                  : null;

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-medium">
                        {formatWeight(log.weightKg, settings.weightUnit)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {log.logDate} · entered {log.entryWeightValue}{" "}
                        {log.entryWeightUnit}
                        {bmi ? ` · BMI ${formatNumber(bmi, 1)}` : ""}
                      </p>
                    </div>
                    <form action={deleteWeightLogAction}>
                      <input type="hidden" name="id" value={log.id} />
                      <button
                        className="icon-button"
                        type="submit"
                        title="Delete weight log"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </form>
                  </div>
                );
              })}
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
