import { AppChrome } from "@/components/app/AppChrome";
import type { CurrentUser } from "@/lib/auth/session";
import type { ThemePreference } from "@/lib/theme";

export function AppShell({
  user,
  theme,
  profilePictureUrl,
  children,
}: {
  user: CurrentUser;
  theme: ThemePreference;
  profilePictureUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <AppChrome
        user={user}
        initialTheme={theme}
        profilePictureUrl={profilePictureUrl}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-10 md:pt-6">
        {children}
      </main>
    </div>
  );
}
