import { isPlausibleBarcode, normalizeBarcode } from "./barcodes";
import type { NutrientSnapshot } from "./nutrition";

export type OpenFoodFactsSkipReason =
  | "missing_barcode"
  | "invalid_barcode"
  | "missing_name"
  | "wrong_country"
  | "obsolete_product"
  | "quality_errors"
  | "missing_serving"
  | "missing_nutrition"
  | "missing_macros";

export type ParsedOpenFoodFactsServing = {
  label: string;
  grams: number | null;
  millilitres: number | null;
};

export type ParsedOpenFoodFactsProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  defaultServing: ParsedOpenFoodFactsServing;
  additionalServings: ParsedOpenFoodFactsServing[];
  nutrients: NutrientSnapshot;
  countriesTags: string[];
  qualityWarnings: string[];
  raw: Record<string, unknown>;
};

export type OpenFoodFactsParseResult =
  | { ok: true; product: ParsedOpenFoodFactsProduct }
  | { ok: false; reason: OpenFoodFactsSkipReason };

const servingAmountPattern =
  /(\d+(?:[.,]\d+)?)\s*(kg|grams?|mg|g|fl\.?\s*oz|millilitres?|milliliters?|ml|dl|cl|l|oz)\b/i;

const checkedNutrientKeys = [
  "energy-kcal_serving",
  "energy-kcal_100g",
  "proteins_serving",
  "proteins_100g",
  "carbohydrates_serving",
  "carbohydrates_100g",
  "fat_serving",
  "fat_100g",
  "fiber_serving",
  "fiber_100g",
  "fibre_serving",
  "fibre_100g",
  "sugars_serving",
  "sugars_100g",
  "sodium_serving",
  "sodium_100g",
  "salt_serving",
  "salt_100g",
] as const;

export function parseOpenFoodFactsProduct(
  raw: Record<string, unknown>,
  options: { countries?: string[] } = {},
): OpenFoodFactsParseResult {
  const barcode = normalizeBarcode(stringField(raw.code));
  if (!barcode) return { ok: false, reason: "missing_barcode" };
  if (!isPlausibleBarcode(barcode)) {
    return { ok: false, reason: "invalid_barcode" };
  }

  const countriesTags = [
    ...arrayField(raw.countries_tags),
    ...arrayField(raw.main_countries_tags),
  ];
  if (!matchesAcceptedCountry(countriesTags, options.countries ?? [])) {
    return { ok: false, reason: "wrong_country" };
  }

  if (isObsolete(raw)) return { ok: false, reason: "obsolete_product" };

  if (arrayField(raw.data_quality_errors_tags).length > 0) {
    return { ok: false, reason: "quality_errors" };
  }

  const name = firstNonEmpty(
    stringField(raw.product_name),
    stringField(raw.product_name_en),
    stringField(raw.generic_name),
  );
  if (!name) return { ok: false, reason: "missing_name" };

  const serving = parseServing(raw);
  if (!serving) return { ok: false, reason: "missing_serving" };

  const nutriments = recordField(raw.nutriments);
  if (!nutriments) return { ok: false, reason: "missing_nutrition" };
  if (hasNegativeNutrientValue(nutriments)) {
    return { ok: false, reason: "missing_nutrition" };
  }

  const mappedNutrients = mapNutrients(nutriments, serving);
  if (
    mappedNutrients.calories === null ||
    mappedNutrients.proteinG === null ||
    mappedNutrients.carbsG === null ||
    mappedNutrients.fatG === null
  ) {
    return { ok: false, reason: "missing_macros" };
  }

  return {
    ok: true,
    product: {
      barcode,
      name,
      brand: firstNonEmpty(stringField(raw.brands), stringField(raw.brands_en)),
      defaultServing: serving,
      additionalServings:
        serving.grams !== null
          ? [{ label: "100 g", grams: 100, millilitres: null }]
          : [{ label: "100 ml", grams: null, millilitres: 100 }],
      nutrients: {
        calories: mappedNutrients.calories,
        proteinG: mappedNutrients.proteinG,
        carbsG: mappedNutrients.carbsG,
        fatG: mappedNutrients.fatG,
        fibreG: mappedNutrients.fibreG,
        sugarG: mappedNutrients.sugarG,
        sodiumMg: mappedNutrients.sodiumMg,
      },
      countriesTags,
      qualityWarnings: arrayField(raw.data_quality_warnings_tags),
      raw,
    },
  };
}

function matchesAcceptedCountry(countriesTags: string[], countries: string[]) {
  if (countries.length === 0) return true;

  const acceptedTags = countries.map(toCountryTag);
  const sourceTags = countriesTags.map((tag) => tag.trim().toLowerCase());
  return sourceTags.some((tag) => acceptedTags.includes(tag));
}

