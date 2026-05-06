"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  waterLogs,
  weightLogs,
} from "@/db/schema";
import { destroySession, requireUser } from "@/lib/auth/session";
import {
  normalizeGlucoseToMmolL,
  normalizeHeightToCm,
  normalizeWaterToMl,
  normalizeWeightToKg,
} from "@/lib/units";
import { scaleNutrients } from "@/lib/nutrition";

const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const weightUnitSchema = z.enum(["lb", "kg"]);
const heightUnitSchema = z.enum(["cm", "ft_in"]);
const waterUnitSchema = z.enum(["ml", "oz", "cups"]);
const glucoseUnitSchema = z.enum(["mmol_l", "mg_dl"]);
const glucoseContextSchema = z.enum([
  "fasting",
  "before_meal",
  "after_meal",
  "bedtime",
  "other",
]);

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  const displayName = requiredString(formData, "displayName");
  const heightUnit = heightUnitSchema.parse(requiredString(formData, "heightUnit"));
  const weightUnit = weightUnitSchema.parse(requiredString(formData, "weightUnit"));
  const waterUnit = waterUnitSchema.parse(requiredString(formData, "waterUnit"));
  const bloodGlucoseUnit = glucoseUnitSchema.parse(
    requiredString(formData, "bloodGlucoseUnit"),
  );
  const dailyWaterGoalMl = Math.round(
    normalizeWaterToMl(
      requiredNumber(formData, "dailyWaterGoal"),
      waterUnitSchema.parse(requiredString(formData, "dailyWaterGoalUnit")),
    ),
  );

  const heightEntryValue = optionalNumber(formData, "heightValue");
  const heightEntryInches = optionalNumber(formData, "heightInches") ?? 0;
  const heightCm =
    heightEntryValue === null
      ? null
      : normalizeHeightToCm(heightEntryValue, heightUnit, heightEntryInches);

  await getDb()
    .insert(userProfiles)
    .values({
      userId: user.id,
      displayName,
      heightCm,
      heightEntryValue,
      heightEntryUnit: heightEntryValue === null ? null : heightUnit,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName,
        heightCm,
        heightEntryValue,
        heightEntryUnit: heightEntryValue === null ? null : heightUnit,
        updatedAt: new Date(),
      },
    });

  await getDb()
    .insert(userSettings)
    .values({
      userId: user.id,
      weightUnit,
      heightUnit,
      waterUnit,
      bloodGlucoseUnit,
      dailyWaterGoalMl,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        weightUnit,
        heightUnit,
        waterUnit,
        bloodGlucoseUnit,
        dailyWaterGoalMl,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function createManualFoodAction(formData: FormData) {
  const user = await requireUser();
  const sourceId = await getManualDataSourceId();

  const [food] = await getDb()
    .insert(foods)
    .values({
      name: requiredString(formData, "name"),
      brand: optionalString(formData, "brand"),
      foodType: "manual",
      sourceId,
      confidenceStatus: "manual",
      createdBy: user.id,
    })
    .returning({ id: foods.id });

  const [serving] = await getDb()
    .insert(servings)
    .values({
      foodId: food.id,
      label: requiredString(formData, "servingLabel"),
      grams: optionalNumber(formData, "grams"),
      millilitres: optionalNumber(formData, "millilitres"),
      isDefault: true,
    })
    .returning({ id: servings.id });

  await getDb().insert(foodNutrientValues).values({
    foodId: food.id,
    servingId: serving.id,
    calories: requiredNumber(formData, "calories"),
    proteinG: requiredNumber(formData, "proteinG"),
    carbsG: requiredNumber(formData, "carbsG"),
    fatG: requiredNumber(formData, "fatG"),
    fibreG: optionalNumber(formData, "fibreG"),
    sugarG: optionalNumber(formData, "sugarG"),
    sodiumMg: optionalNumber(formData, "sodiumMg"),
  });

  revalidatePath("/foods");
  revalidatePath("/log");
}

export async function logFoodAction(formData: FormData) {
  const user = await requireUser();
  const foodServing = requiredString(formData, "foodServing").split("|");
  const [foodId, servingId] = foodServing;
  const quantity = requiredNumber(formData, "quantity");
  const mealType = mealTypeSchema.parse(requiredString(formData, "mealType"));

  const [row] = await getDb()
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
      fibreG: foodNutrientValues.fibreG,
      sugarG: foodNutrientValues.sugarG,
      sodiumMg: foodNutrientValues.sodiumMg,
    })
    .from(foods)
    .innerJoin(servings, eq(servings.foodId, foods.id))
    .innerJoin(
      foodNutrientValues,
      eq(foodNutrientValues.servingId, servings.id),
    )
    .where(and(eq(foods.id, foodId), eq(servings.id, servingId)))
    .limit(1);

  if (!row) {
    throw new Error("Selected food could not be found.");
  }

  const scaled = scaleNutrients(row, quantity);

  await getDb().insert(foodLogs).values({
    userId: user.id,
    foodId: row.foodId,
    servingId: row.servingId,
    logDate: requiredString(formData, "logDate"),
    mealType,
    quantity,
    foodNameSnapshot: row.brand ? `${row.brand} ${row.foodName}` : row.foodName,
    servingLabelSnapshot: row.servingLabel,
    caloriesSnapshot: scaled.calories,
    proteinGSnapshot: scaled.proteinG,
    carbsGSnapshot: scaled.carbsG,
    fatGSnapshot: scaled.fatG,
    fibreGSnapshot: scaled.fibreG ?? null,
    sugarGSnapshot: scaled.sugarG ?? null,
    sodiumMgSnapshot: scaled.sodiumMg ?? null,
    sourceSnapshot: {
      confidenceStatus: row.confidenceStatus,
      source: "local",
    },
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/log");
  revalidatePath("/dashboard");
}

export async function logWeightAction(formData: FormData) {
  const user = await requireUser();
  const entryWeightValue = requiredNumber(formData, "entryWeightValue");
  const entryWeightUnit = weightUnitSchema.parse(
    requiredString(formData, "entryWeightUnit"),
  );

  await getDb().insert(weightLogs).values({
    userId: user.id,
    logDate: requiredString(formData, "logDate"),
    weightKg: normalizeWeightToKg(entryWeightValue, entryWeightUnit),
    entryWeightValue,
    entryWeightUnit,
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/weight");
  revalidatePath("/dashboard");
}

export async function logWaterAction(formData: FormData) {
  const user = await requireUser();
  const entryAmount = requiredNumber(formData, "entryAmount");
  const entryUnit = waterUnitSchema.parse(requiredString(formData, "entryUnit"));

  await getDb().insert(waterLogs).values({
    userId: user.id,
    logDate: requiredString(formData, "logDate"),
    amountMl: normalizeWaterToMl(entryAmount, entryUnit),
    entryAmount,
    entryUnit,
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/water");
  revalidatePath("/dashboard");
}

export async function logExerciseAction(formData: FormData) {
  const user = await requireUser();

  await getDb().insert(exerciseLogs).values({
    userId: user.id,
    logDate: requiredString(formData, "logDate"),
    activity: requiredString(formData, "activity"),
    durationMinutes: optionalInteger(formData, "durationMinutes"),
    caloriesBurned: optionalInteger(formData, "caloriesBurned"),
    intensity: optionalString(formData, "intensity"),
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/exercise");
  revalidatePath("/dashboard");
}

export async function logBloodPressureAction(formData: FormData) {
  const user = await requireUser();

  await getDb().insert(bloodPressureLogs).values({
    userId: user.id,
    logDate: requiredString(formData, "logDate"),
    systolicMmhg: requiredInteger(formData, "systolicMmhg"),
    diastolicMmhg: requiredInteger(formData, "diastolicMmhg"),
    pulseBpm: optionalInteger(formData, "pulseBpm"),
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function logBloodGlucoseAction(formData: FormData) {
  const user = await requireUser();
  const entryValue = requiredNumber(formData, "entryValue");
  const entryUnit = glucoseUnitSchema.parse(requiredString(formData, "entryUnit"));

  await getDb().insert(bloodGlucoseLogs).values({
    userId: user.id,
    logDate: requiredString(formData, "logDate"),
    glucoseMmolL: normalizeGlucoseToMmolL(entryValue, entryUnit),
    entryValue,
    entryUnit,
    context: glucoseContextSchema.parse(requiredString(formData, "context")),
    notes: optionalString(formData, "notes"),
  });

  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function deleteFoodLogAction(formData: FormData) {
  await deleteOwnLog(foodLogs, requiredString(formData, "id"), "/log");
}

export async function deleteWeightLogAction(formData: FormData) {
  await deleteOwnLog(weightLogs, requiredString(formData, "id"), "/weight");
}

export async function deleteWaterLogAction(formData: FormData) {
  await deleteOwnLog(waterLogs, requiredString(formData, "id"), "/water");
}

export async function deleteExerciseLogAction(formData: FormData) {
  await deleteOwnLog(exerciseLogs, requiredString(formData, "id"), "/exercise");
}

export async function deleteBloodPressureLogAction(formData: FormData) {
  await deleteOwnLog(
    bloodPressureLogs,
    requiredString(formData, "id"),
    "/health",
  );
}

export async function deleteBloodGlucoseLogAction(formData: FormData) {
  await deleteOwnLog(bloodGlucoseLogs, requiredString(formData, "id"), "/health");
}

async function getManualDataSourceId() {
  const [existing] = await getDb()
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(eq(dataSources.name, "Household manual entries"))
    .limit(1);

  if (existing) return existing.id;

  const [source] = await getDb()
    .insert(dataSources)
    .values({
      name: "Household manual entries",
      sourceType: "manual",
      attribution: "Private HomePlate household entries.",
    })
    .returning({ id: dataSources.id });

  return source.id;
}

async function deleteOwnLog(
  table:
    | typeof foodLogs
    | typeof weightLogs
    | typeof waterLogs
    | typeof exerciseLogs
    | typeof bloodPressureLogs
    | typeof bloodGlucoseLogs,
  id: string,
  path: string,
) {
  const user = await requireUser();

  await getDb()
    .delete(table)
    .where(and(eq(table.id, id), eq(table.userId, user.id)));

  revalidatePath(path);
  revalidatePath("/dashboard");
}

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error(`${name} is required.`);
  }

  return normalized;
}

function optionalString(formData: FormData, name: string) {
  const value = formData.get(name);
  const normalized = typeof value === "string" ? value.trim() : "";

  return normalized || null;
}

function requiredNumber(formData: FormData, name: string) {
  const value = Number(requiredString(formData, name));

  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return value;
}

function optionalNumber(formData: FormData, name: string) {
  const value = optionalString(formData, name);
  if (value === null) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return parsed;
}

function requiredInteger(formData: FormData, name: string) {
  return Math.round(requiredNumber(formData, name));
}

function optionalInteger(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);
  return value === null ? null : Math.round(value);
}
