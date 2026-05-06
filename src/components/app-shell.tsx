import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { DesktopNav, MobileNav } from "@/components/nav";
import type { CurrentUser } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-950">
      <div className="flex min-h-screen">
        <DesktopNav isAdmin={user.role === "admin"} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Signed in as</p>
                <p className="font-semibold">{user.displayName}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <LogOut aria-hidden="true" size={17} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
