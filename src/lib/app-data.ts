import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import {
  bloodGlucoseLogs,
  bloodPressureLogs,
  dataSources,
  exerciseLogs,
  foodAliases,
  foodLogs,
  foodNutrientValues,
  foods,
  savedMealItems,
  savedMeals,
  servings,
  stepLogs,
  userProfiles,
  userSettings,
  users,
  waterLogs,
  weightLogs,
} from "@/db/schema";
import { calculateBmi } from "@/lib/bmi";
import { getBarcodeLookupKeys } from "@/lib/barcodes";
import {
  normalizeDateInputValue,
  parseDateInputValue,
  recentDateKeys,
  toDateInputValue,
} from "@/lib/dates";
import { formatServingOptionsInput } from "@/lib/food-servings";
import {
  hasFoodSearchQuery,
  rankFoodSearchResults,
} from "@/lib/food-search";
import { parseDashboardPreferences } from "@/lib/dashboard-preferences";
import {
  scaleNutrientsForServing,
  sumNutrients,
} from "@/lib/nutrition";
import {
  calculateMealTotals,
  calculateSavedMealTotals,
  calculateStepTotal,
  normalizeMealType,
  type MealType,
} from "@/lib/tracking";
import { subDays } from "date-fns";

export async function getProfileAndSettings(userId: string) {
  const db = getDb();
  const [[profile], [settings]] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
    db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
  ]);

  return {
    profile,
    settings: settings ?? {
      weightUnit: "lb" as const,
      heightUnit: "cm" as const,
      waterUnit: "ml" as const,
      bloodGlucoseUnit: "mmol_l" as const,
      energyUnit: "kcal" as const,
      dailyWaterGoalMl: 2500,
      dashboardPreferences: null,
    },
  };
}

export async function getSettingsPageData(userId: string) {
  const { profile, settings } = await getProfileAndSettings(userId);
  const [startingWeight, latestWeight] = await Promise.all([
    getDb()
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(asc(weightLogs.logDate), asc(weightLogs.loggedAt))
      .limit(1),
    getDb()
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(1),
  ]);

  return {
    profile,
    settings,
    dashboardPreferences: parseDashboardPreferences(settings.dashboardPreferences),
    startingWeight: startingWeight[0] ?? null,
    latestWeight: latestWeight[0] ?? null,
  };
}

export async function getFoodsPageData({
  query = "",
  source = "all",
  userId,
}: {
  query?: string;
  source?: "all" | "manual" | "verified" | "provisional";
  userId?: string;
} = {}) {
  if (!hasFoodSearchQuery(query)) return [];

  const options = await getFoodSearchOptions({ query, source, userId });
  if (options.length === 0) return [];

  const aliases = await getFoodAliasesByFood([
    ...new Set(options.map((option) => option.foodId)),
  ]);
  const byFood = new Map<string, (typeof options)[number] & { servings: FoodServingOption[] }>();

  for (const option of options) {
    const existing = byFood.get(option.foodId);
    if (existing) {
      existing.servings.push(toServingOption(option));
      continue;
    }

    byFood.set(option.foodId, {
      ...option,
      aliases: aliases.get(option.foodId) ?? [],
      servingOptionsText: formatServingOptionsInput(
        options
          .filter((serving) => serving.foodId === option.foodId)
          .map(toServingOption),
      ),
      servings: [toServingOption(option)],
    });
  }

  return Array.from(byFood.values());
}

export async function getFoodOptions(userId?: string) {
  return getFoodSearchOptions({ userId });
}

export async function getFoodsByBarcode(barcode: string) {
  const barcodeKeys = getBarcodeLookupKeys(barcode);
  if (barcodeKeys.length === 0) return [];

  const rows = await getDb()
    .select({
      foodId: foods.id,
      name: foods.name,
      brand: foods.brand,
      barcode: foods.barcode,
      confidenceStatus: foods.confidenceStatus,
      servingId: servings.id,
      servingLabel: servings.label,
      calories: foodNutrientValues.calories,
      proteinG: foodNutrientValues.proteinG,
      carbsG: foodNutrientValues.carbsG,
      fatG: foodNutrientValues.fatG,
      fibreG: foodNutrientValues.fibreG,
      sugarG: foodNutrientValues.sugarG,
      sodiumMg: foodNutrientValues.sodiumMg,
    })
    .from(foods)
    .innerJoin(
      servings,
      and(eq(servings.foodId, foods.id), eq(servings.isDefault, true)),
    )
    .innerJoin(foodNutrientValues, eq(foodNutrientValues.servingId, servings.id))
    .where(inArray(foods.barcode, barcodeKeys))
    .orderBy(asc(foods.name));

  return rows.map((row) => ({
    ...row,
    calories: Number(row.calories),
    proteinG: Number(row.proteinG),
    carbsG: Number(row.carbsG),
    fatG: Number(row.fatG),
    fibreG: row.fibreG === null ? null : Number(row.fibreG),
    sugarG: row.sugarG === null ? null : Number(row.sugarG),
    sodiumMg: row.sodiumMg === null ? null : Number(row.sodiumMg),
  }));
}

