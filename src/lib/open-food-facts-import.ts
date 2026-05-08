import { and, eq } from "drizzle-orm";

import { getDb } from "../db";
import {
  dataSources,
  foodNutrientValues,
  foods,
  importRuns,
  servings,
  sourceRecords,
} from "../db/schema";
import type {
  OpenFoodFactsSkipReason,
  ParsedOpenFoodFactsProduct,
} from "./open-food-facts";

export type OpenFoodFactsImportSummary = Record<string, unknown> & {
  seen: number;
  accepted: number;
  skipped: number;
  skipReasons: Partial<Record<OpenFoodFactsSkipReason, number>>;
  warnings: Record<string, number>;
};

type ImportResult =
  | { ok: true; barcode: string; warnings?: string[] }
  | { ok: false; reason: OpenFoodFactsSkipReason };

type OpenFoodFactsConfidenceStatus = "imported" | "provisional";

export function createImportSummary(): OpenFoodFactsImportSummary {
  return { seen: 0, accepted: 0, skipped: 0, skipReasons: {}, warnings: {} };
}

export function recordImportResult(
  summary: OpenFoodFactsImportSummary,
  result: ImportResult,
) {
  summary.seen += 1;

  if (result.ok) {
    summary.accepted += 1;
    for (const warning of result.warnings ?? []) {
      summary.warnings[warning] = (summary.warnings[warning] ?? 0) + 1;
    }
    return;
  }

  summary.skipped += 1;
  summary.skipReasons[result.reason] =
    (summary.skipReasons[result.reason] ?? 0) + 1;
}

export async function getOpenFoodFactsDataSourceId() {
  const db = getDb();
  const [existing] = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(eq(dataSources.name, "Open Food Facts"))
    .limit(1);

  if (existing) return existing.id;

  const [source] = await db
    .insert(dataSources)
    .values({
      name: "Open Food Facts",
      sourceType: "open_food_facts",
      licenseName: "Open Database License (ODbL)",
      attribution: "Product data from Open Food Facts.",
    })
    .returning({ id: dataSources.id });

  return source.id;
}

export async function startOpenFoodFactsImportRun(
  sourceFileName: string | null,
) {
  const dataSourceId = await getOpenFoodFactsDataSourceId();
  const [run] = await getDb()
    .insert(importRuns)
    .values({ dataSourceId, status: "started", sourceFileName })
    .returning({ id: importRuns.id, dataSourceId: importRuns.dataSourceId });

  return run;
}

export async function finishOpenFoodFactsImportRun(
  importRunId: string,
  status: "completed" | "failed",
  summary: OpenFoodFactsImportSummary,
) {
  await getDb()
    .update(importRuns)
    .set({ status, completedAt: new Date(), summary })
    .where(eq(importRuns.id, importRunId));
}

export async function upsertOpenFoodFactsProduct({
  dataSourceId,
  importRunId,
  product,
  confidenceStatus = "imported",
}: {
  dataSourceId: string;
  importRunId: string | null;
  product: ParsedOpenFoodFactsProduct;
  confidenceStatus?: OpenFoodFactsConfidenceStatus;
}) {
  await upsertSourceRecord({ dataSourceId, importRunId, product });

  const food = await upsertFood({
    dataSourceId,
    product,
    confidenceStatus,
  });
  if (!food.shouldUpdateServings) return food.id;

  const defaultServingId = await upsertDefaultServing(food.id, product);

  await upsertDefaultNutrients(food.id, defaultServingId, product);
  await createMissingAdditionalServings(food.id, product);

  return food.id;
}

