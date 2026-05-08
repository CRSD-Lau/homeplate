import { and, eq, sql } from "drizzle-orm";

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
type ExistingOpenFoodFactsConfidenceStatus =
  | OpenFoodFactsConfidenceStatus
  | "verified"
  | "manual"
  | "ocr_draft";
type Db = ReturnType<typeof getDb>;
type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
type DbExecutor = Db | DbTransaction;

const openFoodFactsSource = {
  name: "Open Food Facts",
  sourceType: "open_food_facts" as const,
  licenseName: "Open Database License (ODbL)",
  attribution: "Product data from Open Food Facts.",
};
const generatedOpenFoodFactsServingLabels = ["100 g", "100 ml"] as const;

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

export function resolveOpenFoodFactsConfidenceStatus(
  existing: ExistingOpenFoodFactsConfidenceStatus | null,
  incoming: OpenFoodFactsConfidenceStatus,
): ExistingOpenFoodFactsConfidenceStatus {
  if (existing === "manual" || existing === "verified") return existing;
  if (existing === "imported") return "imported";
  return incoming;
}

export async function getOpenFoodFactsDataSourceId() {
  const [source] = await getDb()
    .insert(dataSources)
    .values(openFoodFactsSource)
    .onConflictDoUpdate({
      target: dataSources.sourceType,
      targetWhere: sql`${dataSources.sourceType} = 'open_food_facts'`,
      set: {
        name: openFoodFactsSource.name,
        licenseName: openFoodFactsSource.licenseName,
        attribution: openFoodFactsSource.attribution,
      },
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
  return getDb().transaction(async (tx) => {
    await upsertSourceRecord(tx, { dataSourceId, importRunId, product });

    const food = await upsertFood(tx, {
      dataSourceId,
      product,
      confidenceStatus,
    });
    if (!food.shouldUpdateServings) return food.id;

    const defaultServingId = await upsertDefaultServing(tx, food.id, product);

    await upsertDefaultNutrients(tx, food.id, defaultServingId, product);
    await syncAdditionalServings(tx, food.id, product);

    return food.id;
  });
}

async function upsertSourceRecord(
  db: DbExecutor,
  {
    dataSourceId,
    importRunId,
    product,
  }: {
    dataSourceId: string;
    importRunId: string | null;
    product: ParsedOpenFoodFactsProduct;
  },
) {
  const values = {
    importRunId,
    barcode: product.barcode,
    rawPayload: product.raw,
    fetchedAt: new Date(),
  };

  await db
    .insert(sourceRecords)
    .values({
      dataSourceId,
      externalId: product.barcode,
      ...values,
    })
    .onConflictDoUpdate({
      target: [sourceRecords.dataSourceId, sourceRecords.externalId],
      targetWhere: sql`${sourceRecords.externalId} IS NOT NULL`,
      set: values,
    });
}

async function upsertFood(
  db: DbExecutor,
  {
    dataSourceId,
    product,
    confidenceStatus,
  }: {
    dataSourceId: string;
    product: ParsedOpenFoodFactsProduct;
    confidenceStatus: OpenFoodFactsConfidenceStatus;
  },
) {
  const foodValues = {
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    foodType: "branded" as const,
    confidenceStatus,
  };

  const [food] = await db
    .insert(foods)
    .values({
      ...foodValues,
      sourceId: dataSourceId,
      sourceExternalId: product.barcode,
    })
    .onConflictDoUpdate({
      target: [foods.sourceId, foods.sourceExternalId],
      targetWhere: sql`${foods.sourceId} IS NOT NULL AND ${foods.sourceExternalId} IS NOT NULL`,
      set: {
        name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        foodType: "branded",
        confidenceStatus: sql`
          case
            when ${foods.confidenceStatus} = 'imported' then 'imported'::confidence_status
            else ${confidenceStatus}::confidence_status
          end
        `,
        updatedAt: new Date(),
      },
      setWhere: sql`${foods.confidenceStatus} NOT IN ('verified', 'manual')`,
    })
    .returning({ id: foods.id });

  if (food) return { id: food.id, shouldUpdateServings: true };

  const [existingFood] = await db
    .select({ id: foods.id })
    .from(foods)
    .where(
      and(
        eq(foods.sourceId, dataSourceId),
        eq(foods.sourceExternalId, product.barcode),
      ),
    )
    .limit(1);

  if (!existingFood) {
    throw new Error(
      `Open Food Facts food upsert returned no row for ${product.barcode}.`,
    );
  }

  return { id: existingFood.id, shouldUpdateServings: false };
}

async function upsertDefaultServing(
  db: DbExecutor,
  foodId: string,
  product: ParsedOpenFoodFactsProduct,
) {
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
  db: DbExecutor,
  foodId: string,
  servingId: string,
  product: ParsedOpenFoodFactsProduct,
) {
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

async function syncAdditionalServings(
  db: DbExecutor,
  foodId: string,
  product: ParsedOpenFoodFactsProduct,
) {
  const incomingByLabel = new Map(
    product.additionalServings
      .filter((serving) => isGeneratedOpenFoodFactsServingLabel(serving.label))
      .map((serving) => [serving.label, serving]),
  );

  for (const serving of incomingByLabel.values()) {
    const [existingAdditional] = await db
      .select({ id: servings.id })
      .from(servings)
      .where(
        and(
          eq(servings.foodId, foodId),
          eq(servings.label, serving.label),
          eq(servings.isDefault, false),
        ),
      )
      .limit(1);

    if (existingAdditional) {
      await db
        .update(servings)
        .set({
          grams: serving.grams,
          millilitres: serving.millilitres,
        })
        .where(eq(servings.id, existingAdditional.id));
    } else {
      await db.insert(servings).values({
        foodId,
        ...serving,
        isDefault: false,
      });
    }
  }
}

function isGeneratedOpenFoodFactsServingLabel(label: string) {
  return generatedOpenFoodFactsServingLabels.includes(
    label as (typeof generatedOpenFoodFactsServingLabels)[number],
  );
}
