import { describe, expect, it } from "vitest";

import { buildCopiedFoodLogs } from "./food-copy";

describe("food copy helpers", () => {
  it("recalculates copied items from current food nutrition", () => {
    const result = buildCopiedFoodLogs({
      userId: "user-1",
      logDate: "2026-05-08",
      mealType: "breakfast",
      sourceItems: [
        {
          foodId: "food-1",
          servingId: "serving-cup",
          quantity: 2,
          notes: "usual",
        },
      ],
      currentItemsByKey: new Map([
        [
          "food-1|serving-cup",
          {
            foodId: "food-1",
            servingId: "serving-cup",
            foodName: "Greek Yogurt",
            brand: "House",
            confidenceStatus: "manual",
            servingLabel: "1 cup",
            baseServing: {
              id: "serving-base",
              isDefault: true,
              grams: 100,
              millilitres: null,
            },
            selectedServing: {
              id: "serving-cup",
              isDefault: false,
              grams: 250,
              millilitres: null,
            },
            nutrients: {
              calories: 120,
              proteinG: 11,
              carbsG: 8,
              fatG: 2,
              fibreG: null,
              sugarG: 5,
              sodiumMg: 60,
            },
          },
        ],
      ]),
    });

    expect(result.skippedCount).toBe(0);
    expect(result.logs).toEqual([
      expect.objectContaining({
        userId: "user-1",
        foodId: "food-1",
        servingId: "serving-cup",
        logDate: "2026-05-08",
        mealType: "breakfast",
        quantity: 2,
        foodNameSnapshot: "House Greek Yogurt",
        servingLabelSnapshot: "1 cup",
        caloriesSnapshot: 600,
        proteinGSnapshot: 55,
        carbsGSnapshot: 40,
        fatGSnapshot: 10,
        sugarGSnapshot: 25,
        sodiumMgSnapshot: 300,
        notes: "usual",
      }),
    ]);
  });

  it("skips copied items that no longer resolve to current food data", () => {
    const result = buildCopiedFoodLogs({
      userId: "user-1",
      logDate: "2026-05-08",
      mealType: "lunch",
      sourceItems: [
        { foodId: "missing", servingId: "gone", quantity: 1, notes: null },
        { foodId: null, servingId: null, quantity: 1, notes: null },
      ],
      currentItemsByKey: new Map(),
    });

    expect(result.logs).toEqual([]);
    expect(result.skippedCount).toBe(2);
  });
});
