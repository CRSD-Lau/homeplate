import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth/session";
import { getExistingProfilePicturePath } from "@/lib/profile-picture";
import { getThemePreference } from "@/lib/theme";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [theme, profilePictureUrl] = await Promise.all([
    getThemePreference(),
    getExistingProfilePicturePath(user.id),
  ]);

  return (
    <AppShell user={user} theme={theme} profilePictureUrl={profilePictureUrl}>
      {children}
    </AppShell>
  );
}
