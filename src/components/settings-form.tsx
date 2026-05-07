"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { updateSettingsAction } from "@/app/actions";
import type { DashboardPreferences } from "@/lib/dashboard-preferences";
import {
  cmToFtIn,
  formatNumber,
  kgToLb,
  mlToOz,
  ML_PER_CANADIAN_CUP,
} from "@/lib/units";

type SettingsFormProps = {
  displayName: string;
  heightCm: number | null;
  heightUnit: "cm" | "ft_in";
  weightUnit: "lb" | "kg";
  waterUnit: "ml" | "oz" | "cups";
  bloodGlucoseUnit: "mmol_l" | "mg_dl";
  dailyWaterGoalMl: number;
  goalWeightKg: number | null;
  dashboardPreferences: DashboardPreferences;
  today: string;
  startingWeightText: string | null;
};

export function SettingsForm({
  displayName,
  heightCm,
  heightUnit,
  weightUnit,
  waterUnit,
  bloodGlucoseUnit,
  dailyWaterGoalMl,
  goalWeightKg,
  dashboardPreferences,
  today,
  startingWeightText,
}: SettingsFormProps) {
  const [selectedHeightUnit, setSelectedHeightUnit] = useState(heightUnit);
  const [selectedWeightUnit, setSelectedWeightUnit] = useState(weightUnit);
  const [selectedWaterUnit, setSelectedWaterUnit] = useState(waterUnit);
  const heightFtIn = heightCm ? cmToFtIn(heightCm) : null;
  const dailyWaterGoalValue =
    selectedWaterUnit === "oz"
      ? formatNumber(mlToOz(dailyWaterGoalMl), 1)
      : selectedWaterUnit === "cups"
        ? formatNumber(dailyWaterGoalMl / ML_PER_CANADIAN_CUP, 1)
        : dailyWaterGoalMl;
  const goalWeightValue =
    goalWeightKg === null
      ? ""
      : selectedWeightUnit === "lb"
        ? formatNumber(kgToLb(goalWeightKg), 1)
        : formatNumber(goalWeightKg, 1);

  return (
    <form action={updateSettingsAction} className="space-y-4">
      <SettingsSection
        title="Profile"
        description="Name and height used for display and BMI."
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
        title="Units"
        description="Preferred units for logging screens."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Preferred weight unit"
            hint="Sets the unit for starting weight and new weight logs."
          >
            <select
              name="weightUnit"
              value={selectedWeightUnit}
              onChange={(event) =>
                setSelectedWeightUnit(event.target.value as "lb" | "kg")
              }
              className="field"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </Field>
          <Field label="Water unit">
            <select
              name="waterUnit"
              value={selectedWaterUnit}
              onChange={(event) =>
                setSelectedWaterUnit(event.target.value as "ml" | "oz" | "cups")
              }
              className="field"
            >
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
        title="Starting point"
        description="Optional baseline weight."
      >
        {startingWeightText ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
            Current starting point: {startingWeightText}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
          <Field
            label={`Starting weight (${selectedWeightUnit})`}
            hint="Leave blank unless you want to add an initial baseline weight."
          >
            <input
              name="startingWeightValue"
              type="number"
              inputMode="decimal"
              min={selectedWeightUnit === "lb" ? 50 : 20}
              max={selectedWeightUnit === "lb" ? 800 : 360}
              step="0.1"
              placeholder={selectedWeightUnit === "lb" ? "210" : "95"}
              className="field"
            />
            <input
              name="startingWeightUnit"
              type="hidden"
              value={selectedWeightUnit}
            />
          </Field>
          <Field label="Date">
            <input
              name="startingWeightDate"
              type="date"
              defaultValue={today}
              className="field"
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Goals"
        description="Targets for dashboard progress."
      >
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
          <Field label="Daily water goal">
            <input
              name="dailyWaterGoal"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={dailyWaterGoalValue}
              required
              className="field"
            />
          </Field>
          <Field label="Goal unit">
            <select
              name="dailyWaterGoalUnit"
              value={selectedWaterUnit}
              onChange={(event) =>
                setSelectedWaterUnit(event.target.value as "ml" | "oz" | "cups")
              }
              className="field"
            >
              <option value="ml">ml</option>
              <option value="oz">oz</option>
              <option value="cups">cups</option>
            </select>
          </Field>
        </div>
        <Field label="Daily calories target">
          <input
            name="calorieTarget"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            defaultValue={dashboardPreferences.calorieTarget ?? ""}
            placeholder="2100"
            className="field"
          />
        </Field>
        <Field label={`Goal weight (${selectedWeightUnit})`}>
          <input
            name="goalWeightValue"
            type="number"
            inputMode="decimal"
            min={selectedWeightUnit === "lb" ? 50 : 20}
            max={selectedWeightUnit === "lb" ? 800 : 360}
            step="0.1"
            defaultValue={goalWeightValue}
            placeholder={selectedWeightUnit === "lb" ? "185" : "84"}
            className="field"
          />
          <input name="goalWeightUnit" type="hidden" value={selectedWeightUnit} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein g">
            <input
              name="proteinTargetG"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              defaultValue={dashboardPreferences.macroTargets.proteinG ?? ""}
              className="field"
            />
          </Field>
          <Field label="Carbs g">
            <input
              name="carbsTargetG"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              defaultValue={dashboardPreferences.macroTargets.carbsG ?? ""}
              className="field"
            />
          </Field>
          <Field label="Fat g">
            <input
              name="fatTargetG"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              defaultValue={dashboardPreferences.macroTargets.fatG ?? ""}
              className="field"
            />
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
    <section className="space-y-3 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-soft)]/60 p-3 sm:p-4">
      <div>
        <h3 className="text-base font-extrabold text-[var(--brand-ink)]">
          {title}
        </h3>
        <p className="mt-1 text-xs font-medium leading-5 text-[var(--brand-muted)]">
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
      <span className="text-sm font-bold text-[var(--brand-ink)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? (
        <span className="mt-1 block text-xs font-medium leading-5 text-[var(--brand-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
