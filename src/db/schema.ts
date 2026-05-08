import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const heightUnitEnum = pgEnum("height_unit", ["cm", "ft_in"]);
export const weightUnitEnum = pgEnum("weight_unit", ["lb", "kg"]);
export const waterUnitEnum = pgEnum("water_unit", ["ml", "oz", "cups"]);
export const bloodGlucoseUnitEnum = pgEnum("blood_glucose_unit", [
  "mmol_l",
  "mg_dl",
]);
export const energyUnitEnum = pgEnum("energy_unit", ["kcal"]);
export const sourceTypeEnum = pgEnum("source_type", [
  "manual",
  "cnf",
  "open_food_facts",
  "ocr",
]);
export const foodTypeEnum = pgEnum("food_type", [
  "manual",
  "generic",
  "branded",
  "recipe",
]);
export const confidenceStatusEnum = pgEnum("confidence_status", [
  "verified",
  "imported",
  "provisional",
  "manual",
  "ocr_draft",
]);
export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
  "snack",
]);
export const stepSourceEnum = pgEnum("step_source", ["manual"]);
export const glucoseContextEnum = pgEnum("glucose_context", [
  "fasting",
  "before_meal",
  "after_meal",
  "bedtime",
  "other",
]);
export const importStatusEnum = pgEnum("import_status", [
  "started",
  "completed",
  "failed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.sessionTokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    heightCm: doublePrecision("height_cm"),
    heightEntryValue: doublePrecision("height_entry_value"),
    heightEntryUnit: heightUnitEnum("height_entry_unit"),
    goalWeightKg: doublePrecision("goal_weight_kg"),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_profiles_user_id_unique").on(table.userId)],
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightUnit: weightUnitEnum("weight_unit").default("lb").notNull(),
    heightUnit: heightUnitEnum("height_unit").default("cm").notNull(),
    waterUnit: waterUnitEnum("water_unit").default("ml").notNull(),
    bloodGlucoseUnit: bloodGlucoseUnitEnum("blood_glucose_unit")
      .default("mmol_l")
      .notNull(),
    energyUnit: energyUnitEnum("energy_unit").default("kcal").notNull(),
    dailyWaterGoalMl: integer("daily_water_goal_ml").default(2500).notNull(),
    dashboardPreferences: jsonb("dashboard_preferences").$type<
      Record<string, unknown>
    >(),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_settings_user_id_unique").on(table.userId)],
);

export const dataSources = pgTable(
  "data_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    licenseName: varchar("license_name", { length: 160 }),
    attribution: text("attribution"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("data_sources_open_food_facts_unique")
      .on(table.sourceType)
      .where(sql`${table.sourceType} = 'open_food_facts'`),
  ],
);

export const importRuns = pgTable(
  "import_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id),
    status: importStatusEnum("status").default("started").notNull(),
    sourceFileName: text("source_file_name"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
  },
  (table) => [index("import_runs_data_source_id_idx").on(table.dataSourceId)],
);

export const sourceRecords = pgTable(
  "source_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSources.id),
    importRunId: uuid("import_run_id").references(() => importRuns.id),
    externalId: text("external_id"),
    barcode: varchar("barcode", { length: 32 }),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("source_records_data_source_id_idx").on(table.dataSourceId),
    index("source_records_barcode_idx").on(table.barcode),
    uniqueIndex("source_records_source_external_unique")
      .on(table.dataSourceId, table.externalId)
      .where(sql`${table.externalId} IS NOT NULL`),
  ],
);

export const foods = pgTable(
  "foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 240 }).notNull(),
    brand: varchar("brand", { length: 160 }),
    barcode: varchar("barcode", { length: 32 }),
    foodType: foodTypeEnum("food_type").default("manual").notNull(),
    sourceId: uuid("source_id").references(() => dataSources.id),
    sourceExternalId: text("source_external_id"),
    confidenceStatus: confidenceStatusEnum("confidence_status")
      .default("manual")
      .notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("foods_name_idx").on(table.name),
    index("foods_barcode_idx").on(table.barcode),
    index("foods_source_id_idx").on(table.sourceId),
    uniqueIndex("foods_source_external_unique")
      .on(table.sourceId, table.sourceExternalId)
      .where(
        sql`${table.sourceId} IS NOT NULL AND ${table.sourceExternalId} IS NOT NULL`,
      ),
  ],
);

export const foodAliases = pgTable(
  "food_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    alias: varchar("alias", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("food_aliases_food_alias_unique").on(table.foodId, table.alias),
    index("food_aliases_alias_idx").on(table.alias),
  ],
);

export const servings = pgTable(
  "servings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    grams: doublePrecision("grams"),
    millilitres: doublePrecision("millilitres"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("servings_food_id_idx").on(table.foodId)],
);

export const foodFavorites = pgTable(
  "food_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    servingId: uuid("serving_id")
      .notNull()
      .references(() => servings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("food_favorites_food_serving_unique").on(
      table.foodId,
      table.servingId,
    ),
    index("food_favorites_food_id_idx").on(table.foodId),
    index("food_favorites_serving_id_idx").on(table.servingId),
  ],
);

