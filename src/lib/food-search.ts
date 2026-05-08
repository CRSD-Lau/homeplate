export type RankedFoodSearchItem = {
  id: string;
  name: string;
  brand: string | null;
  aliasText: string;
  lastLoggedAt: Date | string | null;
  isFavorite: boolean;
  similarity: number;
};

export function rankFoodSearchResults<T extends RankedFoodSearchItem>(
  query: string,
  foods: T[],
) {
  return [...foods].sort((left, right) => {
    const leftScore = scoreFoodSearchResult(query, left);
    const rightScore = scoreFoodSearchResult(query, right);

    if (rightScore !== leftScore) return rightScore - leftScore;
    return left.name.localeCompare(right.name);
  });
}

function scoreFoodSearchResult(query: string, food: RankedFoodSearchItem) {
  const normalizedQuery = normalizeSearchText(query);
  const fields = [food.name, food.brand ?? "", food.aliasText].map(
    normalizeSearchText,
  );
  let score = food.similarity * 10;

  if (food.isFavorite) score += 1000;
  if (food.lastLoggedAt) score += 100;
  if (normalizedQuery) {
    if (fields.some((field) => field === normalizedQuery)) score += 500;
    if (fields.some((field) => field.startsWith(normalizedQuery))) score += 250;
  }

  return score;
}

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
