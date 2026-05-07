import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { ProgressBar } from "@/components/ui/ProgressBar";

export function ActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  color = "var(--brand-teal)",
  progress,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color?: string;
  progress?: { value: number; max: number | null | undefined; color?: string };
}) {
  return (
    <Link
      href={href}
      className="hp-card flex min-h-20 items-center gap-4 p-3 transition hover:-translate-y-0.5 hover:shadow-[var(--brand-shadow)]"
    >
      <span className="hp-icon-chip" style={{ background: color }}>
        <Icon aria-hidden="true" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-extrabold tracking-normal text-[var(--brand-ink)]">
          {title}
        </span>
        <span className="block break-words text-sm font-medium text-[var(--brand-muted)]">
          {subtitle}
        </span>
        {progress ? (
          <span className="mt-2 block">
            <ProgressBar
              value={progress.value}
              max={progress.max}
              color={progress.color ?? color}
            />
          </span>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-[var(--brand-ink)]"
        size={20}
      />
    </Link>
  );
}
