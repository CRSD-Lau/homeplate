import { Trash2 } from "lucide-react";

import { deleteExerciseLogAction, logExerciseAction } from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getExercisePageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";

export default async function ExercisePage() {
  const user = await requireUser();
  const { logs } = await getExercisePageData(user.id);

  return (
    <>
      <PageHeader
        title="Exercise"
        description="Track activity, duration, optional calories burned, intensity, and notes."
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Add Exercise">
          <form action={logExerciseAction} className="space-y-3">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={toDateInputValue()}
                required
                className="field"
              />
            </Field>
            <Field label="Activity">
              <input name="activity" required className="field" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minutes">
                <input name="durationMinutes" type="number" step="1" className="field" />
              </Field>
              <Field label="Calories">
                <input name="caloriesBurned" type="number" step="1" className="field" />
              </Field>
            </div>
            <Field label="Intensity">
              <select name="intensity" defaultValue="" className="field">
                <option value="">Optional</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea name="notes" rows={2} className="field min-h-20" />
            </Field>
            <button type="submit" className="primary-button">
              Save exercise
            </button>
          </form>
        </Panel>

        <Panel title="History">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No exercise logs yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{log.activity}</p>
                    <p className="text-sm text-slate-500">
                      {log.logDate}
                      {log.durationMinutes ? ` · ${log.durationMinutes} min` : ""}
                      {log.caloriesBurned ? ` · ${log.caloriesBurned} kcal` : ""}
                      {log.intensity ? ` · ${log.intensity}` : ""}
                    </p>
                  </div>
                  <form action={deleteExerciseLogAction}>
                    <input type="hidden" name="id" value={log.id} />
                    <button
                      className="icon-button"
                      type="submit"
                      title="Delete exercise log"
                    >
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
