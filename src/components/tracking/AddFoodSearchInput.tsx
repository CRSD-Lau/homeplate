"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  return (
    <AddFoodSearchInputInner
      key={defaultQuery}
      defaultQuery={defaultQuery}
      date={date}
      tab={tab}
    />
  );
}

function AddFoodSearchInputInner({
  defaultQuery,
  date,
  tab,
}: AddFoodSearchInputProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();
  const latestUrlRef = useRef({ date, search: "" });

  useEffect(() => {
    latestUrlRef.current = {
      date,
      search: searchParams.toString(),
    };
  }, [date, searchParams]);

  useEffect(() => {
    if (value === defaultQuery) return;

    const timeout = window.setTimeout(() => {
      const latestSearch =
        window.location.search || latestUrlRef.current.search;
      const params = new URLSearchParams(latestSearch);
      const latestDate = params.get("date") || latestUrlRef.current.date;
      const activeTab =
        params.get("tab") === "my-meals" ? "my-meals" : "all-foods";

      params.set("date", latestDate);
      params.delete("saved");
      params.delete("error");
      params.delete("skipped");

      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      if (activeTab === "my-meals") {
        params.set("tab", activeTab);
      } else {
        params.delete("tab");
      }

      const queryString = params.toString();
      const latestPathname = window.location.pathname || pathname;

      startTransition(() => {
        router.replace(
          queryString ? `${latestPathname}?${queryString}` : latestPathname,
          { scroll: false },
        );
      });
    }, 275);

    return () => window.clearTimeout(timeout);
  }, [defaultQuery, pathname, router, value]);

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
