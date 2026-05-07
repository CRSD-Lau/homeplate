export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--brand-line)] bg-[var(--brand-soft)]/60 p-4 text-sm">
      <p className="font-bold text-[var(--brand-ink)]">{title}</p>
      {description ? (
        <p className="mt-1 leading-5 text-[var(--brand-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
