"use client";

import { useSyncExternalStore } from "react";

import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeToTheme,
} from "@/components/theme-store";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  return (
    <label className="block">
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        className="h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 shadow-sm outline-none hover:bg-slate-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        onChange={(event) =>
          setThemePreference(
            event.target.value as "system" | "light" | "dark",
          )
        }
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
