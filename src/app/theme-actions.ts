"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  normalizeThemePreference,
  type ThemePreference,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
} from "@/lib/theme";
import { shouldUseSecureCookie } from "@/lib/cookie-security";

export async function toggleThemeAction() {
  const cookieStore = await cookies();
  const currentTheme = normalizeThemePreference(
    cookieStore.get(THEME_COOKIE_NAME)?.value,
  );
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  await setThemeCookie(cookieStore, nextTheme);
  return redirectToReferer();
}

export async function setThemeAction(formData: FormData) {
  const cookieStore = await cookies();
  const nextTheme = normalizeThemePreference(
    typeof formData.get("theme") === "string"
      ? String(formData.get("theme"))
      : undefined,
  );

  await setThemeCookie(cookieStore, nextTheme);
  return redirectToReferer();
}

async function setThemeCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  theme: ThemePreference,
) {
  const headersList = await headers();

  cookieStore.set(THEME_COOKIE_NAME, theme, {
    httpOnly: false,
    sameSite: "lax",
    secure: shouldUseSecureCookie({
      forwardedProto: headersList.get("x-forwarded-proto"),
      origin: headersList.get("origin"),
      referer: headersList.get("referer"),
    }),
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
  });
}

async function redirectToReferer() {
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
