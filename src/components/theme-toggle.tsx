"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type ThemePreference = "system" | "light" | "dark";

const order: ThemePreference[] = ["system", "light", "dark"];
const themeStorageKey = "homeplate-theme";
const themeChangeEvent = "homeplate-theme-change";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark =
        theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = theme;
    };

    applyTheme();
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
        setThemePreference(order[(order.indexOf(theme) + 1) % order.length])
      }
    >
      <Icon aria-hidden="true" size={17} />
      <span className="hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

function getThemeSnapshot(): ThemePreference {
  const stored = localStorage.getItem(themeStorageKey);
  return isTheme(stored) ? stored : "system";
}

function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

function setThemePreference(theme: ThemePreference) {
  localStorage.setItem(themeStorageKey, theme);
  window.dispatchEvent(new Event(themeChangeEvent));
}

function isTheme(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
