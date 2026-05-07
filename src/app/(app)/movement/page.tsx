import { Footprints, Flame, Timer, Trash2 } from "lucide-react";

import {
  deleteExerciseLogAction,
  deleteStepLogAction,
  logStepAction,
} from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { MovementPicker } from "@/components/tracking/MovementPicker";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { getMovementPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { normalizeDateInputValue } from "@/lib/dates";
import { formatNumber } from "@/lib/units";

export default async function MovementPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const selectedDate = normalizeDateInputValue(params.date);
  const data = await getMovementPageData(user.id, selectedDate);

  return (
    <TrackingPageShell title="Movement" eyebrow={data.date}>
      <FormMessage
        error={params.error}
        saved={params.saved}
        savedText="Movement saved."
      />

      <div className="sm:flex sm:justify-end">
        <MovementPicker date={data.date} />
      </div>

      <section className="hp-card-lg p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="hp-display text-2xl">Completed movement</h2>
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              Today’s logged movement and manual steps.
            </p>
          </div>
          <p className="text-2xl font-extrabold text-[var(--brand-ink)]">
            {formatNumber(data.totals.caloriesBurned, 0)} cal
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryTile
            icon={<Footprints aria-hidden="true" size={21} />}
            label="Steps"
            value={formatNumber(data.totals.steps, 0)}
          />
          <SummaryTile
            icon={<Timer aria-hidden="true" size={21} />}
            label="Duration"
            value={`${formatNumber(data.totals.durationMinutes, 0)} min`}
          />
          <SummaryTile
            icon={<Flame aria-hidden="true" size={21} />}
            label="Sessions"
            value={formatNumber(data.totals.sessions, 0)}
          />
        </div>
      </section>

      <section className="hp-card p-4">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
          Add steps
        </h2>
        <form action={logStepAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="returnTo" value={`/movement?date=${data.date}`} />
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Date</span>
            <input
              name="logDate"
              type="date"
              defaultValue={data.date}
              required
              className="field mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Steps</span>
            <input
              name="steps"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              required
              className="field mt-1"
            />
          </label>
          <button type="submit" className="primary-button self-end px-5 sm:w-auto">
            Save
          </button>
        </form>
      </section>

      <section className="hp-card p-4">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
          Today’s entries
        </h2>
        {data.todayExercises.length === 0 && data.todaySteps.length === 0 ? (
          <p className="text-sm font-medium text-[var(--brand-muted)]">
            No movement logged for this date yet.
          </p>
        ) : (
          <div className="divide-y divide-[var(--brand-line)]">
            {data.todayExercises.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="break-words font-extrabold text-[var(--brand-ink)]">
                    {log.activity}
                  </p>
                  <p className="text-sm font-medium text-[var(--brand-muted)]">
                    {log.durationMinutes ? `${log.durationMinutes} min` : "No duration"}
                    {log.caloriesBurned ? ` · ${log.caloriesBurned} cal` : ""}
                    {log.intensity ? ` · ${log.intensity}` : ""}
                  </p>
                  {log.notes ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--brand-muted)]">
                      {log.notes}
                    </p>
                  ) : null}
                </div>
                <form action={deleteExerciseLogAction}>
                  <input type="hidden" name="id" value={log.id} />
                  <button type="submit" className="icon-button" title="Delete movement">
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </form>
              </div>
            ))}
            {data.todaySteps.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-extrabold text-[var(--brand-ink)]">
                    {formatNumber(log.steps, 0)} steps
                  </p>
                  <p className="text-sm font-medium capitalize text-[var(--brand-muted)]">
                    {log.source}
                  </p>
                </div>
                <form action={deleteStepLogAction}>
                  <input type="hidden" name="id" value={log.id} />
                  <button type="submit" className="icon-button" title="Delete steps">
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </TrackingPageShell>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--brand-soft)] p-3 sm:p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-card)] text-[var(--brand-teal)] sm:h-11 sm:w-11">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-[var(--brand-ink)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
