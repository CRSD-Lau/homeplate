export type DashboardPreferences = {
  calorieTarget: number | null;
  macroTargets: {
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
};

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  calorieTarget: null,
  macroTargets: {
    proteinG: null,
    carbsG: null,
    fatG: null,
  },
};

export function parseDashboardPreferences(
  value: unknown,
): DashboardPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_DASHBOARD_PREFERENCES;
  }

  const record = value as Record<string, unknown>;
  const macros =
    record.macroTargets && typeof record.macroTargets === "object"
      ? (record.macroTargets as Record<string, unknown>)
      : {};

  return {
    calorieTarget: positiveNumberOrNull(record.calorieTarget),
    macroTargets: {
      proteinG: positiveNumberOrNull(macros.proteinG),
      carbsG: positiveNumberOrNull(macros.carbsG),
      fatG: positiveNumberOrNull(macros.fatG),
    },
  };
}

export function serializeDashboardPreferences(
  preferences: DashboardPreferences,
): Record<string, unknown> {
  return {
    calorieTarget: preferences.calorieTarget,
    macroTargets: {
      proteinG: preferences.macroTargets.proteinG,
      carbsG: preferences.macroTargets.carbsG,
      fatG: preferences.macroTargets.fatG,
    },
  };
}

function positiveNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}
