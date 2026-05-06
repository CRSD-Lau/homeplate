"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";

const order: ThemePreference[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const stored =
      (localStorage.getItem("homeplate-theme") as ThemePreference | null) ??
      "system";
    return isTheme(stored) ? stored : "system";
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark =
        theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = theme;
    };

    applyTheme();
    localStorage.setItem("homeplate-theme", theme);
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      title={`Theme: ${theme}`}
      className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={() =>
        setTheme((current) => order[(order.indexOf(current) + 1) % order.length])
      }
    >
      <Icon aria-hidden="true" size={17} />
      <span className="hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}

function isTheme(value: string): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
