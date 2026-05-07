export type ThemePreference = "light" | "dark";

export const THEME_COOKIE_NAME = "homeplate_theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export function normalizeThemePreference(value: string | null | undefined) {
  if (value === "light" || value === "dark") {
    return value;
  }

  return "light";
}
