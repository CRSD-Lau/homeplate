import { describe, expect, it } from "vitest";

import { parseAliasInput } from "./food-aliases";

describe("food alias helpers", () => {
  it("normalizes comma and newline separated aliases", () => {
    expect(
      parseAliasInput("Greek yoghurt, yogurt\n  Yogurt \nprotein bowl"),
    ).toEqual(["greek yoghurt", "yogurt", "protein bowl"]);
  });

  it("drops empty aliases and preserves first-seen order", () => {
    expect(parseAliasInput(" , breakfast oats,,OATS\n")).toEqual([
      "breakfast oats",
      "oats",
    ]);
  });
});
