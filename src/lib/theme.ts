import { cookies } from "next/headers";

export {
  normalizeThemePreference,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
  type ThemePreference,
} from "./theme-shared";

import { normalizeThemePreference, THEME_COOKIE_NAME } from "./theme-shared";

export async function getThemePreference() {
  const cookieStore = await cookies();
  return normalizeThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
}
