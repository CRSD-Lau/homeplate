import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function TrackingPageShell({
  title,
  eyebrow,
  backHref = "/dashboard",
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  backHref?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href={backHref} className="icon-button shrink-0" aria-label="Back">
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase text-[var(--brand-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="hp-display truncate text-3xl md:text-4xl">{title}</h1>
        </div>
        <div className="flex min-h-11 min-w-[2.75rem] shrink-0 items-center justify-end">
          {action}
        </div>
      </header>
      {children}
    </div>
  );
}
