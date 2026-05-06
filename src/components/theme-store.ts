"use client";

export type ThemePreference = "system" | "light" | "dark";

export const themeOrder: ThemePreference[] = ["system", "light", "dark"];

const themeStorageKey = "homeplate-theme";
const themeChangeEvent = "homeplate-theme-change";

export function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

export function getThemeSnapshot(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

export function setThemePreference(theme: ThemePreference) {
  applyThemePreference(theme);

  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Keep the visual toggle working even if browser storage is unavailable.
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}

export function applyThemePreference(theme: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;

  document.body.classList.toggle("dark", dark);
  document.body.dataset.theme = theme;
}

export function toggleThemePreference() {
  const currentlyDark = document.documentElement.classList.contains("dark");
  const nextTheme = currentlyDark ? "light" : "dark";
  setThemePreference(nextTheme);

  return nextTheme;
}

function isTheme(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
