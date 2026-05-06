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
  servings,
  userProfiles,
  userSettings,
  users,
  waterLogs,
  weightLogs,
} from "@/db/schema";
import { calculateBmi } from "@/lib/bmi";
import { recentDateKeys, toDateInputValue } from "@/lib/dates";
import { sumNutrients } from "@/lib/nutrition";

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

export async function getFoodsPageData() {
  return getDb()
    .select({
      foodId: foods.id,
      name: foods.name,
      brand: foods.brand,
      foodType: foods.foodType,
      confidenceStatus: foods.confidenceStatus,
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
}

export async function getFoodLogPageData(userId: string, date = toDateInputValue()) {
  const [foodOptions, logs] = await Promise.all([
    getFoodOptions(),
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, date)))
      .orderBy(asc(foodLogs.mealType), desc(foodLogs.loggedAt)),
  ]);

  return { date, foodOptions, logs };
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

export async function getHealthPageData(userId: string) {
  const { settings } = await getProfileAndSettings(userId);
  const [bloodPressure, bloodGlucose] = await Promise.all([
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
  ]);

  return { bloodPressure, bloodGlucose, settings };
}

export async function getDashboardData(userId: string) {
  const today = toDateInputValue();
  const { profile, settings } = await getProfileAndSettings(userId);

  const [
    todayFoodLogs,
    todayWaterLogs,
    latestWeight,
    todayExerciseLogs,
    latestBloodPressure,
    latestBloodGlucose,
    trends,
  ] = await Promise.all([
    getDb()
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, today))),
    getDb()
      .select()
      .from(waterLogs)
      .where(and(eq(waterLogs.userId, userId), eq(waterLogs.logDate, today))),
    getDb()
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(1),
    getDb()
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), eq(exerciseLogs.logDate, today))),
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

  return {
    today,
    profile,
    settings,
    nutrition,
    waterTotalMl,
    exerciseDurationMinutes,
    exerciseCalories,
    latestWeight: latestWeightLog,
    bmi,
    latestBloodPressure: latestBloodPressure[0] ?? null,
    latestBloodGlucose: latestBloodGlucose[0] ?? null,
    trends,
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
