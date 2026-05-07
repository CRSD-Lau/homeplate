import Link from "next/link";
import { Plus } from "lucide-react";

import { saveMealAction } from "@/app/actions";
import { BottomActionBar } from "@/components/tracking/BottomActionBar";
import { MealReviewItem } from "@/components/tracking/MealReviewItem";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getMealReviewPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { formatMealLabel } from "@/lib/tracking";
import { formatNumber } from "@/lib/units";

export default async function MealReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ mealType: string }>;
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const [{ mealType }, query] = await Promise.all([params, searchParams]);
  const data = await getMealReviewPageData(user.id, mealType, query.date);
  const returnTo = `/log/${data.mealType}/review?date=${data.date}`;
  const macroTotal =
    data.nutrition.proteinG + data.nutrition.carbsG + data.nutrition.fatG;

  return (
    <TrackingPageShell
      title="Meal review"
      eyebrow={`${formatMealLabel(data.mealType)} · ${data.date}`}
      backHref={`/log?date=${data.date}`}
      action={
        <span className="text-right text-lg font-extrabold text-[var(--brand-ink)]">
          {formatNumber(data.nutrition.calories, 0)} cal
        </span>
      }
    >
      {query.error ? (
        <p className="rounded-2xl border border-[var(--brand-coral)]/40 bg-[var(--brand-card)] p-3 text-sm font-bold text-[var(--brand-coral)]">
          {query.error}
        </p>
      ) : null}
      {query.saved ? (
        <p className="rounded-2xl border border-[var(--brand-green)]/40 bg-[var(--brand-card)] p-3 text-sm font-bold text-[var(--brand-green)]">
          Saved.
        </p>
      ) : null}

      <section className="hp-card-lg p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="hp-display text-3xl">Meal summary</h2>
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              {data.logs.length} item{data.logs.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-3xl font-extrabold text-[var(--brand-ink)]">
            {formatNumber(data.nutrition.calories, 0)}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--brand-line)] rounded-2xl border border-[var(--brand-line)] p-3">
          <Macro label="Protein" value={data.nutrition.proteinG} total={macroTotal} color="var(--brand-teal)" />
          <Macro label="Carbs" value={data.nutrition.carbsG} total={macroTotal} color="var(--brand-yellow)" />
          <Macro label="Fat" value={data.nutrition.fatG} total={macroTotal} color="var(--brand-coral)" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-[var(--brand-muted)]">
          <p>Fibre: {formatNumber(data.nutrition.fibreG, 1)}g</p>
          <p>Sodium: {formatNumber(data.nutrition.sodiumMg, 0)}mg</p>
        </div>
      </section>

      <section className="hp-card p-4">
        {data.logs.length === 0 ? (
          <p className="text-sm font-medium text-[var(--brand-muted)]">
            No foods in this meal yet.
          </p>
        ) : (
          data.logs.map((log) => (
            <MealReviewItem key={log.id} log={log} returnTo={returnTo} />
          ))
        )}
        <Link
          href={`/log/${data.mealType}/add?date=${data.date}`}
          className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--brand-soft)] px-4 text-lg font-extrabold text-[var(--brand-ink)]"
        >
          <Plus aria-hidden="true" size={24} />
          Add more
        </Link>
      </section>

      {data.logs.length > 0 ? (
        <section className="hp-card p-4">
          <h2 className="mb-3 text-xl font-extrabold text-[var(--brand-ink)]">
            Save as meal
          </h2>
          <form action={saveMealAction} className="space-y-3">
            <input type="hidden" name="logDate" value={data.date} />
            <input type="hidden" name="mealType" value={data.mealType} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              name="name"
              required
              className="field"
              placeholder={`${formatMealLabel(data.mealType)} meal`}
            />
            <textarea
              name="notes"
              rows={2}
              className="field min-h-20"
              placeholder="Notes, optional"
            />
            <button type="submit" className="secondary-button w-full">
              Save meal
            </button>
          </form>
        </section>
      ) : null}

      <BottomActionBar>
        <Link href={`/log?date=${data.date}`} className="primary-button flex items-center justify-center">
          Done
        </Link>
      </BottomActionBar>
    </TrackingPageShell>
  );
}

function Macro({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <p className="text-sm font-bold text-[var(--brand-ink)]">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[var(--brand-ink)]">
        {formatNumber(value, 0)}g
      </p>
      <div className="mt-2">
        <ProgressBar value={value} max={total || null} color={color} />
      </div>
    </div>
  );
}
