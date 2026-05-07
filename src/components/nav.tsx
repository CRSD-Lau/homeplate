"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Droplets,
  HeartPulse,
  Home,
  NotebookTabs,
  Settings,
  Utensils,
  Weight,
} from "lucide-react";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log", icon: NotebookTabs },
  { href: "/foods", label: "Foods", icon: Utensils },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
];

const secondaryNav = [
  { href: "/weight", label: "Weight", icon: Weight },
  { href: "/water", label: "Water", icon: Droplets },
  { href: "/movement", label: "Movement", icon: Activity },
];

export function DesktopNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 md:block">
      <div className="mb-7">
        <p className="text-xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">
          HomePlate
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Private household tracker
        </p>
      </div>

      <NavList items={primaryNav} />
      <div className="my-5 h-px bg-slate-200 dark:bg-slate-800" />
      <NavList items={secondaryNav} />

      {isAdmin ? (
        <>
          <div className="my-5 h-px bg-slate-200 dark:bg-slate-800" />
          <NavList items={[{ href: "/admin", label: "Admin", icon: Settings }]} />
        </>
      ) : null}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
      <div className="grid grid-cols-5">
        {primaryNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium ${
                active
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavList({
  items,
}: {
  items: { href: string; label: string; icon: typeof Home }[];
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
              active
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            }`}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
