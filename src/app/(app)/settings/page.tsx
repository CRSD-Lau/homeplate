import { updateSettingsAction } from "@/app/actions";
import { PageHeader, Panel } from "@/components/page-header";
import { getProfileAndSettings } from "@/lib/app-data";
import { requireUser } from "@/lib/auth/session";
import { cmToFtIn, formatWater } from "@/lib/units";

export default async function SettingsPage() {
  const user = await requireUser();
  const { profile, settings } = await getProfileAndSettings(user.id);
  const heightFtIn = profile?.heightCm ? cmToFtIn(profile.heightCm) : null;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Choose units independently. HomePlate stores canonical metric values for calculations and preserves entered units."
      />

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Panel title="Profile and Units">
          <form action={updateSettingsAction} className="space-y-4">
            <Field label="Display name">
              <input
                name="displayName"
                defaultValue={profile?.displayName ?? user.displayName}
                required
                className="field"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Height unit">
                <select name="heightUnit" defaultValue={settings.heightUnit} className="field">
                  <option value="cm">cm</option>
                  <option value="ft_in">ft/in</option>
                </select>
              </Field>
              <Field label="Weight unit">
                <select name="weightUnit" defaultValue={settings.weightUnit} className="field">
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Height value">
                <input
                  name="heightValue"
                  type="number"
                  step="0.1"
                  defaultValue={
                    settings.heightUnit === "ft_in"
                      ? heightFtIn?.feet
                      : (profile?.heightCm ?? "")
                  }
                  className="field"
                />
              </Field>
              <Field label="Height inches">
                <input
                  name="heightInches"
                  type="number"
                  step="0.1"
                  defaultValue={
                    settings.heightUnit === "ft_in"
                      ? heightFtIn?.inches.toFixed(1)
                      : ""
                  }
                  className="field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Water unit">
                <select name="waterUnit" defaultValue={settings.waterUnit} className="field">
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="cups">cups</option>
                </select>
              </Field>
              <Field label="Glucose unit">
                <select
                  name="bloodGlucoseUnit"
                  defaultValue={settings.bloodGlucoseUnit}
                  className="field"
                >
                  <option value="mmol_l">mmol/L</option>
                  <option value="mg_dl">mg/dL</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field label="Daily water goal">
                <input
                  name="dailyWaterGoal"
                  type="number"
                  step="1"
                  defaultValue={settings.dailyWaterGoalMl}
                  required
                  className="field"
                />
              </Field>
              <Field label="Goal unit">
                <select name="dailyWaterGoalUnit" defaultValue="ml" className="field">
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="cups">cups</option>
                </select>
              </Field>
            </div>

            <button type="submit" className="primary-button">
              Save settings
            </button>
          </form>
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
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
