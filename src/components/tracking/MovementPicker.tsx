"use client";

import { useState } from "react";
import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Plus,
  Waves,
  X,
} from "lucide-react";

import { logExerciseAction } from "@/app/actions";

const activities = [
  "Walking",
  "Running",
  "Treadmill walk",
  "Treadmill run",
  "Biking",
  "Yard work",
  "Strength training",
  "Aerobics",
  "Swimming",
  "Hiking",
  "Sports",
  "Other",
];

export function MovementPicker({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setActivity(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="primary-button inline-flex w-full items-center justify-center gap-2 px-5 sm:w-auto"
      >
        <Plus aria-hidden="true" size={20} />
        Movement
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <section className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-[var(--brand-line)] bg-[var(--brand-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--brand-line)] p-4">
              <h2 className="hp-display text-3xl">
                {activity ? "Log movement" : "Exercise"}
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={close}
                aria-label="Close movement picker"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            {activity ? (
              <form action={logExerciseAction} className="space-y-3 overflow-y-auto p-4">
                <input type="hidden" name="returnTo" value="/movement?saved=1" />
                <Field label="Activity">
                  <input name="activity" defaultValue={activity} required className="field" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Minutes">
                    <input
                      name="durationMinutes"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      className="field"
                    />
                  </Field>
                  <Field label="Calories">
                    <input
                      name="caloriesBurned"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      className="field"
                    />
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
                <Field label="Date">
                  <input name="logDate" type="date" defaultValue={date} className="field" />
                </Field>
                <Field label="Notes">
                  <textarea name="notes" rows={3} className="field min-h-24" />
                </Field>
                <button type="submit" className="primary-button">
                  Save movement
                </button>
                <button
                  type="button"
                  className="secondary-button w-full"
                  onClick={() => setActivity(null)}
                >
                  Choose another activity
                </button>
              </form>
            ) : (
              <div className="overflow-y-auto p-2">
                {activities.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left text-lg font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
                    onClick={() => setActivity(option)}
                  >
                    <span>{option}</span>
                    <MovementIcon activity={option} />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

function MovementIcon({ activity }: { activity: string }) {
  const className = "text-[var(--brand-teal)]";
  if (activity.includes("Bik")) return <Bike aria-hidden="true" className={className} size={22} />;
  if (activity.includes("Strength")) return <Dumbbell aria-hidden="true" className={className} size={22} />;
  if (activity.includes("Swim")) return <Waves aria-hidden="true" className={className} size={22} />;
  if (activity.includes("Hik")) return <Mountain aria-hidden="true" className={className} size={22} />;
  return <Footprints aria-hidden="true" className={className} size={22} />;
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
