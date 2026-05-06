"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  normalizeThemePreference,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
} from "@/lib/theme";

export async function toggleThemeAction() {
  const cookieStore = await cookies();
  const currentTheme = normalizeThemePreference(
    cookieStore.get(THEME_COOKIE_NAME)?.value,
  );
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  cookieStore.set(THEME_COOKIE_NAME, nextTheme, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
  });

  const headersList = await headers();
  const referer = headersList.get("referer");

  if (referer) {
    try {
      const url = new URL(referer);
      redirect(`${url.pathname}${url.search}`);
    } catch {
      // Fall back below.
    }
  }

  redirect("/dashboard");
}
