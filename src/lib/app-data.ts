import { and, asc, count, desc, eq, gte } from "drizzle-orm";

import { getDb } from "@/db";
import {
  bloodGlucoseLogs,
  bloodPressureLogs,
  dataSources,
  exerciseLogs,
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
import {
  normalizeDateInputValue,
  recentDateKeys,
  toDateInputValue,
} from "@/lib/dates";
import { parseDashboardPreferences } from "@/lib/dashboard-preferences";
import { sumNutrients } from "@/lib/nutrition";
import {
  calculateMealTotals,
  calculateSavedMealTotals,
  calculateStepTotal,
  normalizeMealType,
} from "@/lib/tracking";

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

export async function getFoodOptions() {
  return getDb()
    .select({
      foodId: foods.id,
      foodName: foods.name,
      brand: foods.brand,
      confidenceStatus: foods.confidenceStatus,
      servingId: servings.id,
      servingLabel: servings.label,
      calories: foodNutrientValues.calories,
      proteinG: foodNutrientValues.proteinG,
      carbsG: foodNutrientValues.carbsG,
      fatG: foodNutrientValues.fatG,
    })
    .from(foods)
    .innerJoin(
      servings,
      and(eq(servings.foodId, foods.id), eq(servings.isDefault, true)),
    )
    .innerJoin(
      foodNutrientValues,
      eq(foodNutrientValues.servingId, servings.id),
    )
    .orderBy(asc(foods.name));
}

export async function getFoodsPageData({
  query = "",
  source = "all",
}: {
  query?: string;
  source?: "all" | "manual" | "verified" | "provisional";
} = {}) {
  const rows = await getDb()
    .select({
      foodId: foods.id,
      name: foods.name,
      brand: foods.brand,
      foodType: foods.foodType,
      confidenceStatus: foods.confidenceStatus,
      servingId: servings.id,
      servingLabel: servings.label,
      grams: servings.grams,
      millilitres: servings.millilitres,
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
    .innerJoin(
      foodNutrientValues,
      eq(foodNutrientValues.servingId, servings.id),
    )
    .orderBy(asc(foods.name));

  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((food) => {
    const matchesQuery =
      !normalizedQuery ||
      food.name.toLowerCase().includes(normalizedQuery) ||
      (food.brand?.toLowerCase().includes(normalizedQuery) ?? false);

    if (!matchesQuery) return false;

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
  });
}

export async function getFoodLogPageData(
  userId: string,
  date = toDateInputValue(),
) {
  const selectedDate = normalizeDateInputValue(date);
  const [foodOptions, logs, recentRows] = await Promise.all([
    getFoodOptions(),
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
    foodOptions,
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
  const [foodOptions, savedMealRows] = await Promise.all([
    getFoodsPageData({ query, source: "all" }),
    getSavedMealsWithItems(userId),
  ]);

  return {
    date: selectedDate,
    mealType: selectedMeal,
    foodOptions,
    savedMeals: savedMealRows,
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
  const [meals, items] = await Promise.all([
    getDb()
      .select()
      .from(savedMeals)
      .where(eq(savedMeals.userId, userId))
      .orderBy(desc(savedMeals.updatedAt)),
    getDb()
      .select({
        savedMealId: savedMealItems.savedMealId,
        foodId: foods.id,
        foodName: foods.name,
        brand: foods.brand,
        servingId: servings.id,
        servingLabel: servings.label,
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
        foodNutrientValues,
        eq(foodNutrientValues.servingId, savedMealItems.servingId),
      )
      .where(eq(savedMeals.userId, userId)),
  ]);

  return meals.map((meal) => {
    const mealItems = items.filter((item) => item.savedMealId === meal.id);
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
