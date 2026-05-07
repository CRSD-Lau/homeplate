import Link from "next/link";
import { Search } from "lucide-react";

const chips = [
  { label: "All", value: "all" },
  { label: "Manual", value: "manual" },
  { label: "Verified", value: "verified" },
  { label: "Provisional", value: "provisional" },
] as const;

export function FoodSearch({
  query,
  source,
}: {
  query: string;
  source: "all" | "manual" | "verified" | "provisional";
}) {
  return (
    <div className="space-y-3">
      <form action="/foods" className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]"
          size={19}
        />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search foods..."
          className="field min-h-14 rounded-full pl-11"
        />
        <input type="hidden" name="source" value={source} />
      </form>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((chip) => {
          const active = source === chip.value;
          const href =
            chip.value === "all"
              ? query
                ? `/foods?q=${encodeURIComponent(query)}`
                : "/foods"
              : `/foods?source=${chip.value}${
                  query ? `&q=${encodeURIComponent(query)}` : ""
                }`;

          return (
            <Link
              key={chip.value}
              href={href}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold ${
                active
                  ? "bg-[var(--brand-teal)] text-white"
                  : "border border-[var(--brand-line)] bg-[var(--brand-card)] text-[var(--brand-muted)]"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
