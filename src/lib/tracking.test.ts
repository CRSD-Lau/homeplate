import { describe, expect, it } from "vitest";

import {
  ACTIVE_MEAL_TYPES,
  calculateMealTotals,
  calculateSavedMealTotals,
  calculateStepTotal,
  calculateWaterProgress,
  calculateWeightSummary,
  formatMealLabel,
  normalizeMealType,
} from "./tracking";

describe("tracking helpers", () => {
  it("orders six active meal sections and normalizes legacy snack logs", () => {
    expect(ACTIVE_MEAL_TYPES).toEqual([
      "breakfast",
      "morning_snack",
      "lunch",
      "afternoon_snack",
      "dinner",
      "evening_snack",
    ]);
    expect(normalizeMealType("snack")).toBe("afternoon_snack");
    expect(normalizeMealType("evening_snack")).toBe("evening_snack");
    expect(formatMealLabel("morning_snack")).toBe("Morning Snack");
  });

  it("calculates daily and per-meal nutrition totals with legacy snack folded into afternoon snack", () => {
    const totals = calculateMealTotals([
      {
        mealType: "breakfast",
        calories: 300,
        proteinG: 20,
        carbsG: 30,
        fatG: 10,
      },
      {
        mealType: "snack",
        calories: 125,
        proteinG: 5,
        carbsG: 18,
        fatG: 3,
      },
      {
        mealType: "afternoon_snack",
        calories: 75,
        proteinG: 2,
        carbsG: 10,
        fatG: 2,
      },
    ]);

    expect(totals.daily.calories).toBe(500);
    expect(totals.byMeal.breakfast.calories).toBe(300);
    expect(totals.byMeal.afternoon_snack.calories).toBe(200);
    expect(totals.byMeal.morning_snack.calories).toBe(0);
  });

  it("calculates meal review macro totals", () => {
    const totals = calculateMealTotals([
      {
        mealType: "dinner",
        calories: 450,
        proteinG: 32,
        carbsG: 41,
        fatG: 14,
        fibreG: 8,
        sodiumMg: 500,
      },
      {
        mealType: "dinner",
        calories: 150,
        proteinG: 4,
        carbsG: 22,
        fatG: 5,
        fibreG: 2,
        sodiumMg: 180,
      },
    ]);

    expect(totals.byMeal.dinner).toMatchObject({
      calories: 600,
      proteinG: 36,
      carbsG: 63,
      fatG: 19,
      fibreG: 10,
      sodiumMg: 680,
    });
  });

  it("calculates saved meal add-all snapshot totals from default serving nutrients", () => {
    const totals = calculateSavedMealTotals([
      {
        quantity: 2,
        calories: 110,
        proteinG: 3,
        carbsG: 21,
        fatG: 1,
      },
      {
        quantity: 0.5,
        calories: 200,
        proteinG: 10,
        carbsG: 8,
        fatG: 12,
      },
    ]);

    expect(totals).toEqual({
      calories: 320,
      proteinG: 11,
      carbsG: 46,
      fatG: 8,
      fibreG: null,
      sugarG: null,
      sodiumMg: null,
    });
  });

  it("calculates water progress over twelve tappable units", () => {
    const progress = calculateWaterProgress({
      totalMl: 1000,
      goalMl: 3000,
    });

    expect(progress.unitMl).toBe(250);
    expect(progress.filledUnits).toBe(4);
    expect(progress.totalUnits).toBe(12);
    expect(progress.percent).toBe(33);
    expect(progress.remainingMl).toBe(2000);
  });

  it("calculates weight start, current, change, and direction", () => {
    const summary = calculateWeightSummary([
      {
        logDate: "2026-05-04",
        loggedAt: new Date("2026-05-04T12:00:00Z"),
        weightKg: 100,
      },
      {
        logDate: "2026-05-01",
        loggedAt: new Date("2026-05-01T12:00:00Z"),
        weightKg: 110,
      },
      {
        logDate: "2026-05-05",
        loggedAt: new Date("2026-05-05T12:00:00Z"),
        weightKg: 98,
      },
    ]);

    expect(summary).toEqual({
      startKg: 110,
      currentKg: 98,
      changeKg: -12,
      direction: "down",
    });
  });

  it("calculates manual step totals", () => {
    expect(calculateStepTotal([{ steps: 1200 }, { steps: 3800 }])).toBe(5000);
  });
});
