export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="hp-display text-3xl md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[var(--brand-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`hp-card p-4 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="hp-card p-4">
      <p className="text-sm font-bold text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-extrabold tracking-normal text-[var(--brand-ink)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs font-medium text-[var(--brand-muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
