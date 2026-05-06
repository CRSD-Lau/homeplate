import { describe, expect, it } from "vitest";

import { scaleNutrients, sumNutrients } from "./nutrition";

describe("nutrition calculations", () => {
  it("scales nutrients by quantity for food log snapshots", () => {
    const scaled = scaleNutrients(
      {
        calories: 100,
        proteinG: 10,
        carbsG: 12,
        fatG: 3,
        fibreG: 2,
        sugarG: 4,
        sodiumMg: 80,
      },
      1.5,
    );

    expect(scaled).toEqual({
      calories: 150,
      proteinG: 15,
      carbsG: 18,
      fatG: 4.5,
      fibreG: 3,
      sugarG: 6,
      sodiumMg: 120,
    });
  });

  it("sums daily nutrient snapshots without requiring optional fields", () => {
    const total = sumNutrients([
      { calories: 100, proteinG: 10, carbsG: 8, fatG: 2, fibreG: null },
      { calories: 50, proteinG: 3, carbsG: 5, fatG: 1, fibreG: 1 },
    ]);

    expect(total.calories).toBe(150);
    expect(total.proteinG).toBe(13);
    expect(total.fibreG).toBe(1);
  });
});
