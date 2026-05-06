import { cookies } from "next/headers";

export type ThemePreference = "light" | "dark";

export const THEME_COOKIE_NAME = "homeplate_theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export async function getThemePreference() {
  const cookieStore = await cookies();
  return normalizeThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
}

export function normalizeThemePreference(value: string | null | undefined) {
  return value === "dark" ? "dark" : "light";
}
