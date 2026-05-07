import { Utensils } from "lucide-react";
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
        <div className="mb-8 flex items-center gap-3">
          <span className="hp-icon-chip bg-[var(--brand-teal)]">
            <Utensils aria-hidden="true" size={22} />
          </span>
          <div>
            <h1 className="hp-display text-2xl">HomePlate</h1>
            <p className="text-sm font-medium text-[var(--brand-muted)]">
              Private household login
            </p>
          </div>
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
