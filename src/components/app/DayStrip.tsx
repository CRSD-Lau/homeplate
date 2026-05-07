import Link from "next/link";
import { Check } from "lucide-react";

import {
  currentWeekDateKeys,
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/dates";

export function DayStrip({
  selectedDate,
  loggedDates = [],
  basePath,
}: {
  selectedDate: string;
  loggedDates?: string[];
  basePath: string;
}) {
  const today = toDateInputValue();
  const days = currentWeekDateKeys(selectedDate);
  const logged = new Set(loggedDates);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="grid min-w-full grid-cols-7 gap-1">
        {days.map((date) => {
          const parsed = parseDateInputValue(date);
          const selected = date === selectedDate;
          const isToday = date === today;
          const completed = logged.has(date);
          const dayName = parsed
            .toLocaleDateString("en-CA", { weekday: "short" })
            .charAt(0);

          return (
            <Link
              key={date}
              href={`${basePath}?date=${date}`}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-center"
              aria-current={selected ? "date" : undefined}
            >
              <span
                className={`relative flex h-12 w-12 flex-col items-center justify-center rounded-full border text-sm font-extrabold leading-none transition ${
                  selected
                    ? "border-[var(--brand-teal)] bg-[var(--brand-teal)] text-white ring-4 ring-[color-mix(in_srgb,var(--brand-teal)_24%,transparent)]"
                    : isToday
                      ? "border-[var(--brand-teal)] bg-[var(--brand-card)] text-[var(--brand-teal)]"
                      : "border-[var(--brand-line)] bg-[var(--brand-card)] text-[var(--brand-ink)]"
                }`}
              >
                {dayName}
                <span className="block text-xs">{parsed.getDate()}</span>
                {completed ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-green)] text-white">
                    <Check aria-hidden="true" size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[0.7rem] font-bold ${
                  selected ? "text-[var(--brand-teal)]" : "text-[var(--brand-muted)]"
                }`}
              >
                {isToday ? "TODAY" : "\u00a0"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
