export type ParsedServingOption = {
  label: string;
  grams: number | null;
  millilitres: number | null;
};

const servingAmountPattern =
  /(-?\d+(?:\.\d+)?)\s*(g|gram|grams|ml|millilitre|millilitres|milliliter|milliliters)\b/i;

export function parseServingOptionsInput(value: string | null | undefined) {
  const servings: ParsedServingOption[] = [];
  const seen = new Set<string>();

  for (const rawLine of (value ?? "").split(/\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
    const amountPart = parts[parts.length - 1] ?? "";
    const match = amountPart.match(servingAmountPattern);

    if (!match) {
      throw new Error("Serving option must include grams or millilitres.");
    }

    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Serving option conversion must be greater than zero.");
    }

    const unit = match[2].toLowerCase();
    const label = parts.slice(0, -1).join(", ").trim();
    if (!label) {
      throw new Error("Serving option must include a label.");
    }

    const serving: ParsedServingOption = {
      label,
      grams: unit.startsWith("g") ? amount : null,
      millilitres: unit.startsWith("m") ? amount : null,
    };
    const key = `${serving.label.toLowerCase()}|${serving.grams ?? ""}|${
      serving.millilitres ?? ""
    }`;

    if (seen.has(key)) continue;
    seen.add(key);
    servings.push(serving);
  }

  return servings;
}

export function formatServingOptionsInput(
  servings: {
    label: string;
    grams: number | null;
    millilitres: number | null;
    isDefault: boolean;
  }[],
) {
  return servings
    .filter((serving) => !serving.isDefault)
    .map((serving) => {
      const amount =
        serving.grams !== null
          ? `${serving.grams}g`
          : `${serving.millilitres ?? ""}ml`;
      return `${serving.label}, ${amount}`;
    })
    .join("\n");
}
