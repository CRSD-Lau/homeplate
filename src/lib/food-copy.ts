import {
  scaleNutrientsForServing,
  type NutrientSnapshot,
  type ServingConversion,
} from "./nutrition";
import type { MealType } from "./tracking";

type SourceMealItem = {
  foodId: string | null;
  servingId: string | null;
  quantity: number;
  notes: string | null;
};

export type CurrentCopyFoodItem = {
  foodId: string;
  servingId: string;
  foodName: string;
  brand: string | null;
  confidenceStatus: string;
  servingLabel: string | null;
  baseServing: ServingConversion;
  selectedServing: ServingConversion;
  nutrients: NutrientSnapshot;
};

export type CopiedFoodLogValue = {
  userId: string;
  foodId: string;
  servingId: string;
  logDate: string;
  mealType: MealType;
  quantity: number;
  foodNameSnapshot: string;
  servingLabelSnapshot: string | null;
  caloriesSnapshot: number;
  proteinGSnapshot: number;
  carbsGSnapshot: number;
  fatGSnapshot: number;
  fibreGSnapshot: number | null;
  sugarGSnapshot: number | null;
  sodiumMgSnapshot: number | null;
  sourceSnapshot: Record<string, unknown>;
  notes: string | null;
};

export function buildCopiedFoodLogs({
  userId,
  logDate,
  mealType,
  sourceItems,
  currentItemsByKey,
}: {
  userId: string;
  logDate: string;
  mealType: MealType;
  sourceItems: SourceMealItem[];
  currentItemsByKey: Map<string, CurrentCopyFoodItem>;
}) {
  const logs: CopiedFoodLogValue[] = [];
  let skippedCount = 0;

  for (const item of sourceItems) {
    const current =
      item.foodId && item.servingId
        ? currentItemsByKey.get(`${item.foodId}|${item.servingId}`)
        : null;

    if (!current) {
      skippedCount += 1;
      continue;
    }

    const scaled = scaleNutrientsForServing(current.nutrients, {
      baseServing: current.baseServing,
      selectedServing: current.selectedServing,
      quantity: item.quantity,
    });

    if (!scaled) {
      skippedCount += 1;
      continue;
    }

    logs.push({
      userId,
      foodId: current.foodId,
      servingId: current.servingId,
      logDate,
      mealType,
      quantity: item.quantity,
      foodNameSnapshot: current.brand
        ? `${current.brand} ${current.foodName}`
        : current.foodName,
      servingLabelSnapshot: current.servingLabel,
      caloriesSnapshot: scaled.calories,
      proteinGSnapshot: scaled.proteinG,
      carbsGSnapshot: scaled.carbsG,
      fatGSnapshot: scaled.fatG,
      fibreGSnapshot: scaled.fibreG ?? null,
      sugarGSnapshot: scaled.sugarG ?? null,
      sodiumMgSnapshot: scaled.sodiumMg ?? null,
      sourceSnapshot: {
        confidenceStatus: current.confidenceStatus,
        source: "copied_meal",
      },
      notes: item.notes,
    });
  }

  return { logs, skippedCount };
}
