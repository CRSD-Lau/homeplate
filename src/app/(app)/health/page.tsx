import { Trash2 } from "lucide-react";

import {
  deleteBloodGlucoseLogAction,
  deleteBloodPressureLogAction,
  logBloodGlucoseAction,
  logBloodPressureAction,
} from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getHealthPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { formatGlucose } from "@/lib/units";

export default async function HealthPage() {
  const user = await requireUser();
  const { bloodPressure, bloodGlucose, settings } = await getHealthPageData(user.id);

  return (
    <>
      <PageHeader
        title="Health"
        description="Track blood pressure and blood glucose as private wellness data. HomePlate only stores and visualizes your entries."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Blood Pressure">
          <form action={logBloodPressureAction} className="mb-5 space-y-3">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={toDateInputValue()}
                required
                className="field"
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Systolic">
                <input name="systolicMmhg" type="number" required className="field" />
              </Field>
              <Field label="Diastolic">
                <input name="diastolicMmhg" type="number" required className="field" />
              </Field>
              <Field label="Pulse">
                <input name="pulseBpm" type="number" className="field" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea name="notes" rows={2} className="field min-h-20" />
            </Field>
            <button type="submit" className="primary-button">
              Save blood pressure
            </button>
          </form>

          <HistoryList
            empty="No blood pressure logs yet."
            rows={bloodPressure.map((log) => ({
              id: log.id,
              title: `${log.systolicMmhg}/${log.diastolicMmhg} mmHg`,
              detail: `${log.logDate}${log.pulseBpm ? ` · ${log.pulseBpm} bpm` : ""}`,
              action: deleteBloodPressureLogAction,
            }))}
          />
        </Panel>

        <Panel title="Blood Glucose">
          <form action={logBloodGlucoseAction} className="mb-5 space-y-3">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={toDateInputValue()}
                required
                className="field"
              />
            </Field>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field label="Glucose">
                <input name="entryValue" type="number" step="0.1" required className="field" />
              </Field>
              <Field label="Unit">
                <select
                  name="entryUnit"
                  defaultValue={settings.bloodGlucoseUnit}
                  className="field"
                >
                  <option value="mmol_l">mmol/L</option>
                  <option value="mg_dl">mg/dL</option>
                </select>
              </Field>
            </div>
            <Field label="Context">
              <select name="context" defaultValue="other" className="field">
                <option value="fasting">Fasting</option>
                <option value="before_meal">Before meal</option>
                <option value="after_meal">After meal</option>
                <option value="bedtime">Bedtime</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={2} className="field min-h-20" />
            </Field>
            <button type="submit" className="primary-button">
              Save blood glucose
            </button>
          </form>

          <HistoryList
            empty="No blood glucose logs yet."
            rows={bloodGlucose.map((log) => ({
              id: log.id,
              title: formatGlucose(log.glucoseMmolL, settings.bloodGlucoseUnit),
              detail: `${log.logDate} · ${log.context.replaceAll("_", " ")}`,
              action: deleteBloodGlucoseLogAction,
            }))}
          />
        </Panel>
      </div>
    </>
  );
}

function HistoryList({
  empty,
  rows,
}: {
  empty: string;
  rows: {
    id: string;
    title: string;
    detail: string;
    action: (formData: FormData) => Promise<void>;
  }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
        >
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-sm text-slate-500">{row.detail}</p>
          </div>
          <form action={row.action}>
            <input type="hidden" name="id" value={row.id} />
            <button className="icon-button" type="submit" title="Delete health log">
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </form>
        </div>
      ))}
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
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
