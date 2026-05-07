import { Droplet, Plus } from "lucide-react";

import { logWaterAction } from "@/app/actions";
import { calculateWaterProgress } from "@/lib/tracking";

export function WaterTracker({
  date,
  totalMl,
  goalMl,
}: {
  date: string;
  totalMl: number;
  goalMl: number;
}) {
  const progress = calculateWaterProgress({ totalMl, goalMl });

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {Array.from({ length: progress.totalUnits }, (_, index) => {
        const filled = index < progress.filledUnits;
        return (
          <form action={logWaterAction} key={index}>
            <input type="hidden" name="logDate" value={date} />
            <input type="hidden" name="entryAmount" value={progress.unitMl.toFixed(1)} />
            <input type="hidden" name="entryUnit" value="ml" />
            <input
              type="hidden"
              name="returnTo"
              value={`/water?date=${date}&saved=1`}
            />
            <button
              type="submit"
              disabled={filled}
              className={`flex min-h-16 w-full flex-col items-center justify-center rounded-2xl border text-sm font-bold transition ${
                filled
                  ? "border-[var(--brand-teal-light)] bg-[var(--brand-teal-light)] text-white"
                  : "border-[var(--brand-line)] bg-[var(--brand-card)] text-[var(--brand-muted)] hover:border-[var(--brand-teal)] hover:text-[var(--brand-teal)]"
              }`}
              aria-label={`Add water glass ${index + 1}`}
            >
              {filled ? (
                <Droplet aria-hidden="true" size={23} fill="currentColor" />
              ) : (
                <Plus aria-hidden="true" size={22} />
              )}
            </button>
          </form>
        );
      })}
    </div>
  );
}
