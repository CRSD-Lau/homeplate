export type NutrientSnapshot = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
};

export type ServingConversion = {
  id: string;
  isDefault: boolean;
  grams: number | null;
  millilitres: number | null;
};

const optionalNutrients = ["fibreG", "sugarG", "sodiumMg"] as const;

export function scaleNutrients<T extends NutrientSnapshot>(
  nutrients: T,
  quantity: number,
): NutrientSnapshot {
  const scaled: NutrientSnapshot = {
    calories: nutrients.calories * quantity,
    proteinG: nutrients.proteinG * quantity,
    carbsG: nutrients.carbsG * quantity,
    fatG: nutrients.fatG * quantity,
  };

  for (const key of optionalNutrients) {
    const value = nutrients[key];
    scaled[key] = value === null || value === undefined ? null : value * quantity;
  }

  return scaled;
}

export function calculateServingScale({
  baseServing,
  selectedServing,
  quantity,
}: {
  baseServing: ServingConversion;
  selectedServing: ServingConversion;
  quantity: number;
}) {
  if (selectedServing.isDefault || selectedServing.id === baseServing.id) {
    return quantity;
  }

  if (
    baseServing.grams !== null &&
    baseServing.grams > 0 &&
    selectedServing.grams !== null &&
    selectedServing.grams > 0
  ) {
    return (selectedServing.grams / baseServing.grams) * quantity;
  }

  if (
    baseServing.millilitres !== null &&
    baseServing.millilitres > 0 &&
    selectedServing.millilitres !== null &&
    selectedServing.millilitres > 0
  ) {
    return (selectedServing.millilitres / baseServing.millilitres) * quantity;
  }

  return null;
}

export function scaleNutrientsForServing<T extends NutrientSnapshot>(
  nutrients: T,
  options: {
    baseServing: ServingConversion;
    selectedServing: ServingConversion;
    quantity: number;
  },
) {
  const scale = calculateServingScale(options);
  return scale === null ? null : scaleNutrients(nutrients, scale);
}

export function sumNutrients(items: NutrientSnapshot[]): NutrientSnapshot {
  return items.reduce<NutrientSnapshot>(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      proteinG: sum.proteinG + item.proteinG,
      carbsG: sum.carbsG + item.carbsG,
      fatG: sum.fatG + item.fatG,
      fibreG: addOptional(sum.fibreG, item.fibreG),
      sugarG: addOptional(sum.sugarG, item.sugarG),
      sodiumMg: addOptional(sum.sodiumMg, item.sodiumMg),
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fibreG: null,
      sugarG: null,
      sodiumMg: null,
    },
  );
}

function addOptional(
  left: number | null | undefined,
  right: number | null | undefined,
) {
  if (left === null || left === undefined) return right ?? null;
  if (right === null || right === undefined) return left;
  return left + right;
}
