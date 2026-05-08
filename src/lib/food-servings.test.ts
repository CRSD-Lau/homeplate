import { describe, expect, it } from "vitest";

import { parseServingOptionsInput } from "./food-servings";

describe("food serving helpers", () => {
  it("parses serving option lines with gram and millilitre equivalents", () => {
    expect(
      parseServingOptionsInput("1 cup, 240g\nLarge bowl, 480 ml\n1 oz, 28.35g"),
    ).toEqual([
      { label: "1 cup", grams: 240, millilitres: null },
      { label: "Large bowl", grams: null, millilitres: 480 },
      { label: "1 oz", grams: 28.35, millilitres: null },
    ]);
  });

  it("ignores empty and duplicate serving option lines", () => {
    expect(parseServingOptionsInput("\n1 cup, 240g\n 1 cup, 240 g \n")).toEqual([
      { label: "1 cup", grams: 240, millilitres: null },
    ]);
  });

  it("throws for non-default serving options without conversion values", () => {
    expect(() => parseServingOptionsInput("Large bowl")).toThrow(
      "Serving option must include grams or millilitres.",
    );
  });
});
