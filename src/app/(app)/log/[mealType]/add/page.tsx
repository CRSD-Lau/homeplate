import Link from "next/link";
import { Barcode, Camera, Mic, Search } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { FoodSearchResult } from "@/components/tracking/FoodSearchResult";
import { SavedMealCard } from "@/components/tracking/SavedMealCard";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import {
  getFoodAddPageData,
  getMealReviewPageData,
} from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { formatMealLabel } from "@/lib/tracking";

export default async function AddFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ mealType: string }>;
  searchParams: Promise<{ date?: string; q?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const [{ mealType }, query] = await Promise.all([params, searchParams]);
  const [data, review] = await Promise.all([
    getFoodAddPageData({
      userId: user.id,
      mealType,
      date: query.date,
      query: query.q ?? "",
    }),
    getMealReviewPageData(user.id, mealType, query.date),
  ]);
  const activeTab = query.tab === "my-meals" ? "my-meals" : "all-foods";
  const returnTo = `/log/${data.mealType}/add?date=${data.date}${
    query.q ? `&q=${encodeURIComponent(query.q)}` : ""
  }`;

  return (
    <TrackingPageShell
      title={formatMealLabel(data.mealType)}
      backHref={`/log?date=${data.date}`}
      action={
        <Link
          href={`/log/${data.mealType}/review?date=${data.date}`}
          className="secondary-button relative"
        >
          Done
          {review.logs.length > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-coral)] text-xs font-extrabold text-white">
              {review.logs.length}
            </span>
          ) : null}
        </Link>
      }
    >
      <div className="grid grid-cols-2 border-b border-[var(--brand-line)]">
        <TabLink
          href={`/log/${data.mealType}/add?date=${data.date}${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`}
          active={activeTab === "all-foods"}
        >
          All foods
        </TabLink>
        <TabLink
          href={`/log/${data.mealType}/add?date=${data.date}&tab=my-meals${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`}
          active={activeTab === "my-meals"}
        >
          My meals
        </TabLink>
      </div>

      <form action={`/log/${data.mealType}/add`} className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]"
          size={20}
        />
        <input type="hidden" name="date" value={data.date} />
        <input type="hidden" name="tab" value={activeTab} />
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search for your food"
          className="field min-h-14 rounded-full pl-12"
        />
      </form>

      <div className="grid grid-cols-3 gap-2">
        <ComingSoon icon={<Camera aria-hidden="true" size={22} />} label="Scan meal" />
        <ComingSoon icon={<Mic aria-hidden="true" size={22} />} label="Describe meal" />
        <Link
          href={`/scan?meal=${data.mealType}&date=${data.date}`}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-card)] p-2 text-center text-sm font-extrabold text-[var(--brand-ink)] shadow-[var(--brand-shadow-soft)]"
        >
          <Barcode aria-hidden="true" size={24} />
          Scan barcode
        </Link>
      </div>

      {activeTab === "my-meals" ? (
        <section className="space-y-3">
          {data.savedMeals.length === 0 ? (
            <div className="hp-card p-5 text-center">
              <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">
                No saved meals yet
              </h2>
              <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">
                Save a meal from meal review, then add it here in one tap.
              </p>
            </div>
          ) : (
            data.savedMeals.map((meal) => (
              <SavedMealCard
                key={meal.id}
                meal={meal}
                date={data.date}
                mealType={data.mealType}
                returnTo={returnTo}
              />
            ))
          )}
        </section>
      ) : (
        <section className="hp-card p-4">
          {data.foodOptions.length === 0 ? (
            <EmptyState
              title="No foods match your search."
              description="Try a different term or add a manual food in Foods."
            />
          ) : (
            data.foodOptions.slice(0, 80).map((food) => (
              <FoodSearchResult
                key={`${food.foodId}|${food.servingId}`}
                food={food}
                date={data.date}
                mealType={data.mealType}
                returnTo={returnTo}
              />
            ))
          )}
        </section>
      )}
    </TrackingPageShell>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`min-h-12 border-b-4 text-center text-sm font-extrabold uppercase leading-[3rem] ${
        active
          ? "border-[var(--brand-teal)] text-[var(--brand-teal)]"
          : "border-transparent text-[var(--brand-muted)]"
      }`}
    >
      {children}
    </Link>
  );
}

function ComingSoon({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-card)] p-2 text-center text-sm font-extrabold text-[var(--brand-muted)] opacity-70 shadow-[var(--brand-shadow-soft)]"
    >
      {icon}
      {label}
      <span className="text-[0.65rem] font-bold uppercase">Coming soon</span>
    </button>
  );
}
