import { ArrowDown, ArrowUp, Minus, Trash2 } from "lucide-react";

import {
  deleteWeightLogAction,
  logWeightAction,
  setGoalWeightAction,
} from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { WeightGraphCard } from "@/components/tracking/WeightGraphCard";
import { getWeightPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { calculateWeightSummary } from "@/lib/tracking";
import { formatWeight, kgToLb } from "@/lib/units";

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { logs, profile, settings } = await getWeightPageData(user.id);
  const params = await searchParams;
  const summary = calculateWeightSummary(logs);
  const unit = settings.weightUnit;
  const graphData = [...logs]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((log) => ({
      label: shortDate(log.logDate),
      weight: unit === "lb" ? kgToLb(log.weightKg) : log.weightKg,
    }));
  const goalWeight =
    profile?.goalWeightKg === null || profile?.goalWeightKg === undefined
      ? null
      : unit === "lb"
        ? kgToLb(profile.goalWeightKg)
        : profile.goalWeightKg;

  return (
    <TrackingPageShell title="Weight graph">
      <FormMessage
        error={params.error}
        saved={params.saved}
        savedText="Weight saved."
      />

      <section className="grid grid-cols-3 divide-x divide-[var(--brand-line)] rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--brand-card)] p-4 shadow-[var(--brand-shadow-soft)]">
        <WeightStat
          label="Start"
          value={
            summary.startKg === null
              ? "-"
              : formatWeight(summary.startKg, settings.weightUnit)
          }
        />
        <WeightStat
          label="Current"
          value={
            summary.currentKg === null
              ? "-"
              : formatWeight(summary.currentKg, settings.weightUnit)
          }
        />
        <WeightStat
          label="Change"
          value={
            summary.changeKg === null
              ? "-"
              : formatWeight(Math.abs(summary.changeKg), settings.weightUnit)
          }
          direction={summary.direction}
        />
      </section>

      <WeightGraphCard data={graphData} goalWeight={goalWeight} unit={unit} />

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <section className="hp-card p-4">
            <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
              Add weight
            </h2>
            <form action={logWeightAction} className="space-y-3">
              <input type="hidden" name="returnTo" value="/weight?saved=1" />
              <Field label="Date">
                <input
                  name="logDate"
                  type="date"
                  defaultValue={toDateInputValue()}
                  required
                  className="field"
                />
              </Field>
              <Field label={`Weight (${unit})`}>
                <input
                  name="entryWeightValue"
                  type="number"
                  inputMode="decimal"
                  min={unit === "lb" ? 50 : 20}
                  max={unit === "lb" ? 800 : 360}
                  step="0.1"
                  required
                  className="field"
                />
                <input name="entryWeightUnit" type="hidden" value={unit} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" rows={2} className="field min-h-20" />
              </Field>
              <button type="submit" className="primary-button">
                Save weight
              </button>
            </form>
          </section>

          <section className="hp-card p-4">
            <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
              Goal weight
            </h2>
            <form action={setGoalWeightAction} className="space-y-3">
              <input type="hidden" name="returnTo" value="/weight?saved=goal" />
              <Field label={`Goal (${unit})`}>
                <input
                  name="goalWeightValue"
                  type="number"
                  inputMode="decimal"
                  min={unit === "lb" ? 50 : 20}
                  max={unit === "lb" ? 800 : 360}
                  step="0.1"
                  defaultValue={goalWeight ? goalWeight.toFixed(1) : ""}
                  className="field"
                  placeholder="Optional"
                />
                <input name="goalWeightUnit" type="hidden" value={unit} />
              </Field>
              <button type="submit" className="secondary-button w-full">
                Save goal
              </button>
            </form>
          </section>
        </div>

        <section className="hp-card p-4">
          <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
            Recent entries
          </h2>
          {logs.length === 0 ? (
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              No weight logs yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--brand-line)]">
              {logs.slice(0, 12).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-extrabold text-[var(--brand-ink)]">
                      {formatWeight(log.weightKg, unit)}
                    </p>
                    <p className="text-sm font-medium text-[var(--brand-muted)]">
                      {log.logDate}
                      {log.notes ? ` · ${log.notes}` : ""}
                    </p>
                  </div>
                  <form action={deleteWeightLogAction}>
                    <input type="hidden" name="id" value={log.id} />
                    <button type="submit" className="icon-button" title="Delete weight">
                      <Trash2 aria-hidden="true" size={17} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </TrackingPageShell>
  );
}

function WeightStat({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction?: "up" | "down" | "flat";
}) {
  const DirectionIcon =
    direction === "down" ? ArrowDown : direction === "up" ? ArrowUp : Minus;
  return (
    <div className="min-w-0 px-3 text-center first:pl-0 last:pr-0">
      <p className="text-sm font-extrabold text-[var(--brand-ink)]">{label}</p>
      <p className="mt-2 flex items-center justify-center gap-1 whitespace-nowrap text-lg font-extrabold text-[var(--brand-ink)] min-[390px]:text-xl">
        {direction ? (
          <DirectionIcon
            aria-hidden="true"
            className={direction === "down" ? "text-[var(--brand-green)]" : "text-[var(--brand-coral)]"}
            size={18}
          />
        ) : null}
        {value}
      </p>
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
      <span className="text-sm font-bold text-[var(--brand-ink)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function shortDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}