export const foodNutrientValues = pgTable(
  "food_nutrient_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    servingId: uuid("serving_id").references(() => servings.id, {
      onDelete: "cascade",
    }),
    calories: doublePrecision("calories").default(0).notNull(),
    proteinG: doublePrecision("protein_g").default(0).notNull(),
    carbsG: doublePrecision("carbs_g").default(0).notNull(),
    fatG: doublePrecision("fat_g").default(0).notNull(),
    fibreG: doublePrecision("fibre_g"),
    sugarG: doublePrecision("sugar_g"),
    sodiumMg: doublePrecision("sodium_mg"),
    saturatedFatG: doublePrecision("saturated_fat_g"),
    transFatG: doublePrecision("trans_fat_g"),
    cholesterolMg: doublePrecision("cholesterol_mg"),
    potassiumMg: doublePrecision("potassium_mg"),
    calciumMg: doublePrecision("calcium_mg"),
    ironMg: doublePrecision("iron_mg"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("food_nutrient_values_food_id_idx").on(table.foodId),
    index("food_nutrient_values_serving_id_idx").on(table.servingId),
  ],
);

export const foodLogs = pgTable(
  "food_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, {
      onDelete: "set null",
    }),
    servingId: uuid("serving_id").references(() => servings.id, {
      onDelete: "set null",
    }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    quantity: doublePrecision("quantity").default(1).notNull(),
    foodNameSnapshot: text("food_name_snapshot").notNull(),
    servingLabelSnapshot: text("serving_label_snapshot"),
    caloriesSnapshot: doublePrecision("calories_snapshot").default(0).notNull(),
    proteinGSnapshot: doublePrecision("protein_g_snapshot")
      .default(0)
      .notNull(),
    carbsGSnapshot: doublePrecision("carbs_g_snapshot").default(0).notNull(),
    fatGSnapshot: doublePrecision("fat_g_snapshot").default(0).notNull(),
    fibreGSnapshot: doublePrecision("fibre_g_snapshot"),
    sugarGSnapshot: doublePrecision("sugar_g_snapshot"),
    sodiumMgSnapshot: doublePrecision("sodium_mg_snapshot"),
    sourceSnapshot: jsonb("source_snapshot").$type<Record<string, unknown>>(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("food_logs_user_date_idx").on(table.userId, table.logDate),
    index("food_logs_food_id_idx").on(table.foodId),
  ],
);

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    weightKg: doublePrecision("weight_kg").notNull(),
    entryWeightValue: doublePrecision("entry_weight_value").notNull(),
    entryWeightUnit: weightUnitEnum("entry_weight_unit").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("weight_logs_user_date_idx").on(table.userId, table.logDate),
  ],
);

export const waterLogs = pgTable(
  "water_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    amountMl: doublePrecision("amount_ml").notNull(),
    entryAmount: doublePrecision("entry_amount").notNull(),
    entryUnit: waterUnitEnum("entry_unit").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("water_logs_user_date_idx").on(table.userId, table.logDate),
  ],
);

export const exerciseLogs = pgTable(
  "exercise_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    activity: varchar("activity", { length: 160 }).notNull(),
    durationMinutes: integer("duration_minutes"),
    caloriesBurned: integer("calories_burned"),
    intensity: varchar("intensity", { length: 80 }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("exercise_logs_user_date_idx").on(table.userId, table.logDate),
  ],
);

export const stepLogs = pgTable(
  "step_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    steps: integer("steps").notNull(),
    source: stepSourceEnum("source").default("manual").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("step_logs_user_date_idx").on(table.userId, table.logDate)],
);

export const bloodPressureLogs = pgTable(
  "blood_pressure_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    systolicMmhg: integer("systolic_mmhg").notNull(),
    diastolicMmhg: integer("diastolic_mmhg").notNull(),
    pulseBpm: integer("pulse_bpm"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("blood_pressure_logs_user_date_idx").on(table.userId, table.logDate),
  ],
);

export const bloodGlucoseLogs = pgTable(
  "blood_glucose_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    logDate: date("log_date").notNull(),
    glucoseMmolL: doublePrecision("glucose_mmol_l").notNull(),
    entryValue: doublePrecision("entry_value").notNull(),
    entryUnit: bloodGlucoseUnitEnum("entry_unit").notNull(),
    context: glucoseContextEnum("context").default("other").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("blood_glucose_logs_user_date_idx").on(table.userId, table.logDate),
  ],
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 220 }).notNull(),
    servingsCount: doublePrecision("servings_count").default(1).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("recipes_user_id_idx").on(table.userId)],
);

export const recipeItems = pgTable(
  "recipe_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id),
    servingId: uuid("serving_id").references(() => servings.id),
    quantity: doublePrecision("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("recipe_items_recipe_id_idx").on(table.recipeId)],
);

export const savedMeals = pgTable(
  "saved_meals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 220 }).notNull(),
    mealType: mealTypeEnum("meal_type"),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("saved_meals_user_id_idx").on(table.userId)],
);

export const savedMealItems = pgTable(
  "saved_meal_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    savedMealId: uuid("saved_meal_id")
      .notNull()
      .references(() => savedMeals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id),
    servingId: uuid("serving_id").references(() => servings.id),
    quantity: doublePrecision("quantity").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("saved_meal_items_saved_meal_id_idx").on(table.savedMealId),
  ],
);

export const foodImages = pgTable(
  "food_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    foodId: uuid("food_id").references(() => foods.id, {
      onDelete: "set null",
    }),
    storagePath: text("storage_path").notNull(),
    rawOcrText: text("raw_ocr_text"),
    parsedOcrJson: jsonb("parsed_ocr_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("food_images_food_id_idx").on(table.foodId)],
);
