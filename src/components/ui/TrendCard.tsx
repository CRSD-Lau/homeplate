import { type LucideIcon } from "lucide-react";

export function TrendCard({
  icon: Icon,
  title,
  value,
  detail,
  color = "var(--brand-teal)",
  children,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  detail?: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hp-card grid min-h-32 grid-cols-[minmax(0,1fr)_9rem] items-center gap-3 p-4">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <span className="hp-icon-chip h-10 w-10" style={{ background: color }}>
            <Icon aria-hidden="true" size={20} />
          </span>
          <p className="text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
            {title}
          </p>
        </div>
        <p className="break-words text-2xl font-extrabold tracking-normal text-[var(--brand-ink)]">
          {value}
        </p>
        {detail ? (
          <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
            {detail}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
