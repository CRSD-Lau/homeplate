"use client";

import { Moon } from "lucide-react";
import type { KeyboardEvent, PointerEvent } from "react";

import { toggleThemePreference } from "@/components/theme-store";

export function ThemeToggle() {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    toggleThemePreference();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleThemePreference();
    }
  }

  return (
    <button
      type="button"
      aria-label="Toggle light or dark mode"
      title="Toggle theme"
      className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      <Moon aria-hidden="true" size={18} />
    </button>
  );
}
