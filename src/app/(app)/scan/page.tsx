import Link from "next/link";
import { Barcode } from "lucide-react";

import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string; date?: string }>;
}) {
  const params = await searchParams;
  const backHref =
    params.meal && params.date
      ? `/log/${params.meal}/add?date=${params.date}`
      : "/log";

  return (
    <TrackingPageShell title="Scan barcode" backHref={backHref}>
      <section className="hp-card-lg p-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-teal)]">
          <Barcode aria-hidden="true" size={34} />
        </span>
        <h2 className="mt-5 hp-display text-3xl">
          Barcode scanning is planned for Phase 3.
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-[var(--brand-muted)]">
          This entry point is ready, but HomePlate is not calling barcode APIs or
          external food databases in this pass.
        </p>
        <Link
          href={backHref}
          className="primary-button mt-6 inline-flex w-auto items-center px-8"
        >
          Back to foods
        </Link>
      </section>
    </TrackingPageShell>
  );
}
