import { Moon, Sun } from "lucide-react";

import { toggleThemeAction } from "@/app/theme-actions";
import { getThemePreference } from "@/lib/theme";

export async function ThemeToggle() {
  const theme = await getThemePreference();
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <form action={toggleThemeAction}>
      <button
        type="submit"
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Icon aria-hidden="true" size={18} />
      </button>
    </form>
  );
}