function isObsolete(raw: Record<string, unknown>) {
  return booleanField(raw.obsolete) || arrayField(raw.states_tags).includes("en:obsolete");
}

function parseServing(raw: Record<string, unknown>): ParsedOpenFoodFactsServing | null {
  const label = firstNonEmpty(
    stringField(raw.serving_size),
    stringField(raw.serving_size_en),
  );
  const textMatch = label?.match(servingAmountPattern) ?? null;
  const labelAmount = numericField(textMatch?.[1]);
  const labelUnit = parseServingUnit(textMatch?.[2]);
  const servingQuantity = positiveNumericField(raw.serving_quantity);
  const amount =
    servingQuantity ??
    (labelAmount !== null && labelUnit !== null ? labelAmount * labelUnit.factor : null);
  const unit = labelUnit?.kind ?? (servingQuantity !== null ? "g" : null);

  if (!label || amount === null || amount <= 0 || !unit) return null;

  return {
    label,
    grams: unit === "g" ? amount : null,
    millilitres: unit === "ml" ? amount : null,
  };
}

function mapNutrients(
  nutriments: Record<string, unknown>,
  serving: ParsedOpenFoodFactsServing,
) {
  const factor = (serving.grams ?? serving.millilitres ?? 0) / 100;
  const calories = nutrientPerServing(nutriments, "energy-kcal", factor);
  const proteinG = nutrientPerServing(nutriments, "proteins", factor);
  const carbsG = nutrientPerServing(nutriments, "carbohydrates", factor);
  const fatG = nutrientPerServing(nutriments, "fat", factor);
  const fibreG =
    nutrientPerServing(nutriments, "fiber", factor) ??
    nutrientPerServing(nutriments, "fibre", factor);
  const sugarG = nutrientPerServing(nutriments, "sugars", factor);
  const sodiumG =
    nutrientPerServing(nutriments, "sodium", factor) ??
    deriveSodiumFromSalt(nutriments, factor);

  return {
    calories: optionalRound(calories),
    proteinG: optionalRound(proteinG),
    carbsG: optionalRound(carbsG),
    fatG: optionalRound(fatG),
    fibreG: optionalRound(fibreG),
    sugarG: optionalRound(sugarG),
    sodiumMg: sodiumG === null ? null : round(sodiumG * 1000),
  };
}

function hasNegativeNutrientValue(nutriments: Record<string, unknown>) {
  return checkedNutrientKeys.some((key) => {
    const value = numericField(nutriments[key]);
    return value !== null && value < 0;
  });
}

function nutrientPerServing(
  nutriments: Record<string, unknown>,
  nutrient: string,
  factor: number,
) {
  return (
    numericField(nutriments[`${nutrient}_serving`]) ??
    scale100(numericField(nutriments[`${nutrient}_100g`]), factor)
  );
}

function deriveSodiumFromSalt(nutriments: Record<string, unknown>, factor: number) {
  const saltG = nutrientPerServing(nutriments, "salt", factor);
  return saltG === null ? null : saltG / 2.5;
}

function scale100(value: number | null, factor: number) {
  return value === null ? null : value * factor;
}

function optionalRound(value: number | null) {
  return value === null ? null : round(value);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function parseServingUnit(unit: string | undefined) {
  if (!unit) return null;
  const normalized = unit.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");

  switch (normalized) {
    case "kg":
      return { kind: "g", factor: 1000 } as const;
    case "g":
    case "gram":
    case "grams":
      return { kind: "g", factor: 1 } as const;
    case "mg":
      return { kind: "g", factor: 0.001 } as const;
    case "oz":
      return { kind: "g", factor: 28.3495 } as const;
    case "l":
      return { kind: "ml", factor: 1000 } as const;
    case "dl":
      return { kind: "ml", factor: 100 } as const;
    case "cl":
      return { kind: "ml", factor: 10 } as const;
    case "ml":
    case "millilitre":
    case "millilitres":
    case "milliliter":
    case "milliliters":
      return { kind: "ml", factor: 1 } as const;
    case "fl oz":
    case "floz":
      return { kind: "ml", factor: 29.5735 } as const;
    default:
      return null;
  }
}

function toCountryTag(country: string) {
  const normalized = country.trim().toLowerCase().replace(/\s+/g, "-");
  return normalized.startsWith("en:") ? normalized : `en:${normalized}`;
}

function firstNonEmpty(...values: (string | null)[]) {
  return values.find((value) => value !== null && value.length > 0) ?? null;
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function numericField(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const number = Number(value.trim().replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function positiveNumericField(value: unknown) {
  const number = numericField(value);
  return number !== null && number > 0 ? number : null;
}

function booleanField(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function arrayField(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function recordField(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length > 0 ? record : null;
}
