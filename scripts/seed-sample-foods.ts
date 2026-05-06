import { and, eq, isNull } from "drizzle-orm";

import { closeDb, getDb } from "../src/db";
import {
  dataSources,
  foodNutrientValues,
  foods,
  servings,
} from "../src/db/schema";

const sampleFoods = [
  {
    name: "Egg",
    servingLabel: "1 large egg",
    grams: 50,
    calories: 72,
    proteinG: 6.3,
    carbsG: 0.4,
    fatG: 4.8,
    fibreG: 0,
    sugarG: 0.2,
    sodiumMg: 71,
  },
  {
    name: "Chicken breast",
    servingLabel: "100 g cooked",
    grams: 100,
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    fibreG: 0,
    sugarG: 0,
    sodiumMg: 74,
  },
  {
    name: "Greek yogurt",
    servingLabel: "175 g",
    grams: 175,
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0,
    fibreG: 0,
    sugarG: 5,
    sodiumMg: 65,
  },
  {
    name: "Banana",
    servingLabel: "1 medium",
    grams: 118,
    calories: 105,
    proteinG: 1.3,
    carbsG: 27,
    fatG: 0.4,
    fibreG: 3.1,
    sugarG: 14.4,
    sodiumMg: 1,
  },
  {
    name: "Coffee with cream",
    servingLabel: "1 mug",
    millilitres: 300,
    calories: 45,
    proteinG: 1,
    carbsG: 1.5,
    fatG: 4,
    fibreG: 0,
    sugarG: 1.5,
    sodiumMg: 15,
  },
];

export async function seedSampleFoods() {
  const sourceId = await getManualDataSourceId();

  for (const sample of sampleFoods) {
    const [existing] = await getDb()
      .select({ id: foods.id })
      .from(foods)
      .where(and(eq(foods.name, sample.name), isNull(foods.brand)))
      .limit(1);

    if (existing) continue;

    const [food] = await getDb()
      .insert(foods)
      .values({
        name: sample.name,
        foodType: "manual",
        sourceId,
        confidenceStatus: "manual",
      })
      .returning({ id: foods.id });

    const [serving] = await getDb()
      .insert(servings)
      .values({
        foodId: food.id,
        label: sample.servingLabel,
        grams: "grams" in sample ? sample.grams : null,
        millilitres: "millilitres" in sample ? sample.millilitres : null,
        isDefault: true,
      })
      .returning({ id: servings.id });

    await getDb().insert(foodNutrientValues).values({
      foodId: food.id,
      servingId: serving.id,
      calories: sample.calories,
      proteinG: sample.proteinG,
      carbsG: sample.carbsG,
      fatG: sample.fatG,
      fibreG: sample.fibreG,
      sugarG: sample.sugarG,
      sodiumMg: sample.sodiumMg,
    });
  }

  console.log("Seeded sample foods.");
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

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}`) {
  seedSampleFoods()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(closeDb);
}
