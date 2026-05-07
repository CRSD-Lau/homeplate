export function ProgressBar({
  value,
  max,
  color = "var(--brand-teal)",
  trackClassName = "",
}: {
  value: number;
  max: number | null | undefined;
  color?: string;
  trackClassName?: string;
}) {
  const percent = max && max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-[var(--brand-soft)] ${trackClassName}`}
      aria-valuemin={0}
      aria-valuemax={max ?? undefined}
      aria-valuenow={value}
      role="progressbar"
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${percent}%`, background: color }}
      />
    </div>
  );
}
