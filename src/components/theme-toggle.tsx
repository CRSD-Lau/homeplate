import { ThemeToggleClient } from "@/components/theme-toggle-client";
import { getThemePreference } from "@/lib/theme";

export async function ThemeToggle({
  variant = "segmented",
}: {
  variant?: "segmented" | "icon";
}) {
  const theme = await getThemePreference();

  return <ThemeToggleClient initialTheme={theme} variant={variant} />;
}
