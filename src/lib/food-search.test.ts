import { describe, expect, it } from "vitest";

import { hasFoodSearchQuery, rankFoodSearchResults } from "./food-search";

const baseFood = {
  name: "Food",
  brand: null,
  aliasText: "",
  lastLoggedAt: null,
  isFavorite: false,
  similarity: 0,
};

describe("food search helpers", () => {
  it("detects whether a food search query has real text", () => {
    expect(hasFoodSearchQuery(null)).toBe(false);
    expect(hasFoodSearchQuery(undefined)).toBe(false);
    expect(hasFoodSearchQuery("")).toBe(false);
    expect(hasFoodSearchQuery("   \t\n")).toBe(false);
    expect(hasFoodSearchQuery("pean")).toBe(true);
  });

  it("orders favourites before recent and weaker fuzzy matches", () => {
    const ranked = rankFoodSearchResults("yogurt", [
      {
        ...baseFood,
        id: "weak",
        name: "Plain yoghurt",
        similarity: 0.4,
      },
      {
        ...baseFood,
        id: "recent",
        name: "Greek yogurt",
        lastLoggedAt: new Date("2026-05-07T10:00:00Z"),
        similarity: 0.6,
      },
      {
        ...baseFood,
        id: "favorite",
        name: "Vanilla yogurt",
        isFavorite: true,
        similarity: 0.5,
      },
    ]);

    expect(ranked.map((food) => food.id)).toEqual([
      "favorite",
      "recent",
      "weak",
    ]);
  });

  it("boosts exact and prefix matches over generic fuzzy matches", () => {
    const ranked = rankFoodSearchResults("apple", [
      {
        ...baseFood,
        id: "fuzzy",
        name: "Pineapple chunks",
        similarity: 0.8,
      },
      {
        ...baseFood,
        id: "prefix",
        name: "Apple slices",
        similarity: 0.5,
      },
      {
        ...baseFood,
        id: "alias",
        name: "Fruit bowl",
        aliasText: "apple",
        similarity: 0.4,
      },
    ]);

    expect(ranked.map((food) => food.id)).toEqual([
      "alias",
      "prefix",
      "fuzzy",
    ]);
  });

  it("ranks prefix matches above contains matches above weak unrelated matches", () => {
    const ranked = rankFoodSearchResults("Pean", [
      {
        ...baseFood,
        id: "weak",
        name: "Almond butter",
        similarity: 0.9,
      },
      {
        ...baseFood,
        id: "contains",
        name: "Chocolate peanut cluster",
        similarity: 0.1,
      },
      {
        ...baseFood,
        id: "prefix",
        name: "Peanut butter",
        similarity: 0.1,
      },
    ]);

    expect(ranked.map((food) => food.id)).toEqual([
      "prefix",
      "contains",
      "weak",
    ]);
  });
});
