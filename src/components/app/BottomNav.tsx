"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Home, Pencil, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/log", label: "Log", icon: Pencil },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--brand-line)] bg-[var(--brand-card)]/96 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-10px_26px_rgba(23,23,23,0.08)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.72rem] font-bold transition ${
                active
                  ? "text-[var(--brand-teal)]"
                  : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
              }`}
            >
              <Icon
                aria-hidden="true"
                size={22}
                strokeWidth={active ? 2.8 : 2.1}
              />
              <span>{item.label}</span>
              <span
                className={`h-0.5 w-7 rounded-full ${
                  active ? "bg-[var(--brand-teal)]" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
