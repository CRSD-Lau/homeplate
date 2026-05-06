"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/passwords";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=Enter%20a%20valid%20email%20and%20password");
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    redirect("/login?error=Invalid%20email%20or%20password");
  }

  await createSession(user.id);
  redirect("/dashboard");
}
