"use client";

import Image from "next/image";
import { useEffect, useState, type TouchEvent } from "react";

import { BottomNav } from "@/components/app/BottomNav";
import { DrawerMenu } from "@/components/app/DrawerMenu";
import { UserAvatar } from "@/components/app/UserAvatar";
import { ThemeToggleClient } from "@/components/theme-toggle-client";
import type { CurrentUser } from "@/lib/auth/session";
import type { ThemePreference } from "@/lib/theme";

export function AppChrome({
  user,
  initialTheme,
  profilePictureUrl,
}: {
  user: CurrentUser;
  initialTheme: ThemePreference;
  profilePictureUrl: string | null;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "H";

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  function openDrawer() {
    setDrawerOpen(true);
  }

  function handleOpenTouch(event: TouchEvent<HTMLButtonElement>) {
    event.preventDefault();
    openDrawer();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-transparent bg-[var(--background)]/92 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={openDrawer}
              onTouchEnd={handleOpenTouch}
              className="touch-manipulation rounded-full"
              aria-label="Open navigation menu"
              aria-controls="homeplate-drawer"
              aria-expanded={drawerOpen}
            >
              <UserAvatar
                initial={initial}
                imageUrl={profilePictureUrl}
                label={`${user.displayName} profile picture`}
                showMenuBadge
              />
            </button>
            <span className="min-w-0">
              <Image
                src="/brand/homeplate-logo-horizontal.svg"
                alt="HomePlate Health and Nutrition"
                width={1600}
                height={520}
                priority
                unoptimized
                className="block h-auto w-36 max-w-[48vw] select-none dark:hidden sm:w-44"
              />
              <Image
                src="/brand/homeplate-logo-horizontal-outlined.svg"
                alt="HomePlate Health and Nutrition"
                width={1600}
                height={520}
                priority
                unoptimized
                className="hidden h-auto w-36 max-w-[48vw] select-none dark:block sm:w-44"
              />
            </span>
          </div>

          <ThemeToggleClient initialTheme={initialTheme} variant="icon" />
        </div>
      </header>

      <DrawerMenu
        user={user}
        initial={initial}
        profilePictureUrl={profilePictureUrl}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <BottomNav />
    </>
  );
}
