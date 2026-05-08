import Image from "next/image";
import { redirect } from "next/navigation";

import { FormMessage } from "@/components/form-message";
import { loginAction } from "./actions";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <section className="hp-card-lg w-full max-w-sm p-6">
        <div className="mb-8 text-center">
          <Image
            src="/brand/homeplate-logo-stacked.svg"
            alt="HomePlate Health and Nutrition"
            width={1200}
            height={900}
            priority
            unoptimized
            className="mx-auto block h-auto w-44 max-w-full select-none dark:hidden"
          />
          <Image
            src="/brand/homeplate-logo-stacked-outlined.svg"
            alt="HomePlate Health and Nutrition"
            width={1200}
            height={900}
            priority
            unoptimized
            className="mx-auto hidden h-auto w-44 max-w-full select-none dark:block"
          />
          <p className="mt-3 text-sm font-medium text-[var(--brand-muted)]">
            Private household login
          </p>
        </div>

        <FormMessage error={error} />

        <form action={loginAction} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field mt-1"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-[var(--brand-ink)]">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="field mt-1"
            />
          </label>

          <button type="submit" className="primary-button">
            Sign in
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-[var(--brand-muted)]">
          No public registration is available. Accounts are seeded locally for
          Neil and Allison.
        </p>
      </section>
    </main>
  );
}
