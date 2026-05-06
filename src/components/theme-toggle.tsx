"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeToTheme,
  themeOrder,
} from "@/components/theme-store";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      title={`Theme: ${theme}`}
      className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={() =>
        setThemePreference(
          themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length],
        )
      }
    >
      <Icon aria-hidden="true" size={17} />
      <span className="hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}
