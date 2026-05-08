import { describe, expect, it } from "vitest";

import { parseOpenFoodFactsProduct } from "./open-food-facts";

const baseProduct = {
  code: " 0 12345-67890 5 ",
  product_name: "Crunchy Granola Bar",
  brands: "Home Brand",
  serving_size: "1 bar (42 g)",
  serving_quantity: 42,
  nutrition_data_per: "serving",
  countries_tags: ["en:canada"],
  data_quality_errors_tags: [],
  data_quality_warnings_tags: ["en:nutrition-value-over-105"],
  nutriments: {
    "energy-kcal_serving": 190,
    proteins_serving: 6,
    carbohydrates_serving: 25,
    fat_serving: 7,
    fiber_serving: 3,
    sugars_serving: 9,
    sodium_serving: 0.12,
  },
};

describe("parseOpenFoodFactsProduct", () => {
  it("maps label serving grams as the default HomePlate serving", () => {
    const parsed = parseOpenFoodFactsProduct(baseProduct, {
      countries: ["canada", "united-states"],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.product.barcode).toBe("012345678905");
    expect(parsed.product.name).toBe("Crunchy Granola Bar");
    expect(parsed.product.brand).toBe("Home Brand");
    expect(parsed.product.defaultServing).toEqual({
      label: "1 bar (42 g)",
      grams: 42,
      millilitres: null,
    });
    expect(parsed.product.nutrients).toMatchObject({
      calories: 190,
      proteinG: 6,
      carbsG: 25,
      fatG: 7,
      fibreG: 3,
      sugarG: 9,
      sodiumMg: 120,
    });
    expect(parsed.product.additionalServings).toContainEqual({
      label: "100 g",
      grams: 100,
      millilitres: null,
    });
    expect(parsed.product.qualityWarnings).toEqual(["en:nutrition-value-over-105"]);
    expect(parsed.product.raw).toBe(baseProduct);
  });

  it("maps millilitre label servings from 100g nutrient values", () => {
    const parsed = parseOpenFoodFactsProduct(
      {
        ...baseProduct,
        serving_size: "1 bottle (500 ml)",
        serving_quantity: 500,
        nutriments: {
          "energy-kcal_100g": 40,
          proteins_100g: 0,
          carbohydrates_100g: 10,
          fat_100g: 0,
          sugars_100g: 9,
          sodium_100g: 0.01,
        },
      },
      { countries: ["canada"] },
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.product.defaultServing).toEqual({
      label: "1 bottle (500 ml)",
      grams: null,
      millilitres: 500,
    });
    expect(parsed.product.nutrients.calories).toBe(200);
    expect(parsed.product.nutrients.carbsG).toBe(50);
    expect(parsed.product.nutrients.sugarG).toBe(45);
    expect(parsed.product.nutrients.sodiumMg).toBe(50);
    expect(parsed.product.additionalServings).toContainEqual({
      label: "100 ml",
      grams: null,
      millilitres: 100,
    });
  });

  it("maps full-word millilitre labels as millilitres instead of grams", () => {
    const parsed = parseOpenFoodFactsProduct(
      {
        ...baseProduct,
        serving_size: "500 milliliters",
        serving_quantity: 500,
        nutriments: {
          "energy-kcal_100g": 40,
          proteins_100g: 0,
          carbohydrates_100g: 10,
          fat_100g: 0,
        },
      },
      { countries: ["canada"] },
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.product.defaultServing).toEqual({
      label: "500 milliliters",
      grams: null,
      millilitres: 500,
    });
    expect(parsed.product.nutrients.calories).toBe(200);
  });

  it("uses serving quantity as the canonical amount for supported label units", () => {
    const cases = [
      {
        servingSize: "1L",
        servingQuantity: 1000,
        defaultServing: { label: "1L", grams: null, millilitres: 1000 },
        caloriesPer100: 10,
        calories: 100,
      },
      {
        servingSize: "8 fl oz",
        servingQuantity: 240,
        defaultServing: { label: "8 fl oz", grams: null, millilitres: 240 },
        caloriesPer100: 50,
        calories: 120,
      },
      {
        servingSize: "2 x 25 g",
        servingQuantity: 50,
        defaultServing: { label: "2 x 25 g", grams: 50, millilitres: null },
        caloriesPer100: 200,
        calories: 100,
      },
    ];

    for (const testCase of cases) {
      const parsed = parseOpenFoodFactsProduct(
        {
          ...baseProduct,
          serving_size: testCase.servingSize,
          serving_quantity: testCase.servingQuantity,
          nutriments: {
            "energy-kcal_100g": testCase.caloriesPer100,
            proteins_100g: 1,
            carbohydrates_100g: 2,
            fat_100g: 0,
          },
        },
        { countries: ["canada"] },
      );

      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      expect(parsed.product.defaultServing).toEqual(testCase.defaultServing);
      expect(parsed.product.nutrients.calories).toBe(testCase.calories);
    }
  });

  it("uses serving quantity as grams when the label has no explicit unit", () => {
    const parsed = parseOpenFoodFactsProduct(
      {
        ...baseProduct,
        serving_size: "1 cup",
        serving_quantity: 55,
        nutriments: {
          "energy-kcal_100g": 200,
          proteins_100g: 10,
          carbohydrates_100g: 20,
          fat_100g: 4,
          sodium_100g: 0.02,
        },
      },
      { countries: ["canada"] },
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.product.defaultServing).toEqual({
      label: "1 cup",
      grams: 55,
      millilitres: null,
    });
    expect(parsed.product.nutrients).toMatchObject({
      calories: 110,
      proteinG: 5.5,
      carbsG: 11,
      fatG: 2.2,
      sodiumMg: 11,
    });
  });

  it("derives sodium from salt when sodium is absent", () => {
    const parsed = parseOpenFoodFactsProduct(
      {
        ...baseProduct,
        nutrition_data_per: "100g",
        nutriments: {
          "energy-kcal_100g": 100,
          proteins_100g: 10,
          carbohydrates_100g: 5,
          fat_100g: 2,
          salt_100g: 1,
        },
      },
      { countries: ["canada"] },
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.product.nutrients.sodiumMg).toBe(168);
  });

  it("matches country filters against Open Food Facts country tags", () => {
    const parsed = parseOpenFoodFactsProduct(
      {
        ...baseProduct,
        countries_tags: ["en:united-states"],
      },
      { countries: ["united-states"] },
    );

    expect(parsed.ok).toBe(true);
  });

  it("rejects negative nutrition values", () => {
    expect(
      parseOpenFoodFactsProduct(
        {
          ...baseProduct,
          nutriments: {
            "energy-kcal_serving": -10,
            proteins_serving: 6,
            carbohydrates_serving: 25,
            fat_serving: 7,
          },
        },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_nutrition" });

    expect(
      parseOpenFoodFactsProduct(
        {
          ...baseProduct,
          nutriments: {
            "energy-kcal_serving": 190,
            proteins_serving: 6,
            carbohydrates_serving: 25,
            fat_serving: 7,
            fiber_serving: -1,
          },
        },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_nutrition" });
  });

  it("returns stable skip reasons for unusable products", () => {
    expect(parseOpenFoodFactsProduct({}, { countries: ["canada"] })).toEqual({
      ok: false,
      reason: "missing_barcode",
    });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, code: "1234567" },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "invalid_barcode" });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, product_name: "", product_name_en: "", generic_name: "" },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_name" });

    expect(
      parseOpenFoodFactsProduct(baseProduct, { countries: ["france"] }),
    ).toEqual({ ok: false, reason: "wrong_country" });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, obsolete: true },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "obsolete_product" });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, data_quality_errors_tags: ["en:invalid-nutrition"] },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "quality_errors" });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, serving_size: "1 bar", serving_quantity: null },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_serving" });

    expect(
      parseOpenFoodFactsProduct(
        { ...baseProduct, nutriments: null },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_nutrition" });

    expect(
      parseOpenFoodFactsProduct(
        {
          ...baseProduct,
          nutriments: {
            "energy-kcal_serving": 190,
            proteins_serving: 6,
            fat_serving: 7,
          },
        },
        { countries: ["canada"] },
      ),
    ).toEqual({ ok: false, reason: "missing_macros" });
  });
});
