"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { updateSettingsAction } from "@/app/actions";
import { cmToFtIn } from "@/lib/units";

type SettingsFormProps = {
  displayName: string;
  heightCm: number | null;
  heightUnit: "cm" | "ft_in";
  weightUnit: "lb" | "kg";
  waterUnit: "ml" | "oz" | "cups";
  bloodGlucoseUnit: "mmol_l" | "mg_dl";
  dailyWaterGoalMl: number;
};

export function SettingsForm({
  displayName,
  heightCm,
  heightUnit,
  weightUnit,
  waterUnit,
  bloodGlucoseUnit,
  dailyWaterGoalMl,
}: SettingsFormProps) {
  const [selectedHeightUnit, setSelectedHeightUnit] = useState(heightUnit);
  const heightFtIn = heightCm ? cmToFtIn(heightCm) : null;

  return (
    <form action={updateSettingsAction} className="space-y-4">
      <SettingsSection
        title="Profile details"
        description="Store household profile details used for display and BMI calculations."
      >
        <Field label="Display name">
          <input
            name="displayName"
            defaultValue={displayName}
            required
            className="field"
          />
        </Field>

        <Field label="Height unit">
          <select
            name="heightUnit"
            value={selectedHeightUnit}
            onChange={(event) =>
              setSelectedHeightUnit(event.target.value as "cm" | "ft_in")
            }
            className="field"
          >
            <option value="cm">cm</option>
            <option value="ft_in">ft/in</option>
          </select>
        </Field>

        {selectedHeightUnit === "cm" ? (
          <Field label="Height (cm)">
            <input
              name="heightValue"
              type="number"
              inputMode="decimal"
              min="50"
              max="260"
              step="0.1"
              defaultValue={heightCm ?? ""}
              placeholder="183"
              className="field"
            />
            <input name="heightInches" type="hidden" value="0" />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Feet">
              <input
                name="heightValue"
                type="number"
                inputMode="numeric"
                min="1"
                max="8"
                step="1"
                defaultValue={heightFtIn?.feet ?? ""}
                placeholder="6"
                className="field"
              />
            </Field>
            <Field label="Inches">
              <input
                name="heightInches"
                type="number"
                inputMode="decimal"
                min="0"
                max="11"
                step="0.1"
                defaultValue={heightFtIn ? heightFtIn.inches.toFixed(1) : ""}
                placeholder="0"
                className="field"
              />
            </Field>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Measurement preferences"
        description="These controls choose the units used by logging screens. Body weight is entered on the Weight page."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Preferred weight unit"
            hint="Sets the unit for new weight logs only."
          >
            <select
              name="weightUnit"
              defaultValue={weightUnit}
              className="field"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </Field>
          <Field label="Water unit">
            <select name="waterUnit" defaultValue={waterUnit} className="field">
              <option value="ml">ml</option>
              <option value="oz">oz</option>
              <option value="cups">cups</option>
            </select>
          </Field>
        </div>

        <Field label="Glucose unit">
          <select
            name="bloodGlucoseUnit"
            defaultValue={bloodGlucoseUnit}
            className="field"
          >
            <option value="mmol_l">mmol/L</option>
            <option value="mg_dl">mg/dL</option>
          </select>
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Daily targets"
        description="Set simple household wellness targets for dashboard progress."
      >
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
          <Field label="Daily water goal">
            <input
              name="dailyWaterGoal"
              type="number"
              inputMode="decimal"
              step="1"
              defaultValue={dailyWaterGoalMl}
              required
              className="field"
            />
          </Field>
          <Field label="Goal unit">
            <select
              name="dailyWaterGoalUnit"
              defaultValue="ml"
              className="field"
            >
              <option value="ml">ml</option>
              <option value="oz">oz</option>
              <option value="cups">cups</option>
            </select>
          </Field>
        </div>
      </SettingsSection>

      <button type="submit" className="primary-button">
        Save settings
      </button>
    </form>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/60 sm:p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? (
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-300">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
