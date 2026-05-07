"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TouchEvent } from "react";
import {
  Activity,
  Apple,
  BarChart3,
  Download,
  Droplets,
  HeartPulse,
  Home,
  LogOut,
  Pencil,
  Settings,
  Shield,
  Weight,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/actions";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { CurrentUser } from "@/lib/auth/session";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/log", label: "Food Log", icon: Pencil },
  { href: "/foods", label: "Foods", icon: Apple },
  { href: "/weight", label: "Weight", icon: Weight },
  { href: "/water", label: "Water", icon: Droplets },
  { href: "/movement", label: "Movement", icon: Activity },
  { href: "/health", label: "Health Metrics", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/export", label: "Export", icon: Download },
];

export function DrawerMenu({
  user,
  initial,
  profilePictureUrl,
  open,
  onClose,
}: {
  user: CurrentUser;
  initial: string;
  profilePictureUrl: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  function handleCloseTouch(event: TouchEvent<HTMLButtonElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <div
      id="homeplate-drawer"
      className="fixed inset-0 z-50"
      aria-label="Navigation menu"
      aria-modal="true"
      role="dialog"
    >
      <button
        type="button"
        className="absolute inset-0 touch-manipulation bg-black/40"
        onClick={onClose}
        onTouchEnd={handleCloseTouch}
        aria-label="Close navigation menu"
      />
      <aside
        className="absolute inset-y-0 left-0 flex w-[min(22rem,86vw)] flex-col border-r border-[var(--brand-line)] bg-[var(--brand-card)] px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              initial={initial}
              imageUrl={profilePictureUrl}
              label={`${user.displayName} profile picture`}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold tracking-normal text-[var(--brand-ink)]">
                {user.displayName}
              </p>
              <p className="truncate text-sm font-medium text-[var(--brand-muted)]">
                HomePlate household
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            onTouchEnd={handleCloseTouch}
            aria-label="Close navigation menu"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {mainItems.map((item) => (
              <DrawerLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
                onClick={onClose}
              />
            ))}
            {user.role === "admin" ? (
              <DrawerLink
                href="/admin"
                label="Admin"
                icon={Shield}
                active={pathname === "/admin"}
                onClick={onClose}
              />
            ) : null}
          </div>
        </nav>

        <div className="mt-5 border-t border-[var(--brand-line)] pt-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--brand-muted)]">
            <BarChart3 aria-hidden="true" size={16} />
            Private wellness data
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold text-[var(--brand-coral)] hover:bg-[var(--brand-soft)]"
            >
              <LogOut aria-hidden="true" size={19} />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function DrawerLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
        active
          ? "bg-[var(--brand-soft)] text-[var(--brand-teal)]"
          : "text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
      }`}
    >
      <Icon aria-hidden="true" size={20} />
      {label}
    </Link>
  );
}
