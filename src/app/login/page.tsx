import { Utensils } from "lucide-react";
import { redirect } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Utensils aria-hidden="true" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">HomePlate</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Private household login
            </p>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field mt-1"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="field mt-1"
            />
          </label>

          <button
            type="submit"
            className="primary-button"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          No public registration is available. Accounts are seeded locally for
          Neil and Allison.
        </p>
      </section>
    </main>
  );
}