export async function getFoodSearchOptions({
  query = "",
  source = "all",
  userId,
}: {
  query?: string;
  source?: "all" | "manual" | "verified" | "provisional";
  userId?: string;
} = {}) {
  if (!hasFoodSearchQuery(query)) return [];

  const rows = await getFoodSearchRows({ query, userId });
  const mapped = rows
    .filter((food) => foodSourceMatches(food, source))
    .map(mapFoodSearchRow)
    .filter((food): food is FoodSearchOption => food !== null);

  return rankFoodSearchResults(
    query,
    mapped.map((food) => ({
      ...food,
      id: `${food.foodId}|${food.servingId}`,
    })),
  );
}

type FoodSearchDbRow = {
  foodId: string;
  name: string;
  brand: string | null;
  foodType: string;
  confidenceStatus: string;
  servingId: string;
  servingLabel: string;
  grams: number | null;
  millilitres: number | null;
  isDefault: boolean;
  baseServingId: string;
  baseGrams: number | null;
  baseMillilitres: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  aliasText: string;
  isFavorite: boolean;
  lastLoggedAt: Date | string | null;
  similarity: number;
};

type FoodServingOption = {
  servingId: string;
  label: string;
  servingLabel: string;
  grams: number | null;
  millilitres: number | null;
  isDefault: boolean;
};

type FoodSearchOption = {
  foodId: string;
  name: string;
  brand: string | null;
  foodType: string;
  confidenceStatus: string;
  servingId: string;
  servingLabel: string;
  grams: number | null;
  millilitres: number | null;
  isDefault: boolean;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  aliasText: string;
  aliases?: string[];
  servingOptionsText?: string;
  isFavorite: boolean;
  lastLoggedAt: Date | string | null;
  similarity: number;
};

