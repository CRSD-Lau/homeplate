import { eachDayOfInterval, format, subDays } from "date-fns";

export function toDateInputValue(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function recentDateKeys(days: number, endDate = new Date()) {
  const start = subDays(endDate, Math.max(days - 1, 0));

  return eachDayOfInterval({ start, end: endDate }).map((day) =>
    format(day, "yyyy-MM-dd"),
  );
}
