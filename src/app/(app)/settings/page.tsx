import Link from "next/link";
import { Download, LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { ProfilePictureCard } from "@/components/profile-picture-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsForm } from "@/components/settings-form";
import { getSettingsPageData } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { toDateInputValue } from "@/lib/dates";
import { getExistingProfilePicturePath } from "@/lib/profile-picture";
import { formatHeight, formatWater, formatWeight } from "@/lib/units";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const [
    {
      profile,
      settings,
      dashboardPreferences,
      startingWeight,
      latestWeight,
    },
    profilePictureUrl,
  ] = await Promise.all([
    getSettingsPageData(user.id),
    getExistingProfilePicturePath(user.id),
  ]);
  const { error, saved } = await searchParams;
  const displayName = profile?.displayName ?? user.displayName;
  const initial = displayName.trim().charAt(0).toUpperCase() || "H";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="hp-display text-3xl md:text-4xl">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[var(--brand-muted)]">
          Profile, units, goals, appearance, and household data tools.
        </p>
      </div>

      <FormMessage error={error} saved={saved} savedText="Settings saved." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <ProfilePictureCard
            displayName={displayName}
            initial={initial}
            profilePictureUrl={profilePictureUrl}
          />
          <SettingsForm
            displayName={displayName}
            heightCm={profile?.heightCm ?? null}
            heightUnit={settings.heightUnit}
            weightUnit={settings.weightUnit}
            waterUnit={settings.waterUnit}
            bloodGlucoseUnit={settings.bloodGlucoseUnit}
            dailyWaterGoalMl={settings.dailyWaterGoalMl}
            goalWeightKg={profile?.goalWeightKg ?? null}
            dashboardPreferences={dashboardPreferences}
            today={toDateInputValue()}
            startingWeightText={
              startingWeight
                ? `${formatWeight(
                    startingWeight.weightKg,
                    settings.weightUnit,
                  )} on ${startingWeight.logDate}`
                : null
            }
          />
        </section>

        <aside className="space-y-4">
          <section className="hp-card p-4">
            <h2 className="mb-3 text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
              Appearance
            </h2>
            <ThemeToggle />
          </section>

          <section className="hp-card p-4">
            <h2 className="mb-3 text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
              Current profile
            </h2>
            <div className="grid gap-3">
              <Preference label="Height unit" value={settings.heightUnit} />
              <Preference label="Weight unit" value={settings.weightUnit} />
              <Preference label="Water unit" value={settings.waterUnit} />
              <Preference
                label="Glucose unit"
                value={settings.bloodGlucoseUnit.replace("_", "/")}
              />
              <Preference
                label="Water goal"
                value={formatWater(settings.dailyWaterGoalMl, settings.waterUnit)}
              />
              <Preference
                label="Stored height"
                value={
                  profile?.heightCm
                    ? formatHeight(profile.heightCm, settings.heightUnit)
                    : "-"
                }
              />
              <Preference
                label="Starting weight"
                value={
                  startingWeight
                    ? formatWeight(startingWeight.weightKg, settings.weightUnit)
                    : "-"
                }
              />
              <Preference
                label="Latest weight"
                value={
                  latestWeight
                    ? formatWeight(latestWeight.weightKg, settings.weightUnit)
                    : "-"
                }
              />
              <Preference
                label="Goal weight"
                value={
                  profile?.goalWeightKg
                    ? formatWeight(profile.goalWeightKg, settings.weightUnit)
                    : "-"
                }
              />
            </div>
          </section>

          <section className="hp-card p-4">
            <h2 className="mb-3 text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
              Data
            </h2>
            <div className="space-y-2">
              <Link
                href="/export"
                className="secondary-button flex w-full items-center justify-center gap-2"
              >
                <Download aria-hidden="true" size={17} />
                Export
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="secondary-button flex w-full items-center justify-center gap-2 text-[var(--brand-coral)]"
                >
                  <LogOut aria-hidden="true" size={17} />
                  Logout
                </button>
              </form>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--brand-soft)] p-3">
      <p className="text-xs font-bold uppercase text-[var(--brand-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words font-extrabold text-[var(--brand-ink)]">
        {value}
      </p>
    </div>
  );
}
