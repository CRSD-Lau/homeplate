import { randomBytes, createHash } from "node:crypto";

import { addDays } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { shouldUseSecureCookie } from "@/lib/cookie-security";

export const SESSION_COOKIE_NAME = "homeplate_session";
const SESSION_DAYS = 180;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const sessionTokenHash = hashSessionToken(token);
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await getDb().insert(sessions).values({
    userId,
    sessionTokenHash,
    expiresAt,
  });

  const cookieStore = await cookies();
  const headersList = await headers();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie({
      forwardedProto: headersList.get("x-forwarded-proto"),
      origin: headersList.get("origin"),
      referer: headersList.get("referer"),
    }),
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await getDb()
      .delete(sessions)
      .where(eq(sessions.sessionTokenHash, hashSessionToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const [row] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.sessionTokenHash, hashSessionToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
