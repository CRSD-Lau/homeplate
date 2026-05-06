"use client";

import { useState } from "react";

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
      <Field label="Display name">
        <input
          name="displayName"
          defaultValue={displayName}
          required
          className="field"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <Field label="Weight unit">
          <select name="weightUnit" defaultValue={weightUnit} className="field">
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </Field>
      </div>

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Water unit">
          <select name="waterUnit" defaultValue={waterUnit} className="field">
            <option value="ml">ml</option>
            <option value="oz">oz</option>
            <option value="cups">cups</option>
          </select>
        </Field>
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
      </div>

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
    <label className="block min-w-0">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
