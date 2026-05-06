"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  applyThemePreference,
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
} from "@/components/theme-store";

export function ThemeManager() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => applyThemePreference(theme);

    applyTheme();
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  return null;
}