async function getFoodSearchRows({
  query,
  userId,
}: {
  query: string;
  userId?: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const likeQuery = `%${normalizedQuery}%`;
  const rows = await getDb().execute(sql<FoodSearchDbRow>`
    WITH recent AS (
      SELECT food_id, serving_id, max(logged_at) AS last_logged_at
      FROM food_logs
      WHERE ${userId ?? null}::uuid IS NOT NULL
        AND user_id = ${userId ?? null}::uuid
        AND food_id IS NOT NULL
        AND serving_id IS NOT NULL
      GROUP BY food_id, serving_id
    ),
    alias_rollup AS (
      SELECT food_id, string_agg(alias, ' ') AS alias_text
      FROM food_aliases
      GROUP BY food_id
    )
    SELECT
      f.id::text AS "foodId",
      f.name AS "name",
      f.brand AS "brand",
      f.food_type AS "foodType",
      f.confidence_status AS "confidenceStatus",
      s.id::text AS "servingId",
      s.label AS "servingLabel",
      s.grams AS "grams",
      s.millilitres AS "millilitres",
      s.is_default AS "isDefault",
      bs.id::text AS "baseServingId",
      bs.grams AS "baseGrams",
      bs.millilitres AS "baseMillilitres",
      n.calories AS "calories",
      n.protein_g AS "proteinG",
      n.carbs_g AS "carbsG",
      n.fat_g AS "fatG",
      n.fibre_g AS "fibreG",
      n.sugar_g AS "sugarG",
      n.sodium_mg AS "sodiumMg",
      coalesce(a.alias_text, '') AS "aliasText",
      ff.id IS NOT NULL AS "isFavorite",
      recent.last_logged_at AS "lastLoggedAt",
      greatest(
        similarity(lower(f.name), ${normalizedQuery}),
        similarity(coalesce(lower(f.brand), ''), ${normalizedQuery}),
        similarity(coalesce(lower(a.alias_text), ''), ${normalizedQuery})
      ) AS "similarity"
    FROM foods f
    INNER JOIN servings s ON s.food_id = f.id
    INNER JOIN servings bs ON bs.food_id = f.id AND bs.is_default = true
    INNER JOIN food_nutrient_values n ON n.serving_id = bs.id
    LEFT JOIN alias_rollup a ON a.food_id = f.id
    LEFT JOIN food_favorites ff ON ff.food_id = f.id AND ff.serving_id = s.id
    LEFT JOIN recent ON recent.food_id = f.id AND recent.serving_id = s.id
    WHERE ${normalizedQuery} = ''
      OR lower(f.name) LIKE ${likeQuery}
      OR coalesce(lower(f.brand), '') LIKE ${likeQuery}
      OR coalesce(lower(a.alias_text), '') LIKE ${likeQuery}
      OR lower(f.name) % ${normalizedQuery}
      OR coalesce(lower(f.brand), '') % ${normalizedQuery}
      OR coalesce(lower(a.alias_text), '') % ${normalizedQuery}
    ORDER BY ff.id IS NOT NULL DESC,
      recent.last_logged_at DESC NULLS LAST,
      "similarity" DESC,
      f.name ASC,
      s.is_default DESC,
      s.label ASC
    LIMIT 200
  `);

  return Array.from(rows) as FoodSearchDbRow[];
}

async function getFoodAliasesByFood(foodIds: string[]) {
  if (foodIds.length === 0) return new Map<string, string[]>();

  const rows = await getDb()
    .select({
      foodId: foodAliases.foodId,
      alias: foodAliases.alias,
    })
    .from(foodAliases)
    .where(inArray(foodAliases.foodId, foodIds))
    .orderBy(asc(foodAliases.alias));
  const byFood = new Map<string, string[]>();

  for (const row of rows) {
    const aliases = byFood.get(row.foodId) ?? [];
    aliases.push(row.alias);
    byFood.set(row.foodId, aliases);
  }

  return byFood;
}

function mapFoodSearchRow(row: FoodSearchDbRow): FoodSearchOption | null {
  const scaled = scaleNutrientsForServing(
    {
      calories: Number(row.calories),
      proteinG: Number(row.proteinG),
      carbsG: Number(row.carbsG),
      fatG: Number(row.fatG),
      fibreG: row.fibreG === null ? null : Number(row.fibreG),
      sugarG: row.sugarG === null ? null : Number(row.sugarG),
      sodiumMg: row.sodiumMg === null ? null : Number(row.sodiumMg),
    },
    {
      baseServing: {
        id: row.baseServingId,
        isDefault: true,
        grams: row.baseGrams === null ? null : Number(row.baseGrams),
        millilitres:
          row.baseMillilitres === null ? null : Number(row.baseMillilitres),
      },
      selectedServing: {
        id: row.servingId,
        isDefault: row.isDefault,
        grams: row.grams === null ? null : Number(row.grams),
        millilitres: row.millilitres === null ? null : Number(row.millilitres),
      },
      quantity: 1,
    },
  );

  if (!scaled) return null;

  return {
    foodId: row.foodId,
    name: row.name,
    brand: row.brand,
    foodType: row.foodType,
    confidenceStatus: row.confidenceStatus,
    servingId: row.servingId,
    servingLabel: row.servingLabel,
    grams: row.grams === null ? null : Number(row.grams),
    millilitres: row.millilitres === null ? null : Number(row.millilitres),
    isDefault: row.isDefault,
    calories: scaled.calories,
    proteinG: scaled.proteinG,
    carbsG: scaled.carbsG,
    fatG: scaled.fatG,
    fibreG: scaled.fibreG ?? null,
    sugarG: scaled.sugarG ?? null,
    sodiumMg: scaled.sodiumMg ?? null,
    aliasText: row.aliasText,
    isFavorite: row.isFavorite,
    lastLoggedAt: row.lastLoggedAt,
    similarity: Number(row.similarity ?? 0),
  };
}

function toServingOption(food: FoodSearchOption): FoodServingOption {
  return {
    servingId: food.servingId,
    label: food.servingLabel,
    servingLabel: food.servingLabel,
    grams: food.grams,
    millilitres: food.millilitres,
    isDefault: food.isDefault,
  };
}

function foodSourceMatches(
  food: FoodSearchDbRow,
  source: "all" | "manual" | "verified" | "provisional",
) {
  if (source === "manual") {
    return food.foodType === "manual" || food.confidenceStatus === "manual";
  }

  if (source === "verified") {
    return (
      food.confidenceStatus === "verified" ||
      food.confidenceStatus === "imported"
    );
  }

  if (source === "provisional") {
    return (
      food.confidenceStatus === "provisional" ||
      food.confidenceStatus === "ocr_draft"
    );
  }

  return true;
}

export async function getFoodLogPageData(
  userId: string,
  date = toDateInputValue(),
) {
  const selectedDate = normalizeDateInputValue(date);
  const [logs, recentRows] = await Promise.all([
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, selectedDate)))
      .orderBy(asc(foodLogs.mealType), desc(foodLogs.loggedAt)),
    getDb()
      .select({
        foodId: foodLogs.foodId,
        servingId: foodLogs.servingId,
        foodName: foodLogs.foodNameSnapshot,
        servingLabel: foodLogs.servingLabelSnapshot,
        calories: foodLogs.caloriesSnapshot,
        proteinG: foodLogs.proteinGSnapshot,
        carbsG: foodLogs.carbsGSnapshot,
        fatG: foodLogs.fatGSnapshot,
      })
      .from(foodLogs)
      .where(eq(foodLogs.userId, userId))
      .orderBy(desc(foodLogs.loggedAt))
      .limit(50),
  ]);

  const seen = new Set<string>();
  const recentFoods = recentRows
    .filter((row) => row.foodId && row.servingId)
    .filter((row) => {
      const key = `${row.foodId}|${row.servingId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
  const mealTotals = calculateMealTotals(
    logs.map((log) => ({
      mealType: log.mealType,
      calories: log.caloriesSnapshot,
      proteinG: log.proteinGSnapshot,
      carbsG: log.carbsGSnapshot,
      fatG: log.fatGSnapshot,
      fibreG: log.fibreGSnapshot,
      sugarG: log.sugarGSnapshot,
      sodiumMg: log.sodiumMgSnapshot,
    })),
  );

  return {
    date: selectedDate,
    logs,
    mealTotals,
    nutrition: mealTotals.daily,
    recentFoods,
  };
}

export async function getMealReviewPageData(
  userId: string,
  mealType: string,
  date = toDateInputValue(),
) {
  const selectedDate = normalizeDateInputValue(date);
  const selectedMeal = normalizeMealType(mealType);
  const logs = await getDb()
    .select()
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        eq(foodLogs.logDate, selectedDate),
        eq(foodLogs.mealType, selectedMeal),
      ),
    )
    .orderBy(desc(foodLogs.loggedAt));

  return {
    date: selectedDate,
    mealType: selectedMeal,
    logs,
    nutrition: sumNutrients(
      logs.map((log) => ({
        calories: log.caloriesSnapshot,
        proteinG: log.proteinGSnapshot,
        carbsG: log.carbsGSnapshot,
        fatG: log.fatGSnapshot,
        fibreG: log.fibreGSnapshot,
        sugarG: log.sugarGSnapshot,
        sodiumMg: log.sodiumMgSnapshot,
      })),
    ),
  };
}

export async function getFoodAddPageData({
  userId,
  mealType,
  date = toDateInputValue(),
  query = "",
}: {
  userId: string;
  mealType: string;
  date?: string;
  query?: string;
}) {
  const selectedDate = normalizeDateInputValue(date);
  const selectedMeal = normalizeMealType(mealType);
  const yesterdayDate = toDateInputValue(
    subDays(parseDateInputValue(selectedDate), 1),
  );
  const [foodOptions, savedMealRows, copySources, yesterdayMeal] =
    await Promise.all([
      getFoodSearchOptions({ query, source: "all", userId }),
      getSavedMealsWithItems(userId),
      getMealCopySources({
        userId,
        selectedDate,
        selectedMeal,
      }),
      getMealSummaryForCopy({
        userId,
        sourceDate: yesterdayDate,
        sourceMeal: selectedMeal,
      }),
    ]);

  return {
    date: selectedDate,
    mealType: selectedMeal,
    foodOptions,
    savedMeals: savedMealRows,
    copySources,
    yesterdayMeal,
  };
}

async function getMealCopySources({
  userId,
  selectedDate,
  selectedMeal,
}: {
  userId: string;
  selectedDate: string;
  selectedMeal: MealType;
}) {
  const rows = await getDb()
    .select({
      sourceDate: foodLogs.logDate,
      mealType: foodLogs.mealType,
      itemCount: count(foodLogs.id),
      calories: sql<number>`coalesce(sum(${foodLogs.caloriesSnapshot}), 0)`,
      lastLoggedAt: sql<Date>`max(${foodLogs.loggedAt})`,
    })
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        sql`(${foodLogs.logDate} <> ${selectedDate} OR ${foodLogs.mealType} <> ${selectedMeal})`,
      ),
    )
    .groupBy(foodLogs.logDate, foodLogs.mealType)
    .orderBy(sql`max(${foodLogs.loggedAt}) DESC`)
    .limit(8);

  return rows.map((row) => ({
    sourceDate: row.sourceDate,
    mealType: normalizeMealType(row.mealType),
    itemCount: Number(row.itemCount),
    calories: Number(row.calories),
    lastLoggedAt: row.lastLoggedAt,
  }));
}

async function getMealSummaryForCopy({
  userId,
  sourceDate,
  sourceMeal,
}: {
  userId: string;
  sourceDate: string;
  sourceMeal: MealType;
}) {
  const [row] = await getDb()
    .select({
      sourceDate: foodLogs.logDate,
      mealType: foodLogs.mealType,
      itemCount: count(foodLogs.id),
      calories: sql<number>`coalesce(sum(${foodLogs.caloriesSnapshot}), 0)`,
      lastLoggedAt: sql<Date>`max(${foodLogs.loggedAt})`,
    })
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        eq(foodLogs.logDate, sourceDate),
        eq(foodLogs.mealType, sourceMeal),
      ),
    )
    .groupBy(foodLogs.logDate, foodLogs.mealType)
    .limit(1);

  if (!row) return null;

  return {
    sourceDate: row.sourceDate,
    mealType: normalizeMealType(row.mealType),
    itemCount: Number(row.itemCount),
    calories: Number(row.calories),
    lastLoggedAt: row.lastLoggedAt,
  };
}

export async function getWeightPageData(userId: string) {
  const { profile, settings } = await getProfileAndSettings(userId);
  const logs = await getDb()
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(50);

  return { logs, profile, settings };
}

export async function getWaterPageData(userId: string) {
  const { settings } = await getProfileAndSettings(userId);
  const logs = await getDb()
    .select()
    .from(waterLogs)
    .where(eq(waterLogs.userId, userId))
    .orderBy(desc(waterLogs.loggedAt))
    .limit(80);

  return { logs, settings };
}

export async function getExercisePageData(userId: string) {
  const logs = await getDb()
    .select()
    .from(exerciseLogs)
    .where(eq(exerciseLogs.userId, userId))
    .orderBy(desc(exerciseLogs.loggedAt))
    .limit(80);

  return { logs };
}

export async function getMovementPageData(
  userId: string,
  date = toDateInputValue(),
) {
  const selectedDate = normalizeDateInputValue(date);
  const [exerciseRows, stepRows] = await Promise.all([
    getDb()
      .select()
      .from(exerciseLogs)
      .where(eq(exerciseLogs.userId, userId))
      .orderBy(desc(exerciseLogs.loggedAt))
      .limit(80),
    getDb()
      .select()
      .from(stepLogs)
      .where(eq(stepLogs.userId, userId))
      .orderBy(desc(stepLogs.loggedAt))
      .limit(80),
  ]);
  const todayExercises = exerciseRows.filter((row) => row.logDate === selectedDate);
  const todaySteps = stepRows.filter((row) => row.logDate === selectedDate);

  return {
    date: selectedDate,
    logs: exerciseRows,
    stepLogs: stepRows,
    todayExercises,
    todaySteps,
    totals: {
      sessions: todayExercises.length,
      durationMinutes: todayExercises.reduce(
        (total, row) => total + (row.durationMinutes ?? 0),
        0,
      ),
      caloriesBurned: todayExercises.reduce(
        (total, row) => total + (row.caloriesBurned ?? 0),
        0,
      ),
      steps: calculateStepTotal(todaySteps),
    },
  };
}

export async function getHealthPageData(userId: string) {
  const { profile, settings } = await getProfileAndSettings(userId);
  const weekStart = recentDateKeys(7)[0];
  const [
    bloodPressure,
    bloodGlucose,
    weightRows,
    waterRows,
    exerciseRows,
    foodRows,
    trends,
  ] = await Promise.all([
    getDb()
      .select()
      .from(bloodPressureLogs)
      .where(eq(bloodPressureLogs.userId, userId))
      .orderBy(desc(bloodPressureLogs.loggedAt))
      .limit(60),
    getDb()
      .select()
      .from(bloodGlucoseLogs)
      .where(eq(bloodGlucoseLogs.userId, userId))
      .orderBy(desc(bloodGlucoseLogs.loggedAt))
      .limit(60),
    getDb()
      .select()
      .from(weightLogs)
      .where(and(eq(weightLogs.userId, userId), gte(weightLogs.logDate, weekStart))),
    getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), gte(waterLogs.logDate, weekStart))),
    getDb()
      .select()
      .from(exerciseLogs)
      .where(
        and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.logDate, weekStart)),
      ),
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), gte(foodLogs.logDate, weekStart))),
    getTrendData(userId, profile?.heightCm ?? null),
  ]);

  const mealCounts = new Map<string, number>();
  for (const log of foodRows) {
    mealCounts.set(log.mealType, (mealCounts.get(log.mealType) ?? 0) + 1);
  }
  const mostConsistentMeal =
    Array.from(mealCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  return {
    profile,
    bloodPressure,
    bloodGlucose,
    settings,
    trends,
    insights: {
      weightEntries: weightRows.length,
      averageDailyWaterMl:
        waterRows.reduce((total, row) => total + row.amountMl, 0) / 7,
      mostConsistentMeal,
      exerciseDays: new Set(exerciseRows.map((row) => row.logDate)).size,
      bloodPressureEntries: bloodPressure.filter(
        (row) => row.logDate >= weekStart,
      ).length,
      bloodGlucoseEntries: bloodGlucose.filter((row) => row.logDate >= weekStart)
        .length,
    },
  };
}

export async function getDashboardData(userId: string, date = toDateInputValue()) {
  const selectedDate = normalizeDateInputValue(date);
  const { profile, settings } = await getProfileAndSettings(userId);

  const [
    todayFoodLogs,
    todayWaterLogs,
    latestWeight,
    selectedWeight,
    todayExerciseLogs,
    latestBloodPressure,
    latestBloodGlucose,
    trends,
  ] = await Promise.all([
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, selectedDate))),
    getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), eq(waterLogs.logDate, selectedDate))),
    getDb()
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(1),
    getDb()
      .select()
      .from(weightLogs)
      .where(and(eq(weightLogs.userId, userId), eq(weightLogs.logDate, selectedDate)))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(1),
    getDb()
      .select()
      .from(exerciseLogs)
      .where(
        and(eq(exerciseLogs.userId, userId), eq(exerciseLogs.logDate, selectedDate)),
      ),
    getDb()
      .select()
      .from(bloodPressureLogs)
      .where(eq(bloodPressureLogs.userId, userId))
      .orderBy(desc(bloodPressureLogs.loggedAt))
      .limit(1),
    getDb()
      .select()
      .from(bloodGlucoseLogs)
      .where(eq(bloodGlucoseLogs.userId, userId))
      .orderBy(desc(bloodGlucoseLogs.loggedAt))
      .limit(1),
    getTrendData(userId, profile?.heightCm ?? null),
  ]);

  const nutrition = sumNutrients(
    todayFoodLogs.map((log) => ({
      calories: log.caloriesSnapshot,
      proteinG: log.proteinGSnapshot,
      carbsG: log.carbsGSnapshot,
      fatG: log.fatGSnapshot,
      fibreG: log.fibreGSnapshot,
      sugarG: log.sugarGSnapshot,
      sodiumMg: log.sodiumMgSnapshot,
    })),
  );

  const waterTotalMl = todayWaterLogs.reduce(
    (total, log) => total + log.amountMl,
    0,
  );
  const exerciseDurationMinutes = todayExerciseLogs.reduce(
    (total, log) => total + (log.durationMinutes ?? 0),
    0,
  );
  const exerciseCalories = todayExerciseLogs.reduce(
    (total, log) => total + (log.caloriesBurned ?? 0),
    0,
  );
  const latestWeightLog = latestWeight[0] ?? null;
  const bmi =
    latestWeightLog && profile?.heightCm
      ? calculateBmi(latestWeightLog.weightKg, profile.heightCm)
      : null;
  const loggedDates = trends
    .filter(
      (day) =>
        day.calories > 0 ||
        day.waterMl > 0 ||
        day.exerciseMinutes > 0 ||
        day.weightKg !== null ||
        day.systolic !== null ||
        day.glucoseMmolL !== null,
    )
    .map((day) => day.date);

  return {
    today: selectedDate,
    profile,
    settings,
    dashboardPreferences: parseDashboardPreferences(settings.dashboardPreferences),
    nutrition,
    mealCount: new Set(todayFoodLogs.map((log) => log.mealType)).size,
    waterTotalMl,
    exerciseDurationMinutes,
    exerciseCalories,
    latestWeight: latestWeightLog,
    selectedWeight: selectedWeight[0] ?? null,
    bmi,
    latestBloodPressure: latestBloodPressure[0] ?? null,
    latestBloodGlucose: latestBloodGlucose[0] ?? null,
    trends,
    loggedDates,
  };
}

export async function getTrendData(userId: string, heightCm: number | null) {
  const days = recentDateKeys(30);
  const since = days[0];
  const base = new Map(
    days.map((date) => [
      date,
      {
        date,
        calories: 0,
        waterMl: 0,
        exerciseMinutes: 0,
        exerciseCalories: 0,
        weightKg: null as number | null,
        bmi: null as number | null,
        systolic: null as number | null,
        diastolic: null as number | null,
        glucoseMmolL: null as number | null,
      },
    ]),
  );

  const [
    foodRows,
    waterRows,
    exerciseRows,
    weightRows,
    bloodPressureRows,
    bloodGlucoseRows,
  ] = await Promise.all([
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), gte(foodLogs.logDate, since))),
    getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), gte(waterLogs.logDate, since))),
    getDb()
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.logDate, since))),
    getDb()
      .select()
      .from(weightLogs)
      .where(and(eq(weightLogs.userId, userId), gte(weightLogs.logDate, since)))
      .orderBy(asc(weightLogs.loggedAt)),
    getDb()
      .select()
      .from(bloodPressureLogs)
      .where(
        and(eq(bloodPressureLogs.userId, userId), gte(bloodPressureLogs.logDate, since)),
      ),
    getDb()
      .select()
      .from(bloodGlucoseLogs)
      .where(
        and(eq(bloodGlucoseLogs.userId, userId), gte(bloodGlucoseLogs.logDate, since)),
      ),
  ]);

  for (const row of foodRows) {
    const day = base.get(row.logDate);
    if (day) day.calories += row.caloriesSnapshot;
  }

  for (const row of waterRows) {
    const day = base.get(row.logDate);
    if (day) day.waterMl += row.amountMl;
  }

  for (const row of exerciseRows) {
    const day = base.get(row.logDate);
    if (day) {
      day.exerciseMinutes += row.durationMinutes ?? 0;
      day.exerciseCalories += row.caloriesBurned ?? 0;
    }
  }

  for (const row of weightRows) {
    const day = base.get(row.logDate);
    if (day) {
      day.weightKg = row.weightKg;
      day.bmi = heightCm ? calculateBmi(row.weightKg, heightCm) : null;
    }
  }

  const bpBuckets = new Map<
    string,
    { systolic: number; diastolic: number; count: number }
  >();
  for (const row of bloodPressureRows) {
    const bucket =
      bpBuckets.get(row.logDate) ??
      { systolic: 0, diastolic: 0, count: 0 };
    bucket.systolic += row.systolicMmhg;
    bucket.diastolic += row.diastolicMmhg;
    bucket.count += 1;
    bpBuckets.set(row.logDate, bucket);
  }

  for (const [date, bucket] of bpBuckets) {
    const day = base.get(date);
    if (day) {
      day.systolic = bucket.systolic / bucket.count;
      day.diastolic = bucket.diastolic / bucket.count;
    }
  }

  const glucoseBuckets = new Map<string, { glucose: number; count: number }>();
  for (const row of bloodGlucoseRows) {
    const bucket = glucoseBuckets.get(row.logDate) ?? { glucose: 0, count: 0 };
    bucket.glucose += row.glucoseMmolL;
    bucket.count += 1;
    glucoseBuckets.set(row.logDate, bucket);
  }

  for (const [date, bucket] of glucoseBuckets) {
    const day = base.get(date);
    if (day) day.glucoseMmolL = bucket.glucose / bucket.count;
  }

  return Array.from(base.values());
}

export async function getSavedMealsWithItems(userId: string) {
  const baseServings = alias(servings, "saved_meal_base_servings");
  const [meals, items] = await Promise.all([
    getDb()
      .select()
      .from(savedMeals)
      .where(eq(savedMeals.userId, userId))
      .orderBy(desc(savedMeals.isFavorite), desc(savedMeals.updatedAt)),
    getDb()
      .select({
        savedMealId: savedMealItems.savedMealId,
        foodId: foods.id,
        foodName: foods.name,
        brand: foods.brand,
        servingId: servings.id,
        servingLabel: servings.label,
        servingIsDefault: servings.isDefault,
        servingGrams: servings.grams,
        servingMillilitres: servings.millilitres,
        baseServingId: baseServings.id,
        baseServingGrams: baseServings.grams,
        baseServingMillilitres: baseServings.millilitres,
        quantity: savedMealItems.quantity,
        calories: foodNutrientValues.calories,
        proteinG: foodNutrientValues.proteinG,
        carbsG: foodNutrientValues.carbsG,
        fatG: foodNutrientValues.fatG,
        fibreG: foodNutrientValues.fibreG,
        sugarG: foodNutrientValues.sugarG,
        sodiumMg: foodNutrientValues.sodiumMg,
      })
      .from(savedMealItems)
      .innerJoin(savedMeals, eq(savedMealItems.savedMealId, savedMeals.id))
      .innerJoin(foods, eq(savedMealItems.foodId, foods.id))
      .innerJoin(servings, eq(savedMealItems.servingId, servings.id))
      .innerJoin(
        baseServings,
        and(eq(baseServings.foodId, foods.id), eq(baseServings.isDefault, true)),
      )
      .innerJoin(
        foodNutrientValues,
        eq(foodNutrientValues.servingId, baseServings.id),
      )
      .where(eq(savedMeals.userId, userId)),
  ]);

  return meals.map((meal) => {
    const mealItems = items
      .filter((item) => item.savedMealId === meal.id)
      .map((item) => {
        const scaled = scaleNutrientsForServing(
          {
            calories: item.calories,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG,
            fibreG: item.fibreG,
            sugarG: item.sugarG,
            sodiumMg: item.sodiumMg,
          },
          {
            baseServing: {
              id: item.baseServingId,
              isDefault: true,
              grams: item.baseServingGrams,
              millilitres: item.baseServingMillilitres,
            },
            selectedServing: {
              id: item.servingId,
              isDefault: item.servingIsDefault,
              grams: item.servingGrams,
              millilitres: item.servingMillilitres,
            },
            quantity: 1,
          },
        );

        return {
          ...item,
          calories: scaled?.calories ?? 0,
          proteinG: scaled?.proteinG ?? 0,
          carbsG: scaled?.carbsG ?? 0,
          fatG: scaled?.fatG ?? 0,
          fibreG: scaled?.fibreG ?? null,
          sugarG: scaled?.sugarG ?? null,
          sodiumMg: scaled?.sodiumMg ?? null,
        };
      });
    return {
      ...meal,
      mealType: meal.mealType ? normalizeMealType(meal.mealType) : null,
      items: mealItems,
      totals: calculateSavedMealTotals(mealItems),
    };
  });
}

export async function getAdminData() {
  const db = getDb();
  const [userCount, foodCount, sourceCount, manualSource, provisionalFoods] =
    await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(foods),
      db.select({ count: count() }).from(dataSources),
      db
        .select()
        .from(dataSources)
        .where(eq(dataSources.sourceType, "manual"))
        .limit(1),
      db
        .select()
        .from(foods)
        .where(eq(foods.confidenceStatus, "provisional"))
        .limit(20),
    ]);

  return {
    userCount: userCount[0]?.count ?? 0,
    foodCount: foodCount[0]?.count ?? 0,
    sourceCount: sourceCount[0]?.count ?? 0,
    manualSource: manualSource[0] ?? null,
    provisionalFoods,
  };
}
