import { describe, expect, it } from "vitest";

import {
  calculateServingScale,
  scaleNutrientsForServing,
  scaleNutrients,
  sumNutrients,
} from "./nutrition";

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

  it("scales nutrients from the default gram serving to another serving", () => {
    const scaled = scaleNutrientsForServing(
      {
        calories: 100,
        proteinG: 10,
        carbsG: 12,
        fatG: 3,
      },
      {
        baseServing: {
          id: "base",
          isDefault: true,
          grams: 100,
          millilitres: null,
        },
        selectedServing: {
          id: "bowl",
          isDefault: false,
          grams: 250,
          millilitres: null,
        },
        quantity: 2,
      },
    );

    expect(scaled).toEqual({
      calories: 500,
      proteinG: 50,
      carbsG: 60,
      fatG: 15,
      fibreG: null,
      sugarG: null,
      sodiumMg: null,
    });
  });

  it("scales nutrients from the default millilitre serving to another serving", () => {
    expect(
      calculateServingScale({
        baseServing: {
          id: "base",
          isDefault: true,
          grams: null,
          millilitres: 250,
        },
        selectedServing: {
          id: "small",
          isDefault: false,
          grams: null,
          millilitres: 125,
        },
        quantity: 3,
      }),
    ).toBe(1.5);
  });

  it("uses quantity directly for the default serving even without conversion values", () => {
    expect(
      calculateServingScale({
        baseServing: {
          id: "base",
          isDefault: true,
          grams: null,
          millilitres: null,
        },
        selectedServing: {
          id: "base",
          isDefault: true,
          grams: null,
          millilitres: null,
        },
        quantity: 1.25,
      }),
    ).toBe(1.25);
  });

  it("returns null when a non-default serving cannot be converted", () => {
    expect(
      scaleNutrientsForServing(
        {
          calories: 100,
          proteinG: 10,
          carbsG: 12,
          fatG: 3,
        },
        {
          baseServing: {
            id: "base",
            isDefault: true,
            grams: 100,
            millilitres: null,
          },
          selectedServing: {
            id: "mystery",
            isDefault: false,
            grams: null,
            millilitres: null,
          },
          quantity: 1,
        },
      ),
    ).toBeNull();
  });
});
