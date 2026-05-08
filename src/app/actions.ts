"use server";

import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import {
  bloodGlucoseLogs,
  bloodPressureLogs,
  dataSources,
  exerciseLogs,
  foodAliases,
  foodFavorites,
  foodLogs,
  foodNutrientValues,
  foods,
  savedMealItems,
  savedMeals,
  servings,
  stepLogs,
  userProfiles,
  userSettings,
  waterLogs,
  weightLogs,
} from "@/db/schema";
import { destroySession, requireUser } from "@/lib/auth/session";
import { parseAliasInput } from "@/lib/food-aliases";
import { buildCopiedFoodLogs, type CurrentCopyFoodItem } from "@/lib/food-copy";
import { parseServingOptionsInput } from "@/lib/food-servings";
import {
  serializeDashboardPreferences,
  type DashboardPreferences,
} from "@/lib/dashboard-preferences";
import {
  removeProfilePicture,
  saveProfilePicture,
} from "@/lib/profile-picture";
import {
  scaleNutrientsForServing,
  type NutrientSnapshot,
} from "@/lib/nutrition";
import {
  ALL_MEAL_TYPES,
  normalizeMealType,
} from "@/lib/tracking";
import {
  MeasurementValidationError,
  validateGlucoseEntry,
  validateHeightEntry,
  validateWaterEntry,
  validateWeightEntry,
} from "@/lib/validation/measurements";
import { toDateInputValue } from "@/lib/dates";

const mealTypeSchema = z.enum(ALL_MEAL_TYPES);
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

