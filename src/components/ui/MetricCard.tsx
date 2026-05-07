import { type LucideIcon } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  color = "var(--brand-teal)",
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  color?: string;
}) {
  return (
    <div className="hp-card p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: color }}>
            <Icon aria-hidden="true" size={17} />
          </span>
        ) : null}
        <p className="text-sm font-bold text-[var(--brand-muted)]">{label}</p>
      </div>
      <p className="break-words text-3xl font-extrabold tracking-normal text-[var(--brand-ink)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
