export function SectionHeading({
  title,
  action,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h1 className="hp-display text-2xl md:text-3xl">{title}</h1>
      {action}
    </div>
  );
}
