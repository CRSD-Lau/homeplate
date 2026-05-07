import { scaleNutrients, sumNutrients, type NutrientSnapshot } from "./nutrition";

export const ACTIVE_MEAL_TYPES = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
] as const;

export const ALL_MEAL_TYPES = [...ACTIVE_MEAL_TYPES, "snack"] as const;

export type ActiveMealType = (typeof ACTIVE_MEAL_TYPES)[number];
export type MealType = (typeof ALL_MEAL_TYPES)[number];

const mealLabels: Record<ActiveMealType, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  evening_snack: "Evening Snack",
};

export type MealNutrientInput = NutrientSnapshot & {
  mealType: MealType | string;
};

export function normalizeMealType(mealType: MealType | string): ActiveMealType {
  if (mealType === "snack") return "afternoon_snack";
  if (ACTIVE_MEAL_TYPES.includes(mealType as ActiveMealType)) {
    return mealType as ActiveMealType;
  }

  return "afternoon_snack";
}

export function formatMealLabel(mealType: MealType | string) {
  return mealLabels[normalizeMealType(mealType)];
}

export function calculateMealTotals(items: MealNutrientInput[]) {
  const byMeal = Object.fromEntries(
    ACTIVE_MEAL_TYPES.map((mealType) => [
      mealType,
      sumNutrients([]),
    ]),
  ) as Record<ActiveMealType, NutrientSnapshot>;

  for (const item of items) {
    const mealType = normalizeMealType(item.mealType);
    byMeal[mealType] = sumNutrients([byMeal[mealType], item]);
  }

  return {
    byMeal,
    daily: sumNutrients(ACTIVE_MEAL_TYPES.map((mealType) => byMeal[mealType])),
  };
}

export type SavedMealNutrientInput = NutrientSnapshot & {
  quantity: number;
};

export function calculateSavedMealTotals(items: SavedMealNutrientInput[]) {
  return sumNutrients(items.map((item) => scaleNutrients(item, item.quantity)));
}

export function calculateWaterProgress({
  totalMl,
  goalMl,
  totalUnits = 12,
}: {
  totalMl: number;
  goalMl: number;
  totalUnits?: number;
}) {
  const safeGoalMl = Math.max(1, goalMl);
  const unitMl = safeGoalMl / totalUnits;
  const filledUnits = Math.min(totalUnits, Math.floor(totalMl / unitMl));

  return {
    totalUnits,
    unitMl,
    filledUnits,
    percent: Math.min(100, Math.round((totalMl / safeGoalMl) * 100)),
    remainingMl: Math.max(0, safeGoalMl - totalMl),
  };
}

export function calculateStepTotal(items: { steps: number }[]) {
  return items.reduce((total, item) => total + item.steps, 0);
}

export type WeightSummaryLog = {
  logDate: string;
  loggedAt: Date | string;
  weightKg: number;
};

export function calculateWeightSummary(logs: WeightSummaryLog[]) {
  if (logs.length === 0) {
    return {
      startKg: null,
      currentKg: null,
      changeKg: null,
      direction: "flat" as const,
    };
  }

  const sorted = [...logs].sort(compareWeightLogs);
  const startKg = sorted[0].weightKg;
  const currentKg = sorted[sorted.length - 1].weightKg;
  const changeKg = currentKg - startKg;

  return {
    startKg,
    currentKg,
    changeKg,
    direction:
      changeKg < 0 ? ("down" as const) : changeKg > 0 ? ("up" as const) : ("flat" as const),
  };
}

function compareWeightLogs(left: WeightSummaryLog, right: WeightSummaryLog) {
  const dateCompare = left.logDate.localeCompare(right.logDate);
  if (dateCompare !== 0) return dateCompare;

  return (
    new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime()
  );
}
