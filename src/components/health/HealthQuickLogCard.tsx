export function HealthQuickLogCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hp-card p-4">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
          {title}
        </h2>
        <p className="mt-1 text-sm font-medium leading-5 text-[var(--brand-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
