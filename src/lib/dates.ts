import {
  addDays,
  eachDayOfInterval,
  format,
  parse,
  startOfWeek,
  subDays,
} from "date-fns";

export function toDateInputValue(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function normalizeDateInputValue(
  value: string | null | undefined,
  maxDate?: string,
) {
  const normalized =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toDateInputValue();

  return maxDate && normalized > maxDate ? maxDate : normalized;
}

export function parseDateInputValue(value: string) {
  return parse(value, "yyyy-MM-dd", new Date());
}

export function currentWeekDateKeys(selectedDate = toDateInputValue()) {
  const weekStart = startOfWeek(parseDateInputValue(selectedDate), {
    weekStartsOn: 1,
  });

  return Array.from({ length: 7 }, (_, index) =>
    toDateInputValue(addDays(weekStart, index)),
  );
}

export function recentDateKeys(days: number, endDate = new Date()) {
  const start = subDays(endDate, Math.max(days - 1, 0));

  return eachDayOfInterval({ start, end: endDate }).map((day) =>
    format(day, "yyyy-MM-dd"),
  );
}
