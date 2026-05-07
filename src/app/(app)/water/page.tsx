import Link from "next/link";
import { Trash2 } from "lucide-react";

import { deleteWaterLogAction, logWaterAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { WaterTracker } from "@/components/tracking/WaterTracker";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getWaterPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { normalizeDateInputValue } from "@/lib/dates";
import { calculateWaterProgress } from "@/lib/tracking";
import { formatNumber, formatWater } from "@/lib/units";

export default async function WaterPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const selectedDate = normalizeDateInputValue(params.date);
  const { logs, settings } = await getWaterPageData(user.id);
  const todayLogs = logs.filter((log) => log.logDate === selectedDate);
  const totalMl = todayLogs.reduce((total, log) => total + log.amountMl, 0);
  const progress = calculateWaterProgress({
    totalMl,
    goalMl: settings.dailyWaterGoalMl,
  });

  return (
    <TrackingPageShell title="Hydration" eyebrow={selectedDate}>
      <FormMessage
        error={params.error}
        saved={params.saved}
        savedText="Water saved."
      />

      <section className="hp-card-lg p-5 text-center">
        <p className="text-4xl font-extrabold text-[var(--brand-teal)]">
          {progress.filledUnits}/{progress.totalUnits} glasses
        </p>
        <p className="mt-2 text-lg font-bold text-[var(--brand-muted)]">
          {formatWater(totalMl, settings.waterUnit)} of{" "}
          {formatWater(settings.dailyWaterGoalMl, settings.waterUnit)}
        </p>
        <div className="mx-auto mt-5 max-w-md">
          <ProgressBar
            value={totalMl}
            max={settings.dailyWaterGoalMl}
            color="var(--brand-teal-light)"
          />
        </div>
      </section>

      <section className="hp-card p-4">
        <WaterTracker
          date={selectedDate}
          totalMl={totalMl}
          goalMl={settings.dailyWaterGoalMl}
        />
        <p className="mt-4 text-center text-sm font-medium text-[var(--brand-muted)]">
          One glass adds about {formatWater(progress.unitMl, settings.waterUnit)}.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard" className="primary-button flex items-center justify-center">
          Done
        </Link>
        <Link
          href="/settings"
          className="secondary-button flex w-full items-center justify-center"
        >
          Edit water goal
        </Link>
      </div>

      <section className="hp-card p-4">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
          Manual amount
        </h2>
        <form action={logWaterAction} className="space-y-3">
          <input
            type="hidden"
            name="returnTo"
            value={`/water?date=${selectedDate}&saved=1`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
            <Field label="Date">
              <input
                name="logDate"
                type="date"
                defaultValue={selectedDate}
                required
                className="field"
              />
            </Field>
            <Field label={`Amount (${unitLabel(settings.waterUnit)})`}>
              <input
                name="entryAmount"
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                required
                className="field"
              />
              <input name="entryUnit" type="hidden" value={settings.waterUnit} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea name="notes" rows={2} className="field min-h-20" />
          </Field>
          <button type="submit" className="primary-button">
            Save water
          </button>
        </form>
      </section>

      <section className="hp-card p-4">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
          Today’s water logs
        </h2>
        {todayLogs.length === 0 ? (
          <p className="text-sm font-medium text-[var(--brand-muted)]">
            No water logged for this date yet.
          </p>
        ) : (
          <div className="divide-y divide-[var(--brand-line)]">
            {todayLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-extrabold text-[var(--brand-ink)]">
                    {formatWater(log.amountMl, settings.waterUnit)}
                  </p>
                  <p className="text-sm font-medium text-[var(--brand-muted)]">
                    Entered {formatNumber(log.entryAmount, 1)} {unitLabel(log.entryUnit)}
                  </p>
                </div>
                <form action={deleteWaterLogAction}>
                  <input type="hidden" name="id" value={log.id} />
                  <button type="submit" className="icon-button" title="Delete water">
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

function unitLabel(unit: "ml" | "oz" | "cups") {
  return unit === "oz" ? "fl oz" : unit;
}
