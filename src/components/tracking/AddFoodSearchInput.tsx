"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AddFoodSearchInputProps = {
  defaultQuery: string;
  date: string;
  tab: "all-foods" | "my-meals";
};

export function AddFoodSearchInput({
  defaultQuery,
  date,
  tab,
}: AddFoodSearchInputProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    if (value === defaultQuery) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("date", date);

      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      if (tab === "my-meals") {
        params.set("tab", tab);
      } else {
        params.delete("tab");
      }

      const queryString = params.toString();

      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    }, 275);

    return () => window.clearTimeout(timeout);
  }, [date, defaultQuery, pathname, router, searchParams, tab, value]);

  return (
    <form action={pathname} className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]"
        size={20}
      />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="tab" value={tab} />
      <input
        aria-label="Search for your food"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search for your food"
        className="field min-h-14 rounded-full pl-12 pr-12"
      />
      <button
        type="button"
        aria-label="Clear search"
        onClick={() => setValue("")}
        className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--brand-muted)] transition-opacity ${
          value ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <X aria-hidden="true" size={18} />
      </button>
      <button type="submit" className="sr-only">
        Search
      </button>
      <span aria-live="polite" className="sr-only">
        {isPending ? "Updating search results" : ""}
      </span>
    </form>
  );
}