async function upsertSourceRecord({
  dataSourceId,
  importRunId,
  product,
}: {
  dataSourceId: string;
  importRunId: string | null;
  product: ParsedOpenFoodFactsProduct;
}) {
  const db = getDb();
  const [existingSourceRecord] = await db
    .select({ id: sourceRecords.id })
    .from(sourceRecords)
    .where(
      and(
        eq(sourceRecords.dataSourceId, dataSourceId),
        eq(sourceRecords.externalId, product.barcode),
      ),
    )
    .limit(1);

  const values = {
    importRunId,
    barcode: product.barcode,
    rawPayload: product.raw,
    fetchedAt: new Date(),
  };

  if (existingSourceRecord) {
    await db
      .update(sourceRecords)
      .set(values)
      .where(eq(sourceRecords.id, existingSourceRecord.id));
    return;
  }

  await db.insert(sourceRecords).values({
    dataSourceId,
    externalId: product.barcode,
    ...values,
  });
}

async function upsertFood({
  dataSourceId,
  product,
  confidenceStatus,
}: {
  dataSourceId: string;
  product: ParsedOpenFoodFactsProduct;
  confidenceStatus: OpenFoodFactsConfidenceStatus;
}) {
  const db = getDb();
  const [existingFood] = await db
    .select({
      id: foods.id,
      confidenceStatus: foods.confidenceStatus,
    })
    .from(foods)
    .where(
      and(
        eq(foods.sourceId, dataSourceId),
        eq(foods.sourceExternalId, product.barcode),
      ),
    )
    .limit(1);

  if (
    existingFood?.confidenceStatus === "verified" ||
    existingFood?.confidenceStatus === "manual"
  ) {
    return { id: existingFood.id, shouldUpdateServings: false };
  }

  const foodValues = {
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    foodType: "branded" as const,
    confidenceStatus,
  };

  if (existingFood) {
    const [food] = await db
      .update(foods)
      .set({ ...foodValues, updatedAt: new Date() })
      .where(eq(foods.id, existingFood.id))
      .returning({ id: foods.id });
    return { id: food.id, shouldUpdateServings: true };
  }

  const [food] = await db
    .insert(foods)
    .values({
      ...foodValues,
      sourceId: dataSourceId,
      sourceExternalId: product.barcode,
    })
    .returning({ id: foods.id });

  return { id: food.id, shouldUpdateServings: true };
}

async function upsertDefaultServing(
  foodId: string,
  product: ParsedOpenFoodFactsProduct,
) {
  const db = getDb();
  const [existingDefaultServing] = await db
    .select({ id: servings.id })
    .from(servings)
    .where(and(eq(servings.foodId, foodId), eq(servings.isDefault, true)))
    .limit(1);

  const servingValues = {
    label: product.defaultServing.label,
    grams: product.defaultServing.grams,
    millilitres: product.defaultServing.millilitres,
  };

  if (existingDefaultServing) {
    const [serving] = await db
      .update(servings)
      .set(servingValues)
      .where(eq(servings.id, existingDefaultServing.id))
      .returning({ id: servings.id });
    return serving.id;
  }

  const [serving] = await db
    .insert(servings)
    .values({ foodId, ...servingValues, isDefault: true })
    .returning({ id: servings.id });

  return serving.id;
}

async function upsertDefaultNutrients(
  foodId: string,
  servingId: string,
  product: ParsedOpenFoodFactsProduct,
) {
  const db = getDb();
  const [existingNutrients] = await db
    .select({ id: foodNutrientValues.id })
    .from(foodNutrientValues)
    .where(eq(foodNutrientValues.servingId, servingId))
    .limit(1);

  if (existingNutrients) {
    await db
      .update(foodNutrientValues)
      .set(product.nutrients)
      .where(eq(foodNutrientValues.id, existingNutrients.id));
    return;
  }

  await db.insert(foodNutrientValues).values({
    foodId,
    servingId,
    ...product.nutrients,
  });
}

async function createMissingAdditionalServings(
  foodId: string,
  product: ParsedOpenFoodFactsProduct,
) {
  const db = getDb();

  for (const serving of product.additionalServings) {
    const [existingAdditional] = await db
      .select({ id: servings.id })
      .from(servings)
      .where(
        and(eq(servings.foodId, foodId), eq(servings.label, serving.label)),
      )
      .limit(1);

    if (!existingAdditional) {
      await db.insert(servings).values({
        foodId,
        ...serving,
        isDefault: false,
      });
    }
  }
}