const allowedReturnPathnames = new Set([
  "/dashboard",
  "/exercise",
  "/foods",
  "/health",
  "/log",
  "/movement",
  "/settings",
  "/water",
  "/weight",
  "/scan",
]);
const allowedReturnPathPrefixes = ["/log/"];

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateSettingsAction(formData: FormData) {
  const user = await requireUser();
  let displayName = "";

  try {
    displayName = requiredString(formData, "displayName");
    const heightUnit = heightUnitSchema.parse(
      requiredString(formData, "heightUnit"),
    );
    const weightUnit = weightUnitSchema.parse(
      requiredString(formData, "weightUnit"),
    );
    const waterUnit = waterUnitSchema.parse(requiredString(formData, "waterUnit"));
    const bloodGlucoseUnit = glucoseUnitSchema.parse(
      requiredString(formData, "bloodGlucoseUnit"),
    );
    const dailyWaterGoalUnit = waterUnitSchema.parse(
      requiredString(formData, "dailyWaterGoalUnit"),
    );
    const dailyWaterGoal = validateWaterEntry(
      requiredNumber(formData, "dailyWaterGoal"),
      dailyWaterGoalUnit,
    );
    const dashboardPreferences: DashboardPreferences = {
      calorieTarget: optionalPositiveNumber(formData, "calorieTarget"),
      macroTargets: {
        proteinG: optionalPositiveNumber(formData, "proteinTargetG"),
        carbsG: optionalPositiveNumber(formData, "carbsTargetG"),
        fatG: optionalPositiveNumber(formData, "fatTargetG"),
      },
    };

    const heightEntryValue = optionalNumber(formData, "heightValue");
    const heightEntryInches = optionalNumber(formData, "heightInches") ?? 0;
    const height =
      heightEntryValue === null
        ? {
            heightCm: null,
            heightEntryValue: null,
            heightEntryUnit: null,
          }
        : validateHeightEntry({
            unit: heightUnit,
            value: heightEntryValue,
            inches: heightEntryInches,
          });
    const goalWeightValue = optionalNumber(formData, "goalWeightValue");
    const goalWeight =
      goalWeightValue === null
        ? null
        : validateWeightEntry(
            goalWeightValue,
            weightUnitSchema.parse(requiredString(formData, "goalWeightUnit")),
          ).weightKg;

    await getDb()
      .insert(userProfiles)
      .values({
        userId: user.id,
        displayName,
        heightCm: height.heightCm,
        heightEntryValue: height.heightEntryValue,
        heightEntryUnit: height.heightEntryUnit,
        goalWeightKg: goalWeight,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          displayName,
          heightCm: height.heightCm,
          heightEntryValue: height.heightEntryValue,
          heightEntryUnit: height.heightEntryUnit,
          goalWeightKg: goalWeight,
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
        dailyWaterGoalMl: Math.round(dailyWaterGoal.amountMl),
        dashboardPreferences: serializeDashboardPreferences(dashboardPreferences),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          weightUnit,
          heightUnit,
          waterUnit,
          bloodGlucoseUnit,
          dailyWaterGoalMl: Math.round(dailyWaterGoal.amountMl),
          dashboardPreferences: serializeDashboardPreferences(dashboardPreferences),
          updatedAt: new Date(),
        },
      });

    const startingWeightValue = optionalNumber(formData, "startingWeightValue");
    if (startingWeightValue !== null) {
      const startingWeightUnit = weightUnitSchema.parse(
        requiredString(formData, "startingWeightUnit"),
      );
      const startingWeight = validateWeightEntry(
        startingWeightValue,
        startingWeightUnit,
      );

      await getDb().insert(weightLogs).values({
        userId: user.id,
        logDate:
          optionalDateString(formData, "startingWeightDate") ??
          toDateInputValue(),
        weightKg: startingWeight.weightKg,
        entryWeightValue: startingWeight.entryWeightValue,
        entryWeightUnit: startingWeight.entryWeightUnit,
        notes: "Starting weight",
      });
    }
  } catch (error) {
    logActionError("Settings save failed", error);
    redirect(`/settings?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  revalidatePath("/weight");
  revalidatePath("/dashboard");
  redirect("/settings?saved=1");
}

export async function uploadProfilePictureAction(formData: FormData) {
  const user = await requireUser();

  try {
    const file = formData.get("profilePicture");

    if (!(file instanceof File)) {
      throw new Error("Choose an image before uploading.");
    }

    await saveProfilePicture(user.id, file);
  } catch (error) {
    logActionError("Profile picture upload failed", error);
    redirect(`/settings?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?saved=profile-picture");
}

export async function removeProfilePictureAction() {
  const user = await requireUser();

  try {
    await removeProfilePicture(user.id);
  } catch (error) {
    logActionError("Profile picture removal failed", error);
    redirect(`/settings?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?saved=profile-picture-removed");
}

export async function createManualFoodAction(formData: FormData) {
  const user = await requireUser();
  const sourceId = await getManualDataSourceId();
  const aliases = parseAliasInput(optionalString(formData, "aliases"));
  const additionalServings = parseServingOptionsInput(
    optionalString(formData, "servingOptions"),
  );

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
  await syncFoodAliases(food.id, aliases);
  await replaceAdditionalServings(food.id, additionalServings);

  revalidatePath("/foods");
  revalidatePath("/log");
  redirect("/foods?saved=food");
}

export async function updateManualFoodAction(formData: FormData) {
  await requireUser();
  const foodId = requiredString(formData, "foodId");
  const aliases = parseAliasInput(optionalString(formData, "aliases"));
  const additionalServings = parseServingOptionsInput(
    optionalString(formData, "servingOptions"),
  );

  const [food] = await getDb()
    .select({ id: foods.id, foodType: foods.foodType })
    .from(foods)
    .where(and(eq(foods.id, foodId), eq(foods.foodType, "manual")))
    .limit(1);

  if (!food) {
    redirect(
      `/foods?error=${encodeURIComponent("Only manual foods can be edited.")}`,
    );
  }

  const [serving] = await getDb()
    .select({ id: servings.id })
    .from(servings)
    .where(and(eq(servings.foodId, foodId), eq(servings.isDefault, true)))
    .limit(1);

  if (!serving) {
    redirect(
      `/foods?error=${encodeURIComponent("Default serving could not be found.")}`,
    );
  }

  await getDb()
    .update(foods)
    .set({
      name: requiredString(formData, "name"),
      brand: optionalString(formData, "brand"),
      updatedAt: new Date(),
    })
    .where(eq(foods.id, foodId));

  await getDb()
    .update(servings)
    .set({
      label: requiredString(formData, "servingLabel"),
      grams: optionalNumber(formData, "grams"),
      millilitres: optionalNumber(formData, "millilitres"),
    })
    .where(eq(servings.id, serving.id));

  await getDb()
    .update(foodNutrientValues)
    .set({
      calories: requiredNumber(formData, "calories"),
      proteinG: requiredNumber(formData, "proteinG"),
      carbsG: requiredNumber(formData, "carbsG"),
      fatG: requiredNumber(formData, "fatG"),
      fibreG: optionalNumber(formData, "fibreG"),
      sugarG: optionalNumber(formData, "sugarG"),
      sodiumMg: optionalNumber(formData, "sodiumMg"),
    })
    .where(eq(foodNutrientValues.servingId, serving.id));
  await syncFoodAliases(foodId, aliases);
  await replaceAdditionalServings(foodId, additionalServings);

  revalidatePath("/foods");
  revalidatePath("/log");
  revalidatePath("/dashboard");
  redirect(`/foods?saved=food`);
}

export async function logFoodAction(formData: FormData) {
  const user = await requireUser();
  const foodServing = requiredString(formData, "foodServing").split("|");
  const [foodId, servingId] = foodServing;
  const quantity = requiredNumber(formData, "quantity");
  const logDate = requiredString(formData, "logDate");
  const mealType = normalizeMealType(
    mealTypeSchema.parse(requiredString(formData, "mealType")),
  );
  const successPath = safeReturnTo(
    formData,
    `/log?date=${encodeURIComponent(logDate)}&meal=${mealType}`,
  );

  const row = await getCurrentFoodServing(foodId, servingId);

  if (!row) {
    throw new Error("Selected food could not be found.");
  }

  const scaled = scaleNutrientsForServing(row.nutrients, {
    baseServing: row.baseServing,
    selectedServing: row.selectedServing,
    quantity,
  });

  if (!scaled) {
    redirect(
      `${successPath}&error=${encodeURIComponent(
        "Selected serving needs grams or millilitres before it can be logged.",
      )}`,
    );
  }

  await getDb().insert(foodLogs).values({
    userId: user.id,
    foodId: row.foodId,
    servingId: row.servingId,
    logDate,
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
  revalidatePath("/health");
  redirect(successPath);
}

export async function toggleFoodFavoriteAction(formData: FormData) {
  await requireUser();
  const foodId = requiredString(formData, "foodId");
  const servingId = requiredString(formData, "servingId");
  const returnTo = safeReturnTo(formData, "/log");

  const [existing] = await getDb()
    .select({ id: foodFavorites.id })
    .from(foodFavorites)
    .where(
      and(
        eq(foodFavorites.foodId, foodId),
        eq(foodFavorites.servingId, servingId),
      ),
    )
    .limit(1);

  if (existing) {
    await getDb().delete(foodFavorites).where(eq(foodFavorites.id, existing.id));
  } else {
    await getDb().insert(foodFavorites).values({ foodId, servingId });
  }

  revalidatePath("/log");
  revalidatePath("/foods");
  redirect(returnTo);
}

export async function logWeightAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/weight?saved=1");
  try {
    const entryWeightUnit = weightUnitSchema.parse(
      requiredString(formData, "entryWeightUnit"),
    );
    const weight = validateWeightEntry(
      requiredNumber(formData, "entryWeightValue"),
      entryWeightUnit,
    );

    await getDb().insert(weightLogs).values({
      userId: user.id,
      logDate: requiredString(formData, "logDate"),
      weightKg: weight.weightKg,
      entryWeightValue: weight.entryWeightValue,
      entryWeightUnit: weight.entryWeightUnit,
      notes: optionalString(formData, "notes"),
    });
  } catch (error) {
    logActionError("Weight log save failed", error);
    redirect(`/weight?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/weight");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(successPath);
}

export async function logWaterAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/water?saved=1");
  try {
    const entryUnit = waterUnitSchema.parse(requiredString(formData, "entryUnit"));
    const water = validateWaterEntry(requiredNumber(formData, "entryAmount"), entryUnit);

    await getDb().insert(waterLogs).values({
      userId: user.id,
      logDate: requiredString(formData, "logDate"),
      amountMl: water.amountMl,
      entryAmount: water.entryAmount,
      entryUnit: water.entryUnit,
      notes: optionalString(formData, "notes"),
    });
  } catch (error) {
    logActionError("Water log save failed", error);
    redirect(`/water?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/water");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(successPath);
}

export async function logExerciseAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/movement?saved=1");

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
  revalidatePath("/movement");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(successPath);
}

export async function logStepAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/movement?saved=steps");

  try {
    const steps = requiredInteger(formData, "steps");
    if (steps < 1 || steps > 200000) {
      throw new MeasurementValidationError(
        "Steps must be between 1 and 200,000.",
      );
    }

    await getDb().insert(stepLogs).values({
      userId: user.id,
      logDate: requiredString(formData, "logDate"),
      steps,
      source: "manual",
      notes: optionalString(formData, "notes"),
    });
  } catch (error) {
    logActionError("Step log save failed", error);
    redirect(`/movement?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/movement");
  revalidatePath("/dashboard");
  redirect(successPath);
}

export async function setGoalWeightAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/weight?saved=goal");

  try {
    const value = optionalNumber(formData, "goalWeightValue");
    const goalWeightKg =
      value === null
        ? null
        : validateWeightEntry(
            value,
            weightUnitSchema.parse(requiredString(formData, "goalWeightUnit")),
          ).weightKg;

    await getDb()
      .insert(userProfiles)
      .values({
        userId: user.id,
        displayName: user.displayName,
        goalWeightKg,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          goalWeightKg,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    logActionError("Goal weight save failed", error);
    redirect(`/weight?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/weight");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect(successPath);
}

export async function updateFoodLogQuantityAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredString(formData, "id");
  const quantity = requiredNumber(formData, "quantity");
  const successPath = safeReturnTo(formData, "/log?saved=quantity");

  if (quantity <= 0 || quantity > 100) {
    redirect(`/log?error=${encodeURIComponent("Quantity must be above 0.")}`);
  }

  const [log] = await getDb()
    .select()
    .from(foodLogs)
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, user.id)))
    .limit(1);

  if (!log) {
    redirect(`/log?error=${encodeURIComponent("Food log could not be found.")}`);
  }

  const ratio = log.quantity > 0 ? quantity / log.quantity : quantity;

  await getDb()
    .update(foodLogs)
    .set({
      quantity,
      caloriesSnapshot: log.caloriesSnapshot * ratio,
      proteinGSnapshot: log.proteinGSnapshot * ratio,
      carbsGSnapshot: log.carbsGSnapshot * ratio,
      fatGSnapshot: log.fatGSnapshot * ratio,
      fibreGSnapshot:
        log.fibreGSnapshot === null ? null : log.fibreGSnapshot * ratio,
      sugarGSnapshot:
        log.sugarGSnapshot === null ? null : log.sugarGSnapshot * ratio,
      sodiumMgSnapshot:
        log.sodiumMgSnapshot === null ? null : log.sodiumMgSnapshot * ratio,
      updatedAt: new Date(),
    })
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, user.id)));

  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(successPath);
}

export async function saveMealAction(formData: FormData) {
  const user = await requireUser();
  const logDate = requiredString(formData, "logDate");
  const mealType = normalizeMealType(
    mealTypeSchema.parse(requiredString(formData, "mealType")),
  );
  const successPath = safeReturnTo(
    formData,
    `/log/${mealType}/review?date=${encodeURIComponent(logDate)}&saved=meal`,
  );

  const rows = await getDb()
    .select()
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, user.id),
        eq(foodLogs.logDate, logDate),
        eq(foodLogs.mealType, mealType),
      ),
    );

  const savableRows = rows.filter((row) => row.foodId);
  if (savableRows.length === 0) {
    redirect(
      `/log/${mealType}/review?date=${encodeURIComponent(
        logDate,
      )}&error=${encodeURIComponent("Add foods before saving a meal.")}`,
    );
  }

  const [meal] = await getDb()
    .insert(savedMeals)
    .values({
      userId: user.id,
      name: requiredString(formData, "name"),
      mealType,
      notes: optionalString(formData, "notes"),
    })
    .returning({ id: savedMeals.id });

  await getDb().insert(savedMealItems).values(
    savableRows.map((row) => ({
      savedMealId: meal.id,
      foodId: row.foodId!,
      servingId: row.servingId,
      quantity: row.quantity,
    })),
  );

  revalidatePath("/log");
  redirect(successPath);
}

export async function updateSavedMealAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredString(formData, "id");
  const mealTypeValue = optionalString(formData, "mealType");
  const mealType = mealTypeValue
    ? normalizeMealType(mealTypeSchema.parse(mealTypeValue))
    : null;
  const successPath = safeReturnTo(formData, "/log?saved=meal-updated");

  await getDb()
    .update(savedMeals)
    .set({
      name: requiredString(formData, "name"),
      mealType,
      notes: optionalString(formData, "notes"),
      updatedAt: new Date(),
    })
    .where(and(eq(savedMeals.id, id), eq(savedMeals.userId, user.id)));

  revalidatePath("/log");
  redirect(successPath);
}

export async function deleteSavedMealAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredString(formData, "id");
  const successPath = safeReturnTo(formData, "/log?saved=meal-deleted");

  await getDb()
    .delete(savedMeals)
    .where(and(eq(savedMeals.id, id), eq(savedMeals.userId, user.id)));

  revalidatePath("/log");
  redirect(successPath);
}

export async function toggleSavedMealFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredString(formData, "id");
  const returnTo = safeReturnTo(formData, "/log");

  const [meal] = await getDb()
    .select({ id: savedMeals.id, isFavorite: savedMeals.isFavorite })
    .from(savedMeals)
    .where(and(eq(savedMeals.id, id), eq(savedMeals.userId, user.id)))
    .limit(1);

  if (!meal) {
    redirect(`/log?error=${encodeURIComponent("Saved meal could not be found.")}`);
  }

  await getDb()
    .update(savedMeals)
    .set({ isFavorite: !meal.isFavorite, updatedAt: new Date() })
    .where(and(eq(savedMeals.id, id), eq(savedMeals.userId, user.id)));

  revalidatePath("/log");
  redirect(returnTo);
}

export async function addSavedMealToLogAction(formData: FormData) {
  const user = await requireUser();
  const savedMealId = requiredString(formData, "savedMealId");
  const logDate = requiredString(formData, "logDate");
  const mealType = normalizeMealType(
    mealTypeSchema.parse(requiredString(formData, "mealType")),
  );
  const successPath = safeReturnTo(
    formData,
    `/log/${mealType}/review?date=${encodeURIComponent(logDate)}&saved=meal`,
  );

  const [savedMeal] = await getDb()
    .select({ id: savedMeals.id })
    .from(savedMeals)
    .where(and(eq(savedMeals.id, savedMealId), eq(savedMeals.userId, user.id)))
    .limit(1);

  if (!savedMeal) {
    redirect(`/log?error=${encodeURIComponent("Saved meal could not be found.")}`);
  }

  const sourceItems = await getDb()
    .select({
      foodId: savedMealItems.foodId,
      servingId: savedMealItems.servingId,
      quantity: savedMealItems.quantity,
      notes: savedMeals.notes,
    })
    .from(savedMealItems)
    .innerJoin(savedMeals, eq(savedMealItems.savedMealId, savedMeals.id))
    .where(eq(savedMealItems.savedMealId, savedMealId));

  if (sourceItems.length === 0) {
    redirect(`/log?error=${encodeURIComponent("Saved meal has no foods.")}`);
  }

  const currentItemsByKey = await getCurrentFoodServingMap(sourceItems);
  const copyResult = buildCopiedFoodLogs({
    userId: user.id,
    logDate,
    mealType,
    sourceItems,
    currentItemsByKey,
  });

  if (copyResult.logs.length === 0) {
    redirect(
      addSearchParams(successPath, {
        error: "Saved meal foods are no longer available.",
      }),
    );
  }

  await getDb().insert(foodLogs).values(
    copyResult.logs.map((log) => ({
      ...log,
      sourceSnapshot: {
        ...log.sourceSnapshot,
        source: "saved_meal",
        savedMealId,
      },
    })),
  );

  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(
    addSearchParams(successPath, {
      skipped: copyResult.skippedCount || null,
    }),
  );
}

export async function copyLoggedMealAction(formData: FormData) {
  const user = await requireUser();
  const sourceDate = requiredString(formData, "sourceDate");
  const sourceMealType = normalizeMealType(
    mealTypeSchema.parse(requiredString(formData, "sourceMealType")),
  );
  const logDate = requiredString(formData, "logDate");
  const mealType = normalizeMealType(
    mealTypeSchema.parse(requiredString(formData, "mealType")),
  );
  const successPath = safeReturnTo(
    formData,
    `/log/${mealType}/add?date=${encodeURIComponent(logDate)}&tab=my-meals`,
  );

  const sourceItems = await getDb()
    .select({
      foodId: foodLogs.foodId,
      servingId: foodLogs.servingId,
      quantity: foodLogs.quantity,
      notes: foodLogs.notes,
    })
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, user.id),
        eq(foodLogs.logDate, sourceDate),
        eq(foodLogs.mealType, sourceMealType),
      ),
    );

  if (sourceItems.length === 0) {
    redirect(
      addSearchParams(successPath, {
        error: "There are no foods to copy from that meal.",
      }),
    );
  }

  const currentItemsByKey = await getCurrentFoodServingMap(sourceItems);
  const copyResult = buildCopiedFoodLogs({
    userId: user.id,
    logDate,
    mealType,
    sourceItems,
    currentItemsByKey,
  });

  if (copyResult.logs.length === 0) {
    redirect(
      addSearchParams(successPath, {
        error: "Those foods are no longer available to copy.",
      }),
    );
  }

  await getDb().insert(foodLogs).values(copyResult.logs);

  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/health");
  redirect(
    addSearchParams(successPath, {
      saved: "copy",
      skipped: copyResult.skippedCount || null,
    }),
  );
}

export async function logBloodPressureAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/health?saved=pressure");
  try {
    const systolicMmhg = requiredInteger(formData, "systolicMmhg");
    const diastolicMmhg = requiredInteger(formData, "diastolicMmhg");
    const pulseBpm = optionalInteger(formData, "pulseBpm");

    if (systolicMmhg < 50 || systolicMmhg > 260) {
      throw new MeasurementValidationError(
        "Systolic pressure must be between 50 and 260 mmHg.",
      );
    }
    if (diastolicMmhg < 30 || diastolicMmhg > 160) {
      throw new MeasurementValidationError(
        "Diastolic pressure must be between 30 and 160 mmHg.",
      );
    }
    if (pulseBpm !== null && (pulseBpm < 30 || pulseBpm > 220)) {
      throw new MeasurementValidationError(
        "Pulse must be between 30 and 220 bpm.",
      );
    }

    await getDb().insert(bloodPressureLogs).values({
      userId: user.id,
      logDate: requiredString(formData, "logDate"),
      systolicMmhg,
      diastolicMmhg,
      pulseBpm,
      notes: optionalString(formData, "notes"),
    });
  } catch (error) {
    logActionError("Blood pressure log save failed", error);
    redirect(`/health?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/health");
  revalidatePath("/dashboard");
  redirect(successPath);
}

export async function logBloodGlucoseAction(formData: FormData) {
  const user = await requireUser();
  const successPath = safeReturnTo(formData, "/health?saved=glucose");
  try {
    const entryUnit = glucoseUnitSchema.parse(requiredString(formData, "entryUnit"));
    const glucose = validateGlucoseEntry(
      requiredNumber(formData, "entryValue"),
      entryUnit,
    );

    await getDb().insert(bloodGlucoseLogs).values({
      userId: user.id,
      logDate: requiredString(formData, "logDate"),
      glucoseMmolL: glucose.glucoseMmolL,
      entryValue: glucose.entryValue,
      entryUnit: glucose.entryUnit,
      context: glucoseContextSchema.parse(requiredString(formData, "context")),
      notes: optionalString(formData, "notes"),
    });
  } catch (error) {
    logActionError("Blood glucose log save failed", error);
    redirect(`/health?error=${encodeURIComponent(actionErrorMessage(error))}`);
  }

  revalidatePath("/health");
  revalidatePath("/dashboard");
  redirect(successPath);
}

export async function deleteFoodLogAction(formData: FormData) {
  const successPath = safeReturnTo(formData, "/log");
  await deleteOwnLog(foodLogs, requiredString(formData, "id"), "/log");
  redirect(successPath);
}

export async function deleteWeightLogAction(formData: FormData) {
  await deleteOwnLog(weightLogs, requiredString(formData, "id"), "/weight");
}

export async function deleteWaterLogAction(formData: FormData) {
  await deleteOwnLog(waterLogs, requiredString(formData, "id"), "/water");
}

export async function deleteExerciseLogAction(formData: FormData) {
  await deleteOwnLog(exerciseLogs, requiredString(formData, "id"), "/movement");
}

export async function deleteStepLogAction(formData: FormData) {
  await deleteOwnLog(stepLogs, requiredString(formData, "id"), "/movement");
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

async function syncFoodAliases(foodId: string, aliases: string[]) {
  await getDb().delete(foodAliases).where(eq(foodAliases.foodId, foodId));

  if (aliases.length === 0) return;

  await getDb().insert(foodAliases).values(
    aliases.map((aliasValue) => ({
      foodId,
      alias: aliasValue,
    })),
  );
}

async function replaceAdditionalServings(
  foodId: string,
  servingOptions: { label: string; grams: number | null; millilitres: number | null }[],
) {
  await getDb()
    .delete(servings)
    .where(and(eq(servings.foodId, foodId), eq(servings.isDefault, false)));

  if (servingOptions.length === 0) return;

  await getDb().insert(servings).values(
    servingOptions.map((serving) => ({
      foodId,
      label: serving.label,
      grams: serving.grams,
      millilitres: serving.millilitres,
      isDefault: false,
    })),
  );
}

async function getCurrentFoodServing(foodId: string, servingId: string) {
  const baseServings = alias(servings, "current_base_servings");
  const [row] = await getDb()
    .select({
      foodId: foods.id,
      foodName: foods.name,
      brand: foods.brand,
      confidenceStatus: foods.confidenceStatus,
      servingId: servings.id,
      servingLabel: servings.label,
      servingIsDefault: servings.isDefault,
      servingGrams: servings.grams,
      servingMillilitres: servings.millilitres,
      baseServingId: baseServings.id,
      baseServingGrams: baseServings.grams,
      baseServingMillilitres: baseServings.millilitres,
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
      baseServings,
      and(eq(baseServings.foodId, foods.id), eq(baseServings.isDefault, true)),
    )
    .innerJoin(foodNutrientValues, eq(foodNutrientValues.servingId, baseServings.id))
    .where(and(eq(foods.id, foodId), eq(servings.id, servingId)))
    .limit(1);

  if (!row) return null;

  return {
    foodId: row.foodId,
    servingId: row.servingId,
    foodName: row.foodName,
    brand: row.brand,
    confidenceStatus: row.confidenceStatus,
    servingLabel: row.servingLabel,
    baseServing: {
      id: row.baseServingId,
      isDefault: true,
      grams: row.baseServingGrams,
      millilitres: row.baseServingMillilitres,
    },
    selectedServing: {
      id: row.servingId,
      isDefault: row.servingIsDefault,
      grams: row.servingGrams,
      millilitres: row.servingMillilitres,
    },
    nutrients: {
      calories: row.calories,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      fibreG: row.fibreG,
      sugarG: row.sugarG,
      sodiumMg: row.sodiumMg,
    } satisfies NutrientSnapshot,
  };
}

async function getCurrentFoodServingMap(
  foodServingPairs: { foodId: string | null; servingId: string | null }[],
) {
  const pairs = foodServingPairs.filter(
    (pair): pair is { foodId: string; servingId: string } =>
      Boolean(pair.foodId && pair.servingId),
  );
  const currentItems = new Map<string, CurrentCopyFoodItem>();

  for (const pair of pairs) {
    const current = await getCurrentFoodServing(pair.foodId, pair.servingId);
    if (current) {
      currentItems.set(`${pair.foodId}|${pair.servingId}`, current);
    }
  }

  return currentItems;
}

async function deleteOwnLog(
  table:
    | typeof foodLogs
    | typeof weightLogs
    | typeof waterLogs
    | typeof exerciseLogs
    | typeof stepLogs
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
  if (path === "/movement") {
    revalidatePath("/exercise");
  }
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

function optionalDateString(formData: FormData, name: string) {
  const value = optionalString(formData, name);
  if (value === null) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MeasurementValidationError(`${name} must be a valid date.`);
  }

  return value;
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

function optionalPositiveNumber(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);

  return value !== null && value > 0 ? value : null;
}

function requiredInteger(formData: FormData, name: string) {
  return Math.round(requiredNumber(formData, name));
}

function optionalInteger(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);
  return value === null ? null : Math.round(value);
}

function actionErrorMessage(error: unknown) {
  if (error instanceof MeasurementValidationError) {
    return error.message;
  }

  if (error instanceof z.ZodError) {
    return "Please check the selected unit and try again.";
  }

  if (error instanceof Error && error.message.endsWith("is required.")) {
    return error.message;
  }

  if (
    error instanceof Error &&
    (error.message.startsWith("Choose ") ||
      error.message.startsWith("Profile picture must"))
  ) {
    return error.message;
  }

  return "Save failed. Please try again.";
}

function logActionError(message: string, error: unknown) {
  if (error instanceof MeasurementValidationError) {
    return;
  }

  if (error instanceof Error) {
    console.error(message, {
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error(message, { error: String(error) });
}

function safeReturnTo(formData: FormData, fallback: string) {
  const value = optionalString(formData, "returnTo");
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://homeplate.local");
    const allowed =
      allowedReturnPathnames.has(url.pathname) ||
      allowedReturnPathPrefixes.some((prefix) => url.pathname.startsWith(prefix));
    if (!allowed) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

function addSearchParams(
  path: string,
  params: Record<string, string | number | null>,
) {
  const url = new URL(path, "http://homeplate.local");

  for (const [key, value] of Object.entries(params)) {
    if (value === null) continue;
    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}`;
}
