import { FormMessage } from "@/components/form-message";
import { PageHeader, Panel } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getProfileAndSettings } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { formatWater } from "@/lib/units";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { profile, settings } = await getProfileAndSettings(user.id);
  const { error, saved } = await searchParams;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Choose units independently. HomePlate stores canonical metric values for calculations and preserves entered units."
      />

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Panel title="Profile and Units">
          <FormMessage
            error={error}
            saved={saved}
            savedText="Settings saved."
          />
          <SettingsForm
            displayName={profile?.displayName ?? user.displayName}
            heightCm={profile?.heightCm ?? null}
            heightUnit={settings.heightUnit}
            weightUnit={settings.weightUnit}
            waterUnit={settings.waterUnit}
            bloodGlucoseUnit={settings.bloodGlucoseUnit}
            dailyWaterGoalMl={settings.dailyWaterGoalMl}
          />
        </Panel>

        <Panel title="Current Preferences">
          <div className="grid gap-3 sm:grid-cols-2">
            <Preference label="Height unit" value={settings.heightUnit} />
            <Preference label="Weight unit" value={settings.weightUnit} />
            <Preference label="Water unit" value={settings.waterUnit} />
            <Preference
              label="Blood glucose unit"
              value={settings.bloodGlucoseUnit.replace("_", "/")}
            />
            <Preference
              label="Water goal"
              value={formatWater(settings.dailyWaterGoalMl, settings.waterUnit)}
            />
            <Preference
              label="Stored height"
              value={profile?.heightCm ? `${profile.heightCm.toFixed(1)} cm` : "-"}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}
